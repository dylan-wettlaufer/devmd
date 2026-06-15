"use client";

import { FormEvent, useId, useState } from "react";
import { ArrowRight, GitBranch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const githubOwnerPattern =
  /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const githubRepoPattern = /^(?!\.{1,2}$)[a-z\d._-]{1,100}$/i;

function validateGithubRepoUrl(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "Enter a public GitHub repository URL.";
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmedValue);
  } catch {
    return "Use a full URL like https://github.com/owner/repo.";
  }

  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "github.com") {
    return "Use a public GitHub URL starting with https://github.com/.";
  }

  if (parsedUrl.search || parsedUrl.hash) {
    return "Remove query strings or anchors from the repository URL.";
  }

  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

  if (pathParts.length !== 2) {
    return "Use the repository root URL, for example https://github.com/owner/repo.";
  }

  const [owner, rawRepo] = pathParts;
  const repo = rawRepo.endsWith(".git") ? rawRepo.slice(0, -4) : rawRepo;

  if (!githubOwnerPattern.test(owner) || !githubRepoPattern.test(repo)) {
    return "Use a valid GitHub owner and repository name.";
  }

  return "";
}

export function RepoUrlForm() {
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const descriptionId = `${inputId}-description`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateGithubRepoUrl(repoUrl);
    setError(validationError);
  }

  const hasError = Boolean(error);

  return (
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
        <Button size="lg" type="submit">
          Generate
          <ArrowRight data-icon="inline-end" />
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
  );
}
