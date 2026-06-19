import { redirect } from "next/navigation";

import { BackgroundQuestionsForm } from "@/components/onboarding/background-questions-form";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function BackgroundOnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/onboarding/background");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-border pb-5">
          <Badge variant="secondary">Onboarding</Badge>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">
            Build your background.md
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Answer five questions so DevMD can draft the background section of
            your developer profile.
          </p>
        </header>

        <BackgroundQuestionsForm />
      </section>
    </main>
  );
}
