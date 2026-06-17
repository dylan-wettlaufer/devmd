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
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/dashboard");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="secondary">Signed in</Badge>
            <h1 className="mt-3 text-3xl font-medium tracking-tight">
              DevMD workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              GitHub OAuth is connected. Next, this workspace will guide repo
              selection, project context, profile generation, and activation.
            </p>
          </div>
          <form action="/auth/sign-out" method="post">
            <Button variant="outline" type="submit">
              Sign out
            </Button>
          </form>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Repository selection", "Choose public GitHub repos for Project Brain generation."],
            ["Profile documents", "Edit background.md, experience.md, and project Markdown."],
            ["Activation", "Unlock export and read-only MCP once profile requirements are met."],
          ].map(([title, description]) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current session</CardTitle>
            <CardDescription>
              Supabase Auth user details available to server components.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm text-muted-foreground">
              {user.email ?? user.id}
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
