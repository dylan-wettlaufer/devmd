"use client";

import { FormEvent, useId, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  FileText,
  GitBranch,
  GitFork,
  Loader2,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { validateGithubRepoUrl } from "@/lib/github-url";

type AnalyzeRepoSuccess = {
  repository: {
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    normalizedUrl: string;
    defaultBranch: string;
    language: string | null;
    fork: boolean;
    stars: number;
    forks: number;
    openIssues: number;
    license: {
      key: string;
      name: string;
      spdxId: string;
    } | null;
    owner: {
      login: string;
      avatarUrl: string;
      url: string;
    };
    createdAt: string;
    updatedAt: string;
    pushedAt: string;
    sizeKb: number;
  };
  readme: string | null;
  tree: {
    sha: string;
    truncated: boolean;
    totalCount: number;
    filteredCount: number;
    ignoredCount: number;
    items: Array<{
      path: string;
      type: "blob" | "tree" | "commit";
      size: number | null;
    }>;
  };
};

type AnalyzeRepoError = {
  error: string;
};

type AnalyzeRepoResponse = AnalyzeRepoSuccess | AnalyzeRepoError;

type ContextQuestionId = "goal" | "proudOf" | "challenge";

type ContextAnswers = Record<ContextQuestionId, string>;

type ContextQuestion = {
  id: ContextQuestionId;
  label: string;
  helperText: string;
  placeholder: string;
};

const filePreviewLimit = 8;
const initialContextAnswers: ContextAnswers = {
  goal: "",
  proudOf: "",
  challenge: "",
};
const contextQuestions: ContextQuestion[] = [
  {
    id: "goal",
    label: "What was your goal with this project?",
    helperText: "Focus on the user problem, learning goal, or portfolio purpose.",
    placeholder: "Example: I built this to help users track job applications...",
  },
  {
    id: "proudOf",
    label: "What part are you most proud of?",
    helperText: "Call out the feature, architecture choice, or detail you want highlighted.",
    placeholder: "Example: The parser handles messy input and keeps the UI responsive...",
  },
  {
    id: "challenge",
    label: "Any challenge or tradeoff you want included?",
    helperText: "Mention constraints, hard bugs, decisions, or compromises.",
    placeholder: "Example: I chose a simpler data model to ship the MVP faster...",
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

export function RepoUrlForm() {
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeRepoSuccess | null>(
    null
  );
  const [contextAnswers, setContextAnswers] =
    useState<ContextAnswers>(initialContextAnswers);
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const descriptionId = `${inputId}-description`;
  const resultId = `${inputId}-result`;
  const contextId = `${inputId}-context`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateGithubRepoUrl(repoUrl);

    if (validationError) {
      setError(validationError);
      setAnalysisResult(null);
      setContextAnswers(initialContextAnswers);
      return;
    }

    setError("");
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: repoUrl }),
      });
      const responseBody = (await response.json()) as AnalyzeRepoResponse;

      if (!response.ok || "error" in responseBody) {
        setError(
          "error" in responseBody
            ? responseBody.error
            : "Could not analyze this repository."
        );
        setAnalysisResult(null);
        return;
      }

      setAnalysisResult(responseBody);
      setContextAnswers(initialContextAnswers);
    } catch {
      setError("Could not connect to the repo analyzer. Try again in a moment.");
      setAnalysisResult(null);
      setContextAnswers(initialContextAnswers);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function updateContextAnswer(id: ContextQuestionId, value: string) {
    setContextAnswers((currentAnswers) => ({
      ...currentAnswers,
      [id]: value,
    }));
  }

  const hasError = Boolean(error);
  const previewItems = analysisResult?.tree.items
    .filter((item) => item.type === "blob")
    .slice(0, filePreviewLimit);
  const answeredContextCount = Object.values(contextAnswers).filter((answer) =>
    answer.trim()
  ).length;

  return (
    <div className="space-y-4">
      <form className="space-y-2" noValidate onSubmit={handleSubmit}>
        <label className="text-sm font-medium" htmlFor={inputId}>
          GitHub repository URL
        </label>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <GitBranch
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-describedby={hasError ? errorId : descriptionId}
              aria-invalid={hasError}
              autoCapitalize="none"
              autoComplete="url"
              className="pl-8"
              disabled={isAnalyzing}
              id={inputId}
              inputMode="url"
              onChange={(event) => {
                setRepoUrl(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="https://github.com/username/project"
              type="url"
              value={repoUrl}
            />
          </div>
          <Button disabled={isAnalyzing} size="lg" type="submit">
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Analyzing...
              </>
            ) : (
              <>
                Generate
                <ArrowRight data-icon="inline-end" />
              </>
            )}
          </Button>
        </div>
        {hasError ? (
          <p className="text-sm text-destructive" id={errorId}>
            {error}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground" id={descriptionId}>
            Public GitHub repo roots only.
          </p>
        )}
      </form>

      {analysisResult ? (
        <section
          aria-live="polite"
          className="space-y-4 rounded-lg border border-border bg-muted/30 p-4"
          id={resultId}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-medium">
                  {analysisResult.repository.fullName}
                </h3>
                <Badge variant="secondary">
                  {analysisResult.repository.language ?? "Language unknown"}
                </Badge>
                {analysisResult.repository.fork ? (
                  <Badge variant="outline">Fork</Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {analysisResult.repository.description ??
                  "No repository description provided."}
              </p>
            </div>
            <a
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              href={analysisResult.repository.url}
              rel="noreferrer"
              target="_blank"
            >
              View on GitHub
            </a>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Default branch</p>
              <p className="mt-1 font-mono text-sm">
                {analysisResult.repository.defaultBranch}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3" aria-hidden="true" />
                Stars
              </p>
              <p className="mt-1 font-mono text-sm">
                {formatNumber(analysisResult.repository.stars)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <GitFork className="size-3" aria-hidden="true" />
                Forks
              </p>
              <p className="mt-1 font-mono text-sm">
                {formatNumber(analysisResult.repository.forks)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="size-3" aria-hidden="true" />
                README
              </p>
              <p className="mt-1 font-mono text-sm">
                {analysisResult.readme ? "Detected" : "Not found"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Total paths</p>
                <p className="mt-1 font-mono text-sm">
                  {formatNumber(analysisResult.tree.totalCount)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Analyzed paths</p>
                <p className="mt-1 font-mono text-sm">
                  {formatNumber(analysisResult.tree.filteredCount)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Ignored paths</p>
                <p className="mt-1 font-mono text-sm">
                  {formatNumber(analysisResult.tree.ignoredCount)}
                </p>
              </div>
            </div>

            {analysisResult.tree.truncated ? (
              <p className="flex gap-2 rounded-lg border border-border bg-background/60 p-3 text-sm text-muted-foreground">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                GitHub truncated this repository tree, so the next analysis step
                may need smarter file sampling.
              </p>
            ) : null}

            {previewItems && previewItems.length > 0 ? (
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <p className="text-sm font-medium">File sample</p>
                <ul className="mt-2 space-y-1">
                  {previewItems.map((item) => (
                    <li
                      className="truncate font-mono text-xs text-muted-foreground"
                      key={item.path}
                    >
                      {item.path}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {analysisResult ? (
        <section
          aria-labelledby={contextId}
          className="space-y-4 rounded-lg border border-border bg-background/60 p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ClipboardList
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-base font-medium" id={contextId}>
                  Add project context
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                These answers will help the Project Brain explain the work in your
                voice during the generation step.
              </p>
            </div>
            <Badge variant="outline">
              {answeredContextCount} of {contextQuestions.length} answered
            </Badge>
          </div>

          <div className="space-y-3">
            {contextQuestions.map((question) => {
              const questionInputId = `${inputId}-${question.id}`;
              const questionHelpId = `${questionInputId}-help`;

              return (
                <div className="space-y-1.5" key={question.id}>
                  <label
                    className="text-sm font-medium"
                    htmlFor={questionInputId}
                  >
                    {question.label}
                  </label>
                  <Textarea
                    aria-describedby={questionHelpId}
                    className="min-h-20 resize-y"
                    id={questionInputId}
                    onChange={(event) =>
                      updateContextAnswer(question.id, event.target.value)
                    }
                    placeholder={question.placeholder}
                    value={contextAnswers[question.id]}
                  />
                  <p
                    className="text-xs text-muted-foreground"
                    id={questionHelpId}
                  >
                    {question.helperText}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Next, these answers can be combined with selected key files before the
            AI generation pipeline renders the Project Brain Markdown.
          </p>
        </section>
      ) : null}
    </div>
  );
}
