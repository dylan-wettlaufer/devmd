import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const githubOauthScopes = "read:user user:email";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/repos";
  }

  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const callbackUrl = new URL("/auth/callback", requestUrl.origin);
  callbackUrl.searchParams.set("next", nextPath);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: callbackUrl.toString(),
      scopes: githubOauthScopes,
    },
  });

  if (error || !data.url) {
    const errorUrl = new URL("/auth/error", requestUrl.origin);
    errorUrl.searchParams.set(
      "message",
      error?.message ?? "Could not start GitHub sign-in."
    );

    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(data.url);
}
