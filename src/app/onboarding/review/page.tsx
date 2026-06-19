import { redirect } from "next/navigation";

import { GeneratedFilesReview } from "@/components/onboarding/generated-files-review";
import { Badge } from "@/components/ui/badge";
import { getOnboardingReviewSnapshot } from "@/lib/onboarding-review";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OnboardingReviewPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/onboarding/review");
  }

  const snapshot = await getOnboardingReviewSnapshot(supabase, user.id);

  if (snapshot.profileStatus === "activated" || snapshot.profileStatus === "connected") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-border pb-5">
          <Badge variant="secondary">Onboarding</Badge>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">
            Review your generated files
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review each generated Markdown file, make any edits needed, then approve
            every file to activate your DevMD profile.
          </p>
        </header>

        <GeneratedFilesReview initialSnapshot={snapshot} />
      </section>
    </main>
  );
}
