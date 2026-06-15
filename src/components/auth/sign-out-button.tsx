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
      className="rounded-full border border-black/10 bg-black/5 px-4 py-2 text-sm font-semibold text-ink transition hover:border-black/20 hover:bg-black/10 active:scale-95 disabled:opacity-50"
      disabled={isSigningOut}
      onClick={signOut}
      type="button"
    >
      {isSigningOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
