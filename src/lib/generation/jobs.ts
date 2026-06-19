import type { SupabaseClient } from "@supabase/supabase-js";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type GenerationJobStatus = "queued" | "running" | "completed" | "failed";

export type GenerationJobType =
  | "project_brain"
  | "background"
  | "experience"
  | "manual_refresh";

export type GenerationJob = {
  id: string;
  user_id: string;
  project_id: string | null;
  job_type: GenerationJobType;
  status: GenerationJobStatus;
  input: Json;
  output: Json;
  error_message: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  run_after?: string;
  locked_at?: string | null;
  locked_by?: string | null;
  max_attempts?: number;
  last_heartbeat_at?: string | null;
};

export type ProjectVersionInput = {
  projectId: string;
  markdown: string;
  metadata: Json;
  sourceCommitSha: string | null;
};

function isGenerationJob(value: unknown): value is GenerationJob {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    value.id.length > 0
  );
}

export async function claimNextGenerationJob(
  supabase: SupabaseClient,
  workerId: string
) {
  const { data, error } = await supabase.rpc("claim_next_generation_job", {
    worker_id: workerId,
  });

  if (error) {
    throw error;
  }

  return isGenerationJob(data) ? data : null;
}

export async function markProjectStatus(
  supabase: SupabaseClient,
  projectId: string,
  status: "queued" | "generating" | "completed" | "failed"
) {
  const { error } = await supabase
    .from("projects")
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...(status === "completed" ? { last_refreshed_at: new Date().toISOString() } : {}),
    })
    .eq("id", projectId);

  if (error) {
    throw error;
  }
}

export async function createProjectVersion(
  supabase: SupabaseClient,
  input: ProjectVersionInput
) {
  const { data: latestVersion, error: latestVersionError } = await supabase
    .from("project_versions")
    .select("version_number")
    .eq("project_id", input.projectId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestVersionError) {
    throw latestVersionError;
  }

  const currentVersionNumber =
    typeof latestVersion?.version_number === "number"
      ? latestVersion.version_number
      : 0;

  const { error } = await supabase.from("project_versions").insert({
    project_id: input.projectId,
    version_number: currentVersionNumber + 1,
    markdown: input.markdown,
    metadata: input.metadata,
    source_commit_sha: input.sourceCommitSha,
    status: "generated",
  });

  if (error) {
    throw error;
  }
}

export async function completeGenerationJob(
  supabase: SupabaseClient,
  jobId: string,
  output: Json
) {
  const { error } = await supabase
    .from("generation_jobs")
    .update({
      status: "completed",
      output,
      locked_at: null,
      locked_by: null,
      last_heartbeat_at: null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    throw error;
  }
}

export async function failGenerationJob(
  supabase: SupabaseClient,
  job: GenerationJob,
  errorMessage: string
) {
  const hasAttemptsRemaining =
    typeof job.max_attempts === "number" ? job.attempts < job.max_attempts : false;
  const nextStatus: GenerationJobStatus = hasAttemptsRemaining ? "queued" : "failed";
  const retryDelayMinutes = Math.min(job.attempts * 5, 30);

  const { error } = await supabase
    .from("generation_jobs")
    .update({
      status: nextStatus,
      error_message: errorMessage,
      locked_at: null,
      locked_by: null,
      last_heartbeat_at: null,
      run_after:
        nextStatus === "queued"
          ? new Date(Date.now() + retryDelayMinutes * 60_000).toISOString()
          : new Date().toISOString(),
      completed_at: nextStatus === "failed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  if (error) {
    throw error;
  }

  return nextStatus;
}
