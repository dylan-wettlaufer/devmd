import type { SupabaseClient } from "@supabase/supabase-js";

import type { Json } from "@/lib/generation/jobs";

export type ProfileStatus = "draft" | "generated" | "reviewed" | "activated" | "connected";

export type ReviewDocumentKind = "project" | "background" | "experience";

export type ReviewDocumentStatus = "pending" | "failed" | "ready" | "reviewed";

export type ReviewDocument = {
  id: string;
  kind: ReviewDocumentKind;
  title: string;
  filePath: string;
  status: ReviewDocumentStatus;
  markdown: string;
  versionId: string | null;
  versionNumber: number | null;
  projectId: string | null;
  sourceCommitSha: string | null;
  errorMessage: string | null;
};

export type ReviewRequirement = {
  id: string;
  label: string;
  met: boolean;
};

export type OnboardingReviewSnapshot = {
  profileStatus: ProfileStatus;
  documents: ReviewDocument[];
  requirements: ReviewRequirement[];
  canActivate: boolean;
  hasPendingDocuments: boolean;
  hasFailedDocuments: boolean;
};

export type ApproveReviewDocumentInput = {
  documentId: string;
  markdown: string;
};

type VersionStatus = "draft" | "generated" | "reviewed";

type ProjectStatus = "draft" | "queued" | "generating" | "completed" | "failed";

type JobType = "project_brain" | "background" | "experience" | "manual_refresh";

type JobStatus = "queued" | "running" | "completed" | "failed";

type ProjectRow = {
  id: string;
  name: string;
  fullName: string;
  status: ProjectStatus;
};

type VersionRow = {
  id: string;
  projectId: string | null;
  userId: string | null;
  versionNumber: number;
  markdown: string;
  metadata: Json;
  sourceCommitSha: string | null;
  status: VersionStatus;
};

type JobRow = {
  projectId: string | null;
  jobType: JobType;
  status: JobStatus;
  errorMessage: string | null;
};

const fallbackProfileStatus: ProfileStatus = "draft";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string, fallback = "") {
  const value = record[key];

  return typeof value === "string" ? value : fallback;
}

function readNullableString(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "string" ? value : null;
}

function readNumber(record: Record<string, unknown>, key: string, fallback = 0) {
  const value = record[key];

  return typeof value === "number" ? value : fallback;
}

function toJson(value: unknown): Json {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJson(item));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, toJson(entryValue)])
    );
  }

  return null;
}

function readProfileStatus(value: unknown): ProfileStatus {
  return value === "generated" ||
    value === "reviewed" ||
    value === "activated" ||
    value === "connected" ||
    value === "draft"
    ? value
    : fallbackProfileStatus;
}

function readProjectStatus(value: unknown): ProjectStatus {
  return value === "queued" ||
    value === "generating" ||
    value === "completed" ||
    value === "failed" ||
    value === "draft"
    ? value
    : "draft";
}

function readVersionStatus(value: unknown): VersionStatus {
  return value === "reviewed" || value === "generated" || value === "draft"
    ? value
    : "draft";
}

function readJobType(value: unknown): JobType {
  return value === "project_brain" ||
    value === "background" ||
    value === "experience" ||
    value === "manual_refresh"
    ? value
    : "manual_refresh";
}

function readJobStatus(value: unknown): JobStatus {
  return value === "running" || value === "completed" || value === "failed" || value === "queued"
    ? value
    : "queued";
}

function parseProjectRow(value: unknown): ProjectRow | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value, "id");

  if (!id) {
    return null;
  }

  return {
    id,
    name: readString(value, "name", "project"),
    fullName: readString(value, "full_name", readString(value, "name", "Project")),
    status: readProjectStatus(value.status),
  };
}

function parseVersionRow(value: unknown): VersionRow | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value, "id");
  const markdown = readString(value, "markdown");

  if (!id || !markdown) {
    return null;
  }

  return {
    id,
    projectId: readNullableString(value, "project_id"),
    userId: readNullableString(value, "user_id"),
    versionNumber: readNumber(value, "version_number"),
    markdown,
    metadata: toJson(value.metadata),
    sourceCommitSha: readNullableString(value, "source_commit_sha"),
    status: readVersionStatus(value.status),
  };
}

function parseJobRow(value: unknown): JobRow | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    projectId: readNullableString(value, "project_id"),
    jobType: readJobType(value.job_type),
    status: readJobStatus(value.status),
    errorMessage: readNullableString(value, "error_message"),
  };
}

