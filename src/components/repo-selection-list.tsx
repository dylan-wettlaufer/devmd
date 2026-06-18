"use client";

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
  return count === 1 ? "Continue with 1 repo" : `Continue with ${count} repos`;
}

export function RepoSelectionList({
  repositories,
}: {
  repositories: GithubRepositorySummary[];
}) {
  const [selectedRepoIds, setSelectedRepoIds] = useState<Set<number>>(
    () => new Set()
  );
  const selectedRepositories = useMemo(
    () => repositories.filter((repository) => selectedRepoIds.has(repository.id)),
    [repositories, selectedRepoIds]
  );
  const continueHref = useMemo(() => {
    const params = new URLSearchParams();

    selectedRepositories.forEach((repository) => {
      params.append("repo", repository.url);
    });

    return `/dashboard?${params.toString()}`;
  }, [selectedRepositories]);

  function toggleRepository(repositoryId: number) {
    setSelectedRepoIds((currentRepoIds) => {
      const nextRepoIds = new Set(currentRepoIds);

      if (nextRepoIds.has(repositoryId)) {
        nextRepoIds.delete(repositoryId);
      } else {
        nextRepoIds.add(repositoryId);
      }

      return nextRepoIds;
    });
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
              {getRepoCountLabel(selectedRepositories.length)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Public, owned, active</Badge>
          {selectedRepositories.length > 0 ? (
            <Button asChild>
              <a href={continueHref}>{getContinueLabel(selectedRepositories.length)}</a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {repositories.map((repository) => {
          const isSelected = selectedRepoIds.has(repository.id);

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
                      onClick={() => toggleRepository(repository.id)}
                      type="button"
                      variant={isSelected ? "secondary" : "default"}
                    >
                      {isSelected ? "Remove" : "Select repo"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
