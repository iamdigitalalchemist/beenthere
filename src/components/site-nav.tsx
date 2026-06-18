"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

type Props = { user?: { email: string } | null };

export function SiteNav({ user }: Props) {
  const [scrolled, setScrolled] = useState(false);
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
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navStyle: React.CSSProperties = {
    background: scrolled ? "rgba(9,9,24,.90)" : "transparent",
    borderBottom: scrolled ? "1px solid rgba(255,255,255,.08)" : "1px solid transparent",
    backdropFilter: scrolled ? "blur(20px)" : "none",
    transition: "background 400ms ease, border-color 400ms ease, backdrop-filter 400ms ease",
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

        {/* Right side */}
        <div className="flex items-center gap-2 lg:gap-3">
          {user ? (
            <>
              {/* Desktop: text link + sign out button */}
              <Link
                className="hidden text-sm font-medium transition hover:text-white lg:block"
                href="/dashboard"
                style={{ color: "rgba(255,255,255,.55)" }}
              >
                Dashboard
              </Link>
              <button
                className="hidden rounded-full px-5 py-2 text-sm font-semibold transition active:scale-95 disabled:opacity-60 hover:brightness-110 lg:block"
                disabled={signingOut}
                onClick={handleSignOut}
                style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.80)" }}
                type="button"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
              {/* Mobile: compact dashboard link only */}
              <Link
                className="rounded-full px-4 py-2 text-sm font-semibold text-white transition active:scale-95 lg:hidden"
                href="/dashboard"
                style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.10)" }}
              >
                Dashboard
              </Link>
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
