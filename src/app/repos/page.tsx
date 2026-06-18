import { RefreshCw } from "lucide-react";
import { redirect } from "next/navigation";

import { RepoSelectionList } from "@/components/repo-selection-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  listSelectableGithubRepositories,
  type GithubRepositorySummary,
} from "@/lib/github-repos";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ReposPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/repos");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const githubAccessToken = session?.provider_token;
  let repositories: GithubRepositorySummary[] = [];
  let fetchError = "";

  if (githubAccessToken) {
    try {
      repositories = await listSelectableGithubRepositories(githubAccessToken);
    } catch (error) {
      fetchError =
        error instanceof Error
          ? error.message
          : "Could not load GitHub repositories.";
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="secondary">Protected workspace</Badge>
            <h1 className="mt-3 text-3xl font-medium tracking-tight">
              Choose a repository
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Select from public GitHub repositories you own. Forks and archived
              repositories are filtered out so only active source projects appear.
            </p>
          </div>
          <form action="/auth/sign-out" method="post">
            <Button variant="outline" type="submit">
              Sign out
            </Button>
          </form>
        </header>

        {!githubAccessToken ? (
          <Card>
            <CardHeader>
              <CardTitle>Reconnect GitHub</CardTitle>
              <CardDescription>
                The current session does not include a GitHub access token.
                Sign in again so DevMD can read your public repository list.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/auth/sign-in?next=/repos">
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Reconnect GitHub
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : fetchError ? (
          <Card>
            <CardHeader>
              <CardTitle>Could not load repositories</CardTitle>
              <CardDescription>{fetchError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <a href="/auth/sign-in?next=/repos">
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Try reconnecting
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : repositories.length > 0 ? (
          <RepoSelectionList repositories={repositories} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No selectable repositories found</CardTitle>
              <CardDescription>
                DevMD did not find any public repositories you own that are both
                active and not forks.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </main>
  );
}
