import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/repos";
  }

  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    const errorUrl = new URL("/auth/error", requestUrl.origin);
    errorUrl.searchParams.set("message", "Missing OAuth callback code.");

    return NextResponse.redirect(errorUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errorUrl = new URL("/auth/error", requestUrl.origin);
    errorUrl.searchParams.set("message", error.message);

    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
