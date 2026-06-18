"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

type Props = { user?: { email: string } | null };

export function SiteNav({ user }: Props) {
  const [pastHero, setPastHero] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    const sentinel = document.querySelector(".hero-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className="fixed left-0 right-0 top-0 z-30 hidden transition-all duration-300 lg:block"
      style={{
        background: pastHero ? "rgba(9,9,24,.85)" : "transparent",
        borderBottom: pastHero ? "1px solid rgba(255,255,255,.08)" : "1px solid transparent",
        backdropFilter: pastHero ? "blur(20px)" : "none",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-3.5">
        <Image
          alt="beenThere"
          className="brightness-0 invert opacity-90"
          height={28}
          src="/logo.webp"
          width={110}
        />
        <nav className="flex items-center gap-7 text-sm font-medium" style={{ color: "rgba(255,255,255,.55)" }}>
          <Link className="transition hover:text-white" href="/" style={{ color: "rgba(255,255,255,.92)" }}>Home</Link>
          <Link className="transition hover:text-white" href="#features">Features</Link>
          <Link className="transition hover:text-white" href="#pricing">Pricing</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                className="text-sm font-medium transition hover:text-white"
                href="/dashboard"
                style={{ color: "rgba(255,255,255,.55)" }}
              >
                Dashboard
              </Link>
              <button
                className="rounded-full px-5 py-2 text-sm font-semibold transition active:scale-95 disabled:opacity-60 hover:brightness-110"
                disabled={signingOut}
                onClick={handleSignOut}
                style={{
                  background: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,255,255,.10)",
                  color: "rgba(255,255,255,.80)",
                }}
                type="button"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link
                className="text-sm font-medium transition hover:text-white"
                href="/login"
                style={{ color: "rgba(255,255,255,.55)" }}
              >
                Sign in
              </Link>
              <Link
                className="rounded-full px-5 py-2 text-sm font-semibold text-white transition active:scale-95 hover:brightness-110"
                href="/login"
                style={{
                  background: "linear-gradient(135deg, #FF6DAE, #B35DFF)",
                  boxShadow: "0 4px 20px rgba(205,95,255,.25)",
                }}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
