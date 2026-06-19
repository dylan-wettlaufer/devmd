import { NextResponse } from "next/server";

import { activateUserProfile, getOnboardingReviewSnapshot } from "@/lib/onboarding-review";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to activate your profile." }, { status: 401 });
  }

  try {
    await activateUserProfile(supabase, user.id);
    const snapshot = await getOnboardingReviewSnapshot(supabase, user.id);

    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not activate your profile.",
      },
      { status: 400 }
    );
  }
}