function latestVersionByProject(versions: VersionRow[]) {
  return versions.reduce<Map<string, VersionRow>>((latestVersions, version) => {
    if (!version.projectId) {
      return latestVersions;
    }

    const currentVersion = latestVersions.get(version.projectId);

    if (!currentVersion || version.versionNumber > currentVersion.versionNumber) {
      latestVersions.set(version.projectId, version);
    }

    return latestVersions;
  }, new Map<string, VersionRow>());
}

function findJob(
  jobs: JobRow[],
  jobType: JobType,
  projectId: string | null = null,
  status?: JobStatus
) {
  return jobs.find(
    (job) =>
      job.jobType === jobType &&
      job.projectId === projectId &&
      (status ? job.status === status : true)
  );
}

function getDocumentStatus(
  version: VersionRow | null,
  failedJob: JobRow | undefined,
  isSourceFailed: boolean
): ReviewDocumentStatus {
  if (version?.status === "reviewed") {
    return "reviewed";
  }

  if (version) {
    return "ready";
  }

  if (failedJob || isSourceFailed) {
    return "failed";
  }

  return "pending";
}

function createDocument(
  input: {
    id: string;
    kind: ReviewDocumentKind;
    title: string;
    filePath: string;
    status: ReviewDocumentStatus;
    version: VersionRow | null;
    projectId?: string | null;
    errorMessage?: string | null;
  }
): ReviewDocument {
  return {
    id: input.id,
    kind: input.kind,
    title: input.title,
    filePath: input.filePath,
    status: input.status,
    markdown: input.version?.markdown ?? "",
    versionId: input.version?.id ?? null,
    versionNumber: input.version?.versionNumber ?? null,
    projectId: input.projectId ?? null,
    sourceCommitSha: input.version?.sourceCommitSha ?? null,
    errorMessage: input.errorMessage ?? null,
  };
}

function rowsFromData(data: unknown) {
  return Array.isArray(data) ? data : [];
}

export async function getOnboardingReviewSnapshot(
  supabase: SupabaseClient,
  userId: string
): Promise<OnboardingReviewSnapshot> {
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("profile_status")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  const profileStatus = isRecord(userData)
    ? readProfileStatus(userData.profile_status)
    : fallbackProfileStatus;

  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select("id,name,full_name,status")
    .eq("user_id", userId)
    .order("selected_at", { ascending: true });

  if (projectsError) {
    throw projectsError;
  }

  const projects = rowsFromData(projectsData)
    .map((project) => parseProjectRow(project))
    .filter((project): project is ProjectRow => project !== null);
  const projectIds = projects.map((project) => project.id);

  const projectVersions = projectIds.length
    ? await getProjectVersions(supabase, projectIds)
    : [];
  const projectVersionMap = latestVersionByProject(projectVersions);
  const backgroundVersion = await getLatestUserVersion(supabase, "background", userId);
  const experienceVersion = await getLatestUserVersion(supabase, "experience", userId);
  const jobs = await getActiveGenerationJobs(supabase, userId);

  const projectDocuments = projects.map((project) => {
    const version = projectVersionMap.get(project.id) ?? null;
    const failedJob = findJob(jobs, "project_brain", project.id, "failed");
    const status = getDocumentStatus(version, failedJob, project.status === "failed");

    return createDocument({
      id: `project:${project.id}`,
      kind: "project",
      title: project.fullName,
      filePath: `projects/${project.name}.md`,
      status,
      version,
      projectId: project.id,
      errorMessage: failedJob?.errorMessage,
    });
  });

  const backgroundFailedJob = findJob(jobs, "background", null, "failed");
  const experienceFailedJob = findJob(jobs, "experience", null, "failed");
  const documents = [
    ...projectDocuments,
    createDocument({
      id: "background",
      kind: "background",
      title: "background.md",
      filePath: "background.md",
      status: getDocumentStatus(backgroundVersion, backgroundFailedJob, false),
      version: backgroundVersion,
      errorMessage: backgroundFailedJob?.errorMessage,
    }),
    createDocument({
      id: "experience",
      kind: "experience",
      title: "experience.md",
      filePath: "experience.md",
      status: getDocumentStatus(experienceVersion, experienceFailedJob, false),
      version: experienceVersion,
      errorMessage: experienceFailedJob?.errorMessage,
    }),
  ];

  const reviewedProjectCount = projectDocuments.filter(
    (document) => document.status === "reviewed"
  ).length;
  const hasReviewedBackground = documents.some(
    (document) => document.id === "background" && document.status === "reviewed"
  );
  const hasReviewedExperience = documents.some(
    (document) => document.id === "experience" && document.status === "reviewed"
  );
  const hasPendingDocuments = documents.some((document) => document.status === "pending");
  const hasFailedDocuments = documents.some((document) => document.status === "failed");
  const allDocumentsReviewed =
    documents.length > 0 && documents.every((document) => document.status === "reviewed");

  const requirements: ReviewRequirement[] = [
    {
      id: "project",
      label: "At least one project document is reviewed.",
      met: reviewedProjectCount > 0,
    },
    {
      id: "background",
      label: "background.md is reviewed.",
      met: hasReviewedBackground,
    },
    {
      id: "experience",
      label: "experience.md is reviewed.",
      met: hasReviewedExperience,
    },
    {
      id: "all-documents",
      label: "Every generated onboarding file is reviewed.",
      met: allDocumentsReviewed,
    },
    {
      id: "generation",
      label: "No required generation jobs are pending or failed.",
      met: !hasPendingDocuments && !hasFailedDocuments,
    },
  ];

  return {
    profileStatus,
    documents,
    requirements,
    canActivate: requirements.every((requirement) => requirement.met),
    hasPendingDocuments,
    hasFailedDocuments,
  };
}

