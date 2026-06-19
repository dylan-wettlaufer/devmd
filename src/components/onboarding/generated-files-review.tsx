"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type {
  OnboardingReviewSnapshot,
  ReviewDocument,
  ReviewDocumentStatus,
} from "@/lib/onboarding-review";
import { cn } from "@/lib/utils";

type GeneratedFilesReviewProps = {
  initialSnapshot: OnboardingReviewSnapshot;
};

type ApiResponse = {
  error?: string;
};

function getStatusLabel(status: ReviewDocumentStatus) {
  if (status === "reviewed") {
    return "Reviewed";
  }

  if (status === "ready") {
    return "Ready";
  }

  if (status === "failed") {
    return "Failed";
  }

  return "Generating";
}

function getStatusIcon(status: ReviewDocumentStatus) {
  if (status === "reviewed") {
    return <CheckCircle2 aria-hidden="true" className="size-4 text-primary" />;
  }

  if (status === "failed") {
    return <AlertTriangle aria-hidden="true" className="size-4 text-destructive" />;
  }

  if (status === "pending") {
    return <Loader2 aria-hidden="true" className="size-4 animate-spin text-muted-foreground" />;
  }

  return <Clock aria-hidden="true" className="size-4 text-muted-foreground" />;
}

function getDocumentDescription(document: ReviewDocument) {
  if (document.status === "pending") {
    return "Generation is still running. This page will refresh automatically.";
  }

  if (document.status === "failed") {
    return document.errorMessage ?? "Generation failed. Try regenerating this file later.";
  }

  if (document.status === "reviewed") {
    return "Approved and ready for activation.";
  }

  return "Review the Markdown, edit anything needed, then approve this file.";
}

export function GeneratedFilesReview({ initialSnapshot }: GeneratedFilesReviewProps) {
  const router = useRouter();
  const [activeDocumentId, setActiveDocumentId] = useState(
    initialSnapshot.documents[0]?.id ?? ""
  );
  const [draftsByDocumentId, setDraftsByDocumentId] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const activeDocument = useMemo(
    () =>
      initialSnapshot.documents.find((document) => document.id === activeDocumentId) ??
      initialSnapshot.documents[0] ??
      null,
    [activeDocumentId, initialSnapshot.documents]
  );
  const draftMarkdown = activeDocument
    ? draftsByDocumentId[activeDocument.id] ?? activeDocument.markdown
    : "";

  useEffect(() => {
    if (!initialSnapshot.hasPendingDocuments) {
      return;
    }

    const refreshInterval = window.setInterval(() => {
      router.refresh();
    }, 5000);

    return () => window.clearInterval(refreshInterval);
  }, [initialSnapshot.hasPendingDocuments, router]);

  async function approveActiveDocument() {
    if (!activeDocument) {
      return;
    }

    setIsApproving(true);
    setActionError("");

    try {
      const response = await fetch("/api/onboarding/review/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: activeDocument.id,
          markdown: draftMarkdown,
        }),
      });
      const responseBody = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(responseBody.error ?? "Could not approve this file.");
      }

      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not approve this file.");
    } finally {
      setIsApproving(false);
    }
  }

  async function activateProfile() {
    setIsActivating(true);
    setActionError("");

    try {
      const response = await fetch("/api/onboarding/activate", {
        method: "POST",
      });
      const responseBody = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(responseBody.error ?? "Could not activate your profile.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not activate your profile."
      );
    } finally {
      setIsActivating(false);
    }
  }

  const canApprove =
    activeDocument !== null &&
    (activeDocument.status === "ready" || activeDocument.status === "reviewed") &&
    draftMarkdown.trim().length > 0 &&
    !isApproving;

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <Card className="bg-muted/20">
          <CardHeader>
            <CardTitle>Generated files</CardTitle>
            <CardDescription>
              {initialSnapshot.documents.filter((document) => document.status === "reviewed")
                .length}{" "}
              of {initialSnapshot.documents.length} approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {initialSnapshot.documents.map((document) => (
              <button
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border border-border bg-background/60 p-3 text-left transition-colors hover:bg-muted",
                  document.id === activeDocument?.id ? "border-primary bg-primary/5" : ""
                )}
                key={document.id}
                onClick={() => {
                  setActiveDocumentId(document.id);
                  setActionError("");
                }}
                type="button"
              >
                <span className="mt-0.5">{getStatusIcon(document.status)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{document.title}</span>
                  <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                    {document.filePath}
                  </span>
                </span>
                <Badge
                  variant={document.status === "failed" ? "destructive" : "outline"}
                >
                  {getStatusLabel(document.status)}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activation requirements</CardTitle>
            <CardDescription>
              Approve every generated file before activating the profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {initialSnapshot.requirements.map((requirement) => (
              <div className="flex gap-2 text-sm" key={requirement.id}>
                {requirement.met ? (
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 text-primary" />
                ) : (
                  <Clock aria-hidden="true" className="mt-0.5 size-4 text-muted-foreground" />
                )}
                <span className={requirement.met ? "" : "text-muted-foreground"}>
                  {requirement.label}
                </span>
              </div>
            ))}
            <Button
              className="w-full"
              disabled={!initialSnapshot.canActivate || isActivating}
              onClick={activateProfile}
              type="button"
            >
              {isActivating ? (
                <>
                  <Loader2 aria-hidden="true" className="animate-spin" />
                  Activating
                </>
              ) : (
                "Activate profile"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{activeDocument?.title ?? "No files yet"}</CardTitle>
              <CardDescription>
                {activeDocument
                  ? getDocumentDescription(activeDocument)
                  : "Select a generated file to review it."}
              </CardDescription>
            </div>
            {activeDocument ? (
              <Badge variant={activeDocument.status === "failed" ? "destructive" : "outline"}>
                {getStatusLabel(activeDocument.status)}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            className="min-h-[560px] font-mono text-sm"
            disabled={
              !activeDocument ||
              activeDocument.status === "pending" ||
              activeDocument.status === "failed" ||
              isApproving
            }
            onChange={(event) =>
              setDraftsByDocumentId((currentDrafts) =>
                activeDocument
                  ? {
                      ...currentDrafts,
                      [activeDocument.id]: event.target.value,
                    }
                  : currentDrafts
              )
            }
            placeholder="Generated Markdown will appear here when it is ready."
            value={draftMarkdown}
          />

          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Approval saves the current Markdown as the latest reviewed version.
            </p>
            <Button disabled={!canApprove} onClick={approveActiveDocument} type="button">
              {isApproving ? (
                <>
                  <Loader2 aria-hidden="true" className="animate-spin" />
                  Saving approval
                </>
              ) : (
                "Save and approve"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
