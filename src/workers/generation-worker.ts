import os from "node:os";

import { loadEnvConfig } from "@next/env";
import { z } from "zod";

import { analyzePublicGithubRepository } from "@/lib/github/analyze-repo";
import {
  claimNextGenerationJob,
  completeGenerationJob,
  createProjectVersion,
  failGenerationJob,
  markProjectStatus,
  type GenerationJob,
} from "@/lib/generation/jobs";
import { generateProjectBrain } from "@/lib/generation/project-brain";
import { renderProjectMarkdown } from "@/lib/generation/render-project-markdown";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

loadEnvConfig(process.cwd());

type ProjectRow = {
  id: string;
  url: string;
};

const projectBrainJobInputSchema = z.object({
  repositoryUrl: z.string().url().optional(),
});

const pollIntervalMs = 5_000;
const workerId = `${os.hostname()}-${process.pid}`;
let shouldStop = false;

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown generation worker error.";
}

async function loadProject(job: GenerationJob) {
  if (!job.project_id) {
    throw new Error("Project Brain jobs require a project_id.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, url")
    .eq("id", job.project_id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(`Project ${job.project_id} was not found.`);
  }

  return data as ProjectRow;
}

async function processProjectBrainJob(job: GenerationJob) {
  const supabase = createSupabaseAdminClient();
  const project = await loadProject(job);
  const input = projectBrainJobInputSchema.parse(job.input);
  const repositoryUrl = input.repositoryUrl ?? project.url;

  await markProjectStatus(supabase, project.id, "generating");

  const analysis = await analyzePublicGithubRepository(repositoryUrl);
  const projectBrain = await generateProjectBrain(analysis);
  const markdown = renderProjectMarkdown(projectBrain, analysis);

  await createProjectVersion(supabase, {
    projectId: project.id,
    markdown,
    metadata: {
      generator: "gemini",
      repository: analysis.repository,
      tree: {
        sha: analysis.tree.sha,
        truncated: analysis.tree.truncated,
        totalCount: analysis.tree.totalCount,
        filteredCount: analysis.tree.filteredCount,
        selectedFileCount: analysis.importantFiles.length,
      },
    },
    sourceCommitSha: analysis.tree.sha,
  });

  await completeGenerationJob(supabase, job.id, {
    projectId: project.id,
    repositoryUrl,
    markdownLength: markdown.length,
  });
  await markProjectStatus(supabase, project.id, "completed");
}

async function processGenerationJob(job: GenerationJob) {
  if (job.job_type !== "project_brain" && job.job_type !== "manual_refresh") {
    throw new Error(`Unsupported generation job type: ${job.job_type}.`);
  }

  await processProjectBrainJob(job);
}

async function runWorkerLoop() {
  const supabase = createSupabaseAdminClient();

  console.log(`Generation worker ${workerId} started.`);

  while (!shouldStop) {
    const job = await claimNextGenerationJob(supabase, workerId);

    if (!job) {
      await sleep(pollIntervalMs);
      continue;
    }

    console.log(`Claimed generation job ${job.id}.`);

    try {
      await processGenerationJob(job);
      console.log(`Completed generation job ${job.id}.`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      console.error(`Failed generation job ${job.id}: ${errorMessage}`);
      const nextJobStatus = await failGenerationJob(supabase, job, errorMessage);

      if (job.project_id && nextJobStatus === "failed") {
        await markProjectStatus(supabase, job.project_id, "failed");
      }
    }
  }

  console.log(`Generation worker ${workerId} stopped.`);
}

process.on("SIGINT", () => {
  shouldStop = true;
});

process.on("SIGTERM", () => {
  shouldStop = true;
});

runWorkerLoop().catch((error: unknown) => {
  console.error(getErrorMessage(error));
  process.exitCode = 1;
});
