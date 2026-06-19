import { NextResponse } from "next/server";
import { z } from "zod";

import { approveReviewDocument, getOnboardingReviewSnapshot } from "@/lib/onboarding-review";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const approveDocumentRequestSchema = z.object({
  documentId: z.string().min(1),
  markdown: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to approve onboarding files." }, { status: 401 });
  }

  let body: z.infer<typeof approveDocumentRequestSchema>;

  try {
    body = approveDocumentRequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Send a document id and non-empty Markdown." },
      { status: 400 }
    );
  }

  try {
    await approveReviewDocument(supabase, user.id, body);
    const snapshot = await getOnboardingReviewSnapshot(supabase, user.id);

    if (snapshot.canActivate) {
      const { error } = await supabase
        .from("users")
        .update({
          profile_status: "reviewed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .neq("profile_status", "activated")
        .neq("profile_status", "connected");

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not approve onboarding file.",
      },
      { status: 400 }
    );
  }
}
