import { FileText, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RepoUrlForm } from "@/components/repo-url-form";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const projectBrainSections = [
  "Overview",
  "Problem",
  "Architecture",
  "Tradeoffs",
  "Interview Narrative",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="size-5" aria-hidden="true" />
              <span className="font-heading text-lg font-semibold">DevMD</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate recruiter-ready Project Brains from public GitHub repos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">MVP workspace</Badge>
            <ThemeToggle />
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Analyze a repository</CardTitle>
              <CardDescription>
                Paste a public GitHub URL to start the structured generation flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <RepoUrlForm />

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["1", "Fetch repo structure"],
                  ["2", "Ask context questions"],
                  ["3", "Render Markdown brain"],
                ].map(([step, label]) => (
                  <div
                    className="rounded-lg border border-border bg-muted/40 p-3 text-sm"
                    key={step}
                  >
                    <span className="text-muted-foreground">Step {step}</span>
                    <p className="mt-1 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Brain output</CardTitle>
              <CardDescription>
                The generated Markdown follows the strict PRD section structure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectBrainSections.map((section) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  key={section}
                >
                  <span className="text-sm font-medium">{section}</span>
                  <Badge variant="outline">Editable</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle>Refinement modes</CardTitle>
            </div>
            <CardDescription>
              Regenerate sections for portfolio, resume, recruiter, and interview use cases.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {["Simplify", "More technical", "Recruiter mode", "Resume bullets"].map(
              (mode) => (
                <Button key={mode} variant="outline">
                  {mode}
                </Button>
              )
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
