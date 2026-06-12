import { NextResponse } from "next/server";
import { createSupabaseAuthClient } from "@/server/auth";
import { getAppOrigin } from "@/lib/app-url";

function safeNextPath(next: string | null) {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/dashboard";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));
  const origin = await getAppOrigin();

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const supabase = await createSupabaseAuthClient();

  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  return NextResponse.redirect(`${origin}${nextPath}`);
}
