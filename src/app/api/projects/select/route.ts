import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const selectedRepositorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  fullName: z.string().regex(/^[^/]+\/[^/]+$/),
  description: z.string().nullable(),
  url: z.string().url(),
  language: z.string().nullable(),
  defaultBranch: z.string().min(1),
});

const selectRepositoriesRequestSchema = z.object({
  repositories: z.array(selectedRepositorySchema).min(1),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to select repositories." }, { status: 401 });
  }

  let body: z.infer<typeof selectRepositoriesRequestSchema>;

  try {
    body = selectRepositoriesRequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Send at least one valid repository." }, { status: 400 });
  }

  const queuedProjectIds: string[] = [];

  for (const repository of body.repositories) {
    const [owner] = repository.fullName.split("/");
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .upsert(
        {
          user_id: user.id,
          github_repo_id: repository.id,
          owner,
          name: repository.name,
          full_name: repository.fullName,
          description: repository.description,
          url: repository.url,
          default_branch: repository.defaultBranch,
          language: repository.language,
          is_fork: false,
          is_archived: false,
          status: "queued",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,github_repo_id",
        }
      )
      .select("id")
      .single();

    if (projectError) {
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    const projectId = String(project.id);
    const { error: jobError } = await supabase.from("generation_jobs").insert({
      user_id: user.id,
      project_id: projectId,
      job_type: "project_brain",
      status: "queued",
      input: {
        repositoryUrl: repository.url,
      },
    });

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }

    queuedProjectIds.push(projectId);
  }

  return NextResponse.json({
    queuedProjectIds,
  });
}
