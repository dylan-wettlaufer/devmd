"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Check,
  CircleDot,
  ExternalLink,
  GitBranch,
  GitFork,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GithubRepositorySummary } from "@/lib/github-repos";

const maxSelectedRepositories = 3;

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

function getRepoCountLabel(count: number) {
  return count === 1 ? "1 repository selected" : `${count} repositories selected`;
}

function getContinueLabel(count: number) {
  return count === 1
    ? "Start AI generation for 1 repo"
    : `Start AI generation for ${count} repos`;
}

export function RepoSelectionList({
  repositories,
}: {
  repositories: GithubRepositorySummary[];
}) {
  const router = useRouter();
  const [selectedRepoIds, setSelectedRepoIds] = useState<Set<number>>(
    () => new Set()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const selectedRepositories = useMemo(
    () => repositories.filter((repository) => selectedRepoIds.has(repository.id)),
    [repositories, selectedRepoIds]
  );
  const hasReachedSelectionLimit =
    selectedRepositories.length >= maxSelectedRepositories;

  function toggleRepository(repositoryId: number) {
    setSelectedRepoIds((currentRepoIds) => {
      const nextRepoIds = new Set(currentRepoIds);

      if (nextRepoIds.has(repositoryId)) {
        nextRepoIds.delete(repositoryId);
      } else if (nextRepoIds.size < maxSelectedRepositories) {
        nextRepoIds.add(repositoryId);
      } else {
        setSubmitError(`You can select up to ${maxSelectedRepositories} repos for now.`);
      }

      return nextRepoIds;
    });
  }

  async function queueSelectedRepositories() {
    if (selectedRepositories.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/projects/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositories: selectedRepositories,
        }),
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Could not queue selected repositories.");
      }

      router.push("/onboarding/background");
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not queue selected repositories."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Showing {repositories.length} selectable repositories.
          </p>
          {selectedRepositories.length > 0 ? (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {getRepoCountLabel(selectedRepositories.length)} /{" "}
              {maxSelectedRepositories} max
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Public, owned, active</Badge>
        </div>
      </div>
      {submitError ? (
        <p className="text-sm text-destructive">{submitError}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {repositories.map((repository) => {
          const isSelected = selectedRepoIds.has(repository.id);
          const isSelectionDisabled = !isSelected && hasReachedSelectionLimit;

          return (
            <Card
              className={
                isSelected
                  ? "bg-muted/20 ring-primary/40"
                  : "bg-muted/20"
              }
              key={repository.id}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{repository.name}</CardTitle>
                    <CardDescription className="mt-1 truncate font-mono text-xs">
                      {repository.fullName}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    {isSelected ? (
                      <Badge>
                        <Check className="size-3" aria-hidden="true" />
                        Selected
                      </Badge>
                    ) : null}
                    {repository.language ? (
                      <Badge variant="outline">{repository.language}</Badge>
                    ) : null}
                  </div>
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
                    <Button
                      aria-pressed={isSelected}
                      disabled={isSelectionDisabled}
                      onClick={() => toggleRepository(repository.id)}
                      type="button"
                      variant={isSelected ? "secondary" : "default"}
                    >
                      {isSelected
                        ? "Remove"
                        : isSelectionDisabled
                          ? "Limit reached"
                          : "Select repo"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-4 z-10 rounded-lg border border-border bg-background/95 p-4 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              {selectedRepositories.length > 0
                ? getRepoCountLabel(selectedRepositories.length)
                : "Select one or more repositories"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecting a repo only adds it to this list. Use this button when
              you are ready to start generation. Max{" "}
              {maxSelectedRepositories} repos.
            </p>
          </div>
          <Button
            disabled={selectedRepositories.length === 0 || isSubmitting}
            onClick={queueSelectedRepositories}
            type="button"
          >
            {isSubmitting
              ? "Starting generation"
              : selectedRepositories.length > 0
                ? getContinueLabel(selectedRepositories.length)
                : "Select repos first"}
          </Button>
        </div>
      </div>
    </>
  );
}
