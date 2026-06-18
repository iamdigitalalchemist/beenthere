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
    if (!supabase) { setError("Supabase is not configured."); return; }
    setIsSubmitting(true);
    setError(undefined);
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", next);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl.toString() },
    });
    setIsSubmitting(false);
    if (otpError) { setError(otpError.message); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div
        className="rounded-2xl px-5 py-4 text-center"
        style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}
      >
        <p className="font-semibold" style={{ color: "rgba(255,255,255,.92)" }}>Check your inbox</p>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>
          We sent a sign-in link to{" "}
          <span style={{ color: "rgba(255,255,255,.80)", fontWeight: 500 }}>{email}</span>. Click it to continue.
        </p>
        <button
          className="mt-3 text-xs font-semibold transition hover:opacity-80"
          onClick={() => { setSent(false); setEmail(""); }}
          style={{
            background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
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
        className="w-full rounded-2xl px-4 py-3 text-base outline-none transition"
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        style={{
          background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.10)",
          color: "rgba(255,255,255,.92)",
        }}
        type="email"
        value={email}
      />
      {error && <p className="text-sm" style={{ color: "#FF8FA3" }}>{error}</p>}
      <button
        className="w-full rounded-full py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
        disabled={isSubmitting || !email.trim()}
        style={{
          background: "linear-gradient(135deg, #FF6DAE, #B35DFF)",
          boxShadow: "0 8px 24px rgba(205,95,255,.25)",
        }}
        type="submit"
      >
        {isSubmitting ? "Sending link…" : "Send magic link"}
      </button>
    </form>
  );
}
