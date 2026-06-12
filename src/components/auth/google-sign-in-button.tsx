"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type GoogleSignInButtonProps = {
  next: string;
};

export function GoogleSignInButton({ next }: GoogleSignInButtonProps) {
  const [error, setError] = useState<string | undefined>();
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function signInWithGoogle() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    setIsRedirecting(true);
    setError(undefined);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", next);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (oauthError) {
      setIsRedirecting(false);
      setError(oauthError.message);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        className="flex items-center justify-center gap-3 rounded-full bg-ink px-6 py-3 text-sm font-bold text-surface transition hover:bg-ink/90 disabled:opacity-60"
        disabled={isRedirecting}
        onClick={signInWithGoogle}
        type="button"
      >
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.16-3.16A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38Z"
            fill="#EA4335"
          />
        </svg>
        {isRedirecting ? "Redirecting to Google…" : "Continue with Google"}
      </button>
      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
