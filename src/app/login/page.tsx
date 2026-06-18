import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { getAuthenticatedUser, isHostUser } from "@/server/auth";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
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
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "linear-gradient(180deg, #090918 0%, #10122C 40%, #0C0D20 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(117,84,255,.15) 0%, transparent 60%)" }}
      />

      {/* Nav */}
      <header
        className="relative z-10"
        style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
          <Link href="/">
            <Image alt="beenThere" className="brightness-0 invert opacity-90" height={26} src="/logo.webp" width={104} />
          </Link>
        </div>
      </header>

      {/* Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div
            className="rounded-3xl p-8"
            style={{
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 8px 32px rgba(0,0,0,.32)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{
                background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "0.08em",
              }}
            >
              Host sign in
            </p>
            <h1
              className="mt-2 text-2xl font-bold"
              style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.02em" }}
            >
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>
              Sign in to manage your events and galleries.
            </p>

            {error && errorMessages[error] && (
              <div
                className="mt-4 rounded-2xl px-4 py-3 text-sm font-medium"
                style={{ background: "rgba(255,95,123,.12)", border: "1px solid rgba(255,95,123,.20)", color: "#FF8FA3" }}
              >
                {errorMessages[error]}
              </div>
            )}

            <div className="mt-6">
              <p className="mb-2.5 text-xs font-semibold" style={{ color: "rgba(255,255,255,.35)" }}>
                Sign in with email
              </p>
              <MagicLinkForm next={nextPath} />
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,.08)" }} />
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,.25)" }}>or</span>
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,.08)" }} />
            </div>

            <GoogleSignInButton next={nextPath} />

            <p className="mt-5 text-xs" style={{ color: "rgba(255,255,255,.25)" }}>
              Guests don&apos;t need an account — they join with the event QR code or link.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
