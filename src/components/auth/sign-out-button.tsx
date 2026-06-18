"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      className="rounded-full px-4 py-2 text-sm font-semibold transition hover:brightness-110 active:scale-95 disabled:opacity-50"
      disabled={isSigningOut}
      onClick={signOut}
      style={{
        background: "rgba(255,255,255,.08)",
        border: "1px solid rgba(255,255,255,.10)",
        color: "rgba(255,255,255,.70)",
      }}
      type="button"
    >
      {isSigningOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
