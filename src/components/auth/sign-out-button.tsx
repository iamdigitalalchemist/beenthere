"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      className="rounded-full px-4 py-2 font-semibold text-ink ring-1 ring-border transition hover:bg-ink/5 disabled:opacity-60"
      disabled={isSigningOut}
      onClick={signOut}
      type="button"
    >
      {isSigningOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
