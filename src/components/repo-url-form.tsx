"use client";

import { FormEvent, useId, useState } from "react";
import { ArrowRight, GitBranch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateGithubRepoUrl } from "@/lib/github-url";

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
