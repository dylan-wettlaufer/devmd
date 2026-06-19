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

function getProfileStatus(value: unknown) {
  if (typeof value !== "object" || value === null || !("profile_status" in value)) {
    return "draft";
  }

  const profileStatus = value.profile_status;

  return typeof profileStatus === "string" ? profileStatus : "draft";
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("profile_status")
    .eq("id", user.id)
    .maybeSingle();
  const profileStatus = getProfileStatus(profile);

  if (profileStatus !== "activated" && profileStatus !== "connected") {
    redirect("/onboarding/review");
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
              Your profile is activated. Manage your Markdown profile, exports,
              and connected tools from this workspace.
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
            ["Profile documents", "Review and maintain background.md, experience.md, and project Markdown."],
            ["Export", "Download Markdown, copy sections, or prepare a public profile link."],
            ["Connected tools", "Connect AI tools once read-only MCP access is available."],
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
              Supabase Auth user and profile lifecycle details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm text-muted-foreground">
              {user.email ?? user.id}
            </p>
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              profile_status: {profileStatus}
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
