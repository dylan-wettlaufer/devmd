"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type BackgroundQuestionId =
  | "currentDescription"
  | "targetRoles"
  | "comfortableTechnologies"
  | "enjoyedProblems"
  | "currentImprovement";

type BackgroundAnswers = Record<BackgroundQuestionId, string>;

type BackgroundQuestion = {
  id: BackgroundQuestionId;
  label: string;
  helperText: string;
  placeholder: string;
};

type GenerateBackgroundResponse = {
  jobId?: string;
  error?: string;
};

const initialAnswers: BackgroundAnswers = {
  currentDescription: "",
  targetRoles: "",
  comfortableTechnologies: "",
  enjoyedProblems: "",
  currentImprovement: "",
};

const backgroundQuestions: BackgroundQuestion[] = [
  {
    id: "currentDescription",
    label: "Which best describes you right now?",
    helperText: "Mention your current career stage, learning path, or role.",
    placeholder: "Example: I am a junior full-stack developer building portfolio projects.",
  },
  {
    id: "targetRoles",
    label: "What roles are you targeting?",
    helperText: "List the roles or teams you want this profile to support.",
    placeholder: "Example: Frontend engineer, full-stack engineer, or product engineer.",
  },
  {
    id: "comfortableTechnologies",
    label: "What technologies are you most comfortable with right now?",
    helperText: "Include languages, frameworks, tools, databases, and platforms.",
    placeholder: "Example: TypeScript, React, Next.js, Node.js, PostgreSQL, and GitHub.",
  },
  {
    id: "enjoyedProblems",
    label: "What types of problems do you enjoy working on?",
    helperText: "Focus on the work that gives your profile a clear technical direction.",
    placeholder: "Example: Building clean user flows, APIs, automation, and developer tools.",
  },
  {
    id: "currentImprovement",
    label: "What are you currently trying to improve?",
    helperText: "Mention growth areas honestly so the draft feels specific and grounded.",
    placeholder: "Example: System design, testing discipline, accessibility, and deployment.",
  },
];

export function BackgroundQuestionsForm() {
  const router = useRouter();
  const [answers, setAnswers] = useState<BackgroundAnswers>(initialAnswers);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const answeredCount = useMemo(
    () => Object.values(answers).filter((answer) => answer.trim()).length,
    [answers]
  );
  const isComplete = answeredCount === backgroundQuestions.length;

  function updateAnswer(id: BackgroundQuestionId, value: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [id]: value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isComplete) {
      setError("Answer all five questions before continuing.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/background/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
        }),
      });
      const responseBody = (await response.json()) as GenerateBackgroundResponse;

      if (!response.ok) {
        throw new Error(responseBody.error ?? "Could not queue background generation.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not queue background generation."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="bg-muted/20">
      <CardHeader>
        <CardTitle>Background questions</CardTitle>
        <CardDescription>
          {answeredCount} of {backgroundQuestions.length} answered. DevMD will
          call the LLM once after all answers are complete.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {backgroundQuestions.map((question) => {
            const inputId = `background-${question.id}`;
            const helpId = `${inputId}-help`;

            return (
              <div className="space-y-1.5" key={question.id}>
                <label className="text-sm font-medium" htmlFor={inputId}>
                  {question.label}
                </label>
                <Textarea
                  aria-describedby={helpId}
                  disabled={isSubmitting}
                  id={inputId}
                  minLength={1}
                  onChange={(event) => updateAnswer(question.id, event.target.value)}
                  placeholder={question.placeholder}
                  required
                  rows={3}
                  value={answers[question.id]}
                />
                <p className="text-xs leading-5 text-muted-foreground" id={helpId}>
                  {question.helperText}
                </p>
              </div>
            );
          })}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Continue is available after every answer has been filled in.
            </p>
            <Button disabled={!isComplete || isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Starting generation
                </>
              ) : (
                <>
                  Continue
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