async function getProjectVersions(supabase: SupabaseClient, projectIds: string[]) {
  const { data, error } = await supabase
    .from("project_versions")
    .select("id,project_id,version_number,markdown,metadata,source_commit_sha,status")
    .in("project_id", projectIds)
    .order("version_number", { ascending: false });

  if (error) {
    throw error;
  }

  return rowsFromData(data)
    .map((version) => parseVersionRow(version))
    .filter((version): version is VersionRow => version !== null);
}

async function getLatestUserVersion(
  supabase: SupabaseClient,
  tableName: "background" | "experience",
  userId: string
) {
  const { data, error } = await supabase
    .from(tableName)
    .select("id,user_id,version_number,markdown,metadata,status")
    .eq("user_id", userId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return parseVersionRow(data);
}

async function getActiveGenerationJobs(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("generation_jobs")
    .select("project_id,job_type,status,error_message")
    .eq("user_id", userId)
    .in("status", ["queued", "running", "failed"]);

  if (error) {
    throw error;
  }

  return rowsFromData(data)
    .map((job) => parseJobRow(job))
    .filter((job): job is JobRow => job !== null);
}

export async function approveReviewDocument(
  supabase: SupabaseClient,
  userId: string,
  input: ApproveReviewDocumentInput
) {
  const markdown = input.markdown.trim();

  if (!markdown) {
    throw new Error("Markdown cannot be empty.");
  }

  if (input.documentId === "background") {
    await approveUserDocument(supabase, userId, "background", markdown);
    return;
  }

  if (input.documentId === "experience") {
    await approveUserDocument(supabase, userId, "experience", markdown);
    return;
  }

  if (input.documentId.startsWith("project:")) {
    await approveProjectDocument(
      supabase,
      userId,
      input.documentId.replace("project:", ""),
      markdown
    );
    return;
  }

  throw new Error("Unknown document.");
}

async function approveUserDocument(
  supabase: SupabaseClient,
  userId: string,
  tableName: "background" | "experience",
  markdown: string
) {
  const latestVersion = await getLatestUserVersion(supabase, tableName, userId);

  if (!latestVersion) {
    throw new Error(`Wait until ${tableName}.md has been generated before approving it.`);
  }

  const { error } = await supabase.from(tableName).insert({
    user_id: userId,
    version_number: latestVersion.versionNumber + 1,
    markdown,
    metadata: latestVersion.metadata,
    status: "reviewed",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

async function approveProjectDocument(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  markdown: string
) {
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select("id,user_id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (projectError) {
    throw projectError;
  }

  if (!projectData) {
    throw new Error("Project not found.");
  }

  const { data: versionData, error: versionError } = await supabase
    .from("project_versions")
    .select("id,project_id,version_number,markdown,metadata,source_commit_sha,status")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError) {
    throw versionError;
  }

  const latestVersion = parseVersionRow(versionData);

  if (!latestVersion) {
    throw new Error("Wait until the project document has been generated before approving it.");
  }

  const { error } = await supabase.from("project_versions").insert({
    project_id: projectId,
    version_number: latestVersion.versionNumber + 1,
    markdown,
    metadata: latestVersion.metadata,
    source_commit_sha: latestVersion.sourceCommitSha,
    status: "reviewed",
  });

  if (error) {
    throw error;
  }
}

export async function activateUserProfile(supabase: SupabaseClient, userId: string) {
  const snapshot = await getOnboardingReviewSnapshot(supabase, userId);

  if (!snapshot.canActivate) {
    throw new Error("Review every generated file before activating your profile.");
  }

  const { error } = await supabase
    .from("users")
    .update({
      profile_status: "activated",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}
