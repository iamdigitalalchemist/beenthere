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
      className={`fixed left-0 right-0 top-0 z-30 hidden transition-all duration-300 lg:block ${
        pastHero
          ? "border-b border-black/5 bg-white/90 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-3">
        <Image
          alt="beenThere"
          className={pastHero ? "" : "brightness-0 invert"}
          height={30}
          src="/logo.webp"
          width={120}
        />
        <nav className={`flex items-center gap-7 text-sm font-medium transition-colors ${pastHero ? "text-ink-muted" : "text-white/70"}`}>
          <Link className={pastHero ? "text-ink" : "text-white"} href="/">Home</Link>
          <Link className="hover:text-ink transition" href="#features">Features</Link>
          <Link className="hover:text-ink transition" href="#pricing">Pricing</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                className={`text-sm font-medium transition ${pastHero ? "text-ink-muted hover:text-ink" : "text-white/70 hover:text-white"}`}
                href="/dashboard"
              >
                Dashboard
              </Link>
              <button
                className={`rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition active:scale-95 disabled:opacity-60 ${
                  pastHero ? "bg-ink text-white hover:bg-ink/80" : "bg-white text-ink hover:bg-white/90"
                }`}
                disabled={signingOut}
                onClick={handleSignOut}
                type="button"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link
                className={`text-sm font-medium transition ${pastHero ? "text-ink-muted hover:text-ink" : "text-white/70 hover:text-white"}`}
                href="/login"
              >
                Sign in
              </Link>
              <Link
                className={`rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition active:scale-95 ${
                  pastHero ? "bg-ink text-white hover:bg-ink/80" : "bg-white text-ink hover:bg-white/90"
                }`}
                href="/login"
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
