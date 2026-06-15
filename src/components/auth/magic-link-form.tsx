"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Props = { next: string };

export function MagicLinkForm({ next }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", next);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl.toString() },
    });

    setIsSubmitting(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-accent-soft px-5 py-4 text-center">
        <p className="font-semibold text-ink">Check your inbox</p>
        <p className="mt-1 text-sm text-ink-muted">
          We sent a sign-in link to <span className="font-medium text-ink">{email}</span>. Click it to continue.
        </p>
        <button
          className="mt-3 text-xs font-semibold text-accent hover:underline"
          onClick={() => { setSent(false); setEmail(""); }}
          type="button"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <input
        autoComplete="email"
        className="w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        type="email"
        value={email}
      />
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <button
        className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white transition hover:bg-ink/80 active:scale-95 disabled:opacity-50"
        disabled={isSubmitting || !email.trim()}
        type="submit"
      >
        {isSubmitting ? "Sending link…" : "Send magic link"}
      </button>
    </form>
  );
}
