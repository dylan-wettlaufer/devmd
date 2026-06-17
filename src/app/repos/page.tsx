import {
  CircleDot,
  ExternalLink,
  GitBranch,
  GitFork,
  RefreshCw,
  Star,
} from "lucide-react";
import { redirect } from "next/navigation";

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

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "No pushes yet";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function RepositoryCard({ repository }: { repository: GithubRepositorySummary }) {
  return (
    <Card className="bg-muted/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{repository.name}</CardTitle>
            <CardDescription className="mt-1 truncate font-mono text-xs">
              {repository.fullName}
            </CardDescription>
          </div>
          {repository.language ? (
            <Badge variant="outline">{repository.language}</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="min-h-12 text-sm leading-6 text-muted-foreground">
          {repository.description ?? "No repository description yet."}
        </p>

        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <span className="flex items-center gap-2">
            <Star className="size-4" aria-hidden="true" />
            {formatNumber(repository.stars)} stars
          </span>
          <span className="flex items-center gap-2">
            <GitFork className="size-4" aria-hidden="true" />
            {formatNumber(repository.forks)} forks
          </span>
          <span className="flex items-center gap-2">
            <CircleDot className="size-4" aria-hidden="true" />
            {formatNumber(repository.openIssues)} issues
          </span>
          <span className="flex items-center gap-2">
            <GitBranch className="size-4" aria-hidden="true" />
            {repository.defaultBranch}
          </span>
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-muted-foreground">
            Pushed {formatDate(repository.pushedAt)}
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <a href={repository.url} target="_blank" rel="noreferrer">
                View
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild>
              <a href={`/dashboard?repo=${encodeURIComponent(repository.url)}`}>
                Select repo
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Showing {repositories.length} selectable repositories.
              </p>
              <Badge variant="outline">Public, owned, active</Badge>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {repositories.map((repository) => (
                <RepositoryCard
                  key={repository.id}
                  repository={repository}
                />
              ))}
            </div>
          </>
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
