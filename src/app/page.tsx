import { Download, FileText, GitBranch, Network } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const profileDocuments = [
  "background.md",
  "experience.md",
  "projects/repo-name.md",
];

const workflowSteps = [
  {
    title: "Connect GitHub",
    description: "Select public repositories and add project context.",
  },
  {
    title: "Generate profile docs",
    description: "Create editable Markdown for projects, background, and experience.",
  },
  {
    title: "Activate and reuse",
    description: "Share, export, or connect AI tools through read-only MCP access.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="size-5" aria-hidden="true" />
              <span className="font-heading text-lg font-medium">DevMD</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              A persistent context layer for developers and AI tools.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Private beta soon</Badge>
            <ThemeToggle />
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-7">
            <div className="space-y-4">
              <Badge variant="outline">Canonical developer profiles</Badge>
              <h1 className="max-w-3xl text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
                Turn your GitHub work into reusable developer context.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                DevMD creates structured Markdown documents for your projects,
                background, and experience so humans and AI tools can understand
                your work without repeated explanations.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg">
                Join the waitlist
              </Button>
              <Button size="lg" variant="outline">
                View product vision
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {workflowSteps.map((step, index) => (
                <div
                  className="rounded-lg border border-border bg-muted/30 p-4"
                  key={step.title}
                >
                  <p className="font-mono text-sm text-muted-foreground">
                    0{index + 1}
                  </p>
                  <h2 className="mt-3 text-sm font-medium">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle>Your profile, as Markdown</CardTitle>
              <CardDescription>
                Editable files that become the source of truth for your work.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileDocuments.map((document) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-3"
                  key={document}
                >
                  <span className="font-mono text-sm">{document}</span>
                  <Badge variant="outline">Editable</Badge>
                </div>
              ))}
              <div className="rounded-lg border border-border bg-background/60 p-4">
                <p className="font-mono text-sm text-muted-foreground">
                  # Project overview
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  A concise explanation of what you built, why it matters, how it
                  works, and how to talk about it in interviews.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 pb-10 md:grid-cols-3">
          <Card>
            <CardHeader>
              <GitBranch className="size-5 text-muted-foreground" aria-hidden="true" />
              <CardTitle>Project brains</CardTitle>
              <CardDescription>
                Generate one Markdown document per selected public repository.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Network className="size-5 text-muted-foreground" aria-hidden="true" />
              <CardTitle>Read-only MCP</CardTitle>
              <CardDescription>
                Let connected AI tools query activated profile sections securely.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Download className="size-5 text-muted-foreground" aria-hidden="true" />
              <CardTitle>Export anywhere</CardTitle>
              <CardDescription>
                Download Markdown, copy sections, or share a public profile link.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </section>
    </main>
  );
}
