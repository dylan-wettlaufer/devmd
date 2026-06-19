"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, FileText, Loader2, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ExperienceSourceType = "resume" | "manual";

type GenerateExperienceResponse = {
  jobId?: string;
  error?: string;
};

const minimumExperienceLength = 50;

export function ExperienceForm() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<ExperienceSourceType | null>(null);
  const [manualExperience, setManualExperience] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const manualCharacterCount = manualExperience.trim().length;
  const isComplete = useMemo(() => {
    if (sourceType === "resume") {
      return selectedFile !== null;
    }

    if (sourceType === "manual") {
      return manualCharacterCount >= minimumExperienceLength;
    }

    return false;
  }, [manualCharacterCount, selectedFile, sourceType]);

  function chooseSourceType(nextSourceType: ExperienceSourceType) {
    setSourceType(nextSourceType);
    setError("");

    if (nextSourceType === "resume") {
      setManualExperience("");
      return;
    }

    setSelectedFile(null);
    setFileInputKey((currentKey) => currentKey + 1);
  }

  function updateManualExperience(value: string) {
    setManualExperience(value);

    if (error) {
      setError("");
    }
  }

  function updateSelectedFile(file: File | null) {
    setSelectedFile(file);

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sourceType) {
      setError("Choose resume upload or manual entry before continuing.");
      return;
    }

    if (!isComplete) {
      setError(
        sourceType === "resume"
          ? "Upload a resume file before continuing."
          : "Enter at least 50 characters of experience details."
      );
      return;
    }

    const formData = new FormData();
    formData.set("sourceType", sourceType);

    if (sourceType === "resume" && selectedFile) {
      formData.set("resumeFile", selectedFile);
    }

    if (sourceType === "manual") {
      formData.set("manualExperience", manualExperience);
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/experience/generate", {
        method: "POST",
        body: formData,
      });
      const responseBody = (await response.json()) as GenerateExperienceResponse;

      if (!response.ok) {
        throw new Error(responseBody.error ?? "Could not queue experience generation.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not queue experience generation."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="bg-muted/20">
      <CardHeader>
        <CardTitle>Experience source</CardTitle>
        <CardDescription>
          Choose one way to provide experience details. DevMD will use only that
          source to draft experience.md.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              aria-pressed={sourceType === "resume"}
              className={cn(
                "rounded-lg border border-border bg-background/60 p-4 text-left transition-colors hover:bg-muted",
                sourceType === "resume" ? "border-primary bg-primary/5" : ""
              )}
              disabled={isSubmitting}
              onClick={() => chooseSourceType("resume")}
              type="button"
            >
              <FileText className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
              <span className="block text-sm font-medium">Upload resume</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                Upload a PDF, DOCX, TXT, or Markdown file.
              </span>
            </button>

            <button
              aria-pressed={sourceType === "manual"}
              className={cn(
                "rounded-lg border border-border bg-background/60 p-4 text-left transition-colors hover:bg-muted",
                sourceType === "manual" ? "border-primary bg-primary/5" : ""
              )}
              disabled={isSubmitting}
              onClick={() => chooseSourceType("manual")}
              type="button"
            >
              <PenLine className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
              <span className="block text-sm font-medium">Enter manually</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                Paste roles, responsibilities, education, skills, or highlights.
              </span>
            </button>
          </div>

          {sourceType === "resume" ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="resume-file">
                Resume file
              </label>
              <Input
                accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                disabled={isSubmitting}
                id="resume-file"
                key={fileInputKey}
                onChange={(event) =>
                  updateSelectedFile(event.target.files?.item(0) ?? null)
                }
                required
                type="file"
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Files must be 5 MB or smaller. Uploaded content is parsed into text
                before generation starts.
              </p>
              {selectedFile ? (
                <p className="text-xs leading-5 text-muted-foreground">
                  Selected: {selectedFile.name}
                </p>
              ) : null}
            </div>
          ) : null}

          {sourceType === "manual" ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="manual-experience">
                Experience details
              </label>
              <Textarea
                disabled={isSubmitting}
                id="manual-experience"
                minLength={minimumExperienceLength}
                onChange={(event) => updateManualExperience(event.target.value)}
                placeholder="Example: List your roles, dates, responsibilities, technical projects, education, certifications, skills, and measurable outcomes."
                required
                rows={10}
                value={manualExperience}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                {manualCharacterCount} characters entered. Include facts only; DevMD
                will not invent missing employers, dates, or credentials.
              </p>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Continue is available after one experience source is complete.
            </p>
            <Button disabled={!isComplete || isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Starting generation
                </>
              ) : (
                <>
                  Finish onboarding
                  <ArrowRight data-icon="inline-end" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
