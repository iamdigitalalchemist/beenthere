import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { getAuthenticatedUser, isHostUser } from "@/server/auth";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  not_allowed: "This account is not on the host allowlist yet. Contact the beenThere team for access.",
  auth_failed: "Sign-in failed. Please try again.",
};

function safeNextPath(next: string | undefined) {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;
  const nextPath = safeNextPath(next);
  const user = await getAuthenticatedUser();

  if (isHostUser(user)) redirect(nextPath);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fb] text-ink">

      {/* ── Nav ── */}
      <header className="border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-3">
          <Link href="/">
            <Image alt="beenThere" height={28} src="/logo.webp" width={110} />
          </Link>
        </div>
      </header>

      {/* ── Card ── */}
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">

            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Host sign in</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              Sign in to manage your events and galleries.
            </p>

            {error && errorMessages[error] && (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessages[error]}
              </div>
            )}

            {/* Magic link */}
            <div className="mt-6">
              <p className="mb-2.5 text-xs font-semibold text-ink-muted">Sign in with email</p>
              <MagicLinkForm next={nextPath} />
            </div>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-black/6" />
              <span className="text-xs font-medium text-ink-muted">or</span>
              <div className="h-px flex-1 bg-black/6" />
            </div>

            {/* Google */}
            <GoogleSignInButton next={nextPath} />

            <p className="mt-5 text-xs text-ink-muted">
              Guests don&apos;t need an account — they join with the event QR code or link.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
