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

  const navStyle: React.CSSProperties = {
    background: pastHero ? "rgba(9,9,24,.90)" : "rgba(9,9,24,.60)",
    borderBottom: pastHero ? "1px solid rgba(255,255,255,.08)" : "1px solid transparent",
    backdropFilter: "blur(20px)",
    transition: "background 300ms, border-color 300ms",
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30" style={navStyle}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 lg:px-8 lg:py-3.5">
        {/* Logo */}
        <Link href="/">
          <Image alt="beenThere" className="brightness-0 invert opacity-90" height={22} src="/logo.webp" width={88} />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-7 text-sm font-medium lg:flex" style={{ color: "rgba(255,255,255,.55)" }}>
          <Link className="transition hover:text-white" href="/" style={{ color: "rgba(255,255,255,.92)" }}>Home</Link>
          <Link className="transition hover:text-white" href="#features">Features</Link>
          <Link className="transition hover:text-white" href="#pricing">Pricing</Link>
        </nav>

        {/* Right side — mobile: Get started / Sign in; desktop: full controls */}
        <div className="flex items-center gap-2 lg:gap-3">
          {user ? (
            <>
              <Link
                className="hidden text-sm font-medium transition hover:text-white lg:block"
                href="/dashboard"
                style={{ color: "rgba(255,255,255,.55)" }}
              >
                Dashboard
              </Link>
              <Link
                className="rounded-full px-4 py-2 text-sm font-semibold text-white transition active:scale-95 lg:hidden"
                href="/dashboard"
                style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.10)" }}
              >
                Dashboard
              </Link>
              <button
                className="rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 disabled:opacity-60 hover:brightness-110 lg:px-5"
                disabled={signingOut}
                onClick={handleSignOut}
                style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.80)" }}
                type="button"
              >
                {signingOut ? "…" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link
                className="hidden text-sm font-medium transition hover:text-white lg:block"
                href="/login"
                style={{ color: "rgba(255,255,255,.55)" }}
              >
                Sign in
              </Link>
              <Link
                className="rounded-full px-4 py-2 text-sm font-semibold text-white transition active:scale-95 hover:brightness-110 lg:px-5"
                href="/login"
                style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 4px 20px rgba(205,95,255,.25)" }}
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
