import { redirect } from "next/navigation";

import { ExperienceForm } from "@/components/onboarding/experience-form";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ExperienceOnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/onboarding/experience");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-border pb-5">
          <Badge variant="secondary">Onboarding</Badge>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">
            Build your experience.md
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Upload a resume or enter your experience manually so DevMD can draft
            the experience section of your developer profile.
          </p>
        </header>

        <ExperienceForm />
      </section>
    </main>
  );
}
