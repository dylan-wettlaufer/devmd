import { NextResponse } from "next/server";

import { getOnboardingReviewSnapshot } from "@/lib/onboarding-review";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to review onboarding files." }, { status: 401 });
  }

  try {
    const snapshot = await getOnboardingReviewSnapshot(supabase, user.id);

    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load onboarding review status.",
      },
      { status: 500 }
    );
  }
}
