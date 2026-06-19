import { NextResponse } from "next/server";

import { experienceInputSchema } from "@/lib/generation/experience";
import { parseResumeFile } from "@/lib/parsers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getOptionalTextField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to generate experience.md." },
      { status: 401 }
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Submit a resume upload or manual experience entry." },
      { status: 400 }
    );
  }

  const sourceType = getOptionalTextField(formData, "sourceType");
  const manualExperience = getOptionalTextField(formData, "manualExperience");
  const resumeFile = formData.get("resumeFile");

  if (sourceType === "manual") {
    if (resumeFile instanceof File && resumeFile.size > 0) {
      return NextResponse.json(
        { error: "Choose either resume upload or manual entry, not both." },
        { status: 400 }
      );
    }

    const parsedInput = experienceInputSchema.safeParse({
      sourceType,
      manualExperience,
    });

    if (!parsedInput.success) {
      return NextResponse.json(
        { error: "Enter at least 50 characters of experience details." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("generation_jobs")
      .insert({
        user_id: user.id,
        project_id: null,
        job_type: "experience",
        status: "queued",
        input: {
          experienceInput: parsedInput.data,
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

  if (sourceType === "resume") {
    if (manualExperience) {
      return NextResponse.json(
        { error: "Choose either resume upload or manual entry, not both." },
        { status: 400 }
      );
    }

    if (!(resumeFile instanceof File) || resumeFile.size === 0) {
      return NextResponse.json(
        { error: "Upload a resume file before continuing." },
        { status: 400 }
      );
    }

    let resumeText = "";

    try {
      resumeText = await parseResumeFile(resumeFile);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Could not read the uploaded resume.",
        },
        { status: 400 }
      );
    }

    const parsedInput = experienceInputSchema.safeParse({
      sourceType,
      resumeText,
      fileName: resumeFile.name,
    });

    if (!parsedInput.success) {
      return NextResponse.json(
        { error: "The uploaded resume did not contain enough readable text." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("generation_jobs")
      .insert({
        user_id: user.id,
        project_id: null,
        job_type: "experience",
        status: "queued",
        input: {
          experienceInput: parsedInput.data,
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

  return NextResponse.json(
    { error: "Choose resume upload or manual entry." },
    { status: 400 }
  );
}
