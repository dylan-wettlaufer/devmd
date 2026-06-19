import { NextResponse } from "next/server";
import { z } from "zod";

import { backgroundAnswersSchema } from "@/lib/generation/background";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const generateBackgroundRequestSchema = z.object({
  answers: backgroundAnswersSchema,
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to generate background.md." },
      { status: 401 }
    );
  }

  let body: z.infer<typeof generateBackgroundRequestSchema>;

  try {
    body = generateBackgroundRequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Answer all five background questions before continuing." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("generation_jobs")
    .insert({
      user_id: user.id,
      project_id: null,
      job_type: "background",
      status: "queued",
      input: {
        answers: body.answers,
      },
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    jobId: String(data.id),
  });
}
