import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { getAuthenticatedUser, isHostUser } from "@/server/auth";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  not_allowed:
    "This Google account is not on the host allowlist yet. Contact the BeenThere team for access.",
  auth_failed: "Google sign-in failed. Please try again.",
};

function safeNextPath(next: string | undefined) {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/dashboard";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;
  const nextPath = safeNextPath(next);
  const user = await getAuthenticatedUser();

  if (isHostUser(user)) {
    redirect(nextPath);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-10 text-ink">
      <section className="w-full max-w-md rounded-3xl bg-surface p-8 shadow-sm ring-1 ring-border">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent">
          Host sign in
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Manage your events
        </h1>
        <p className="mt-3 text-base text-ink-muted">
          Sign in with Google to open the host dashboard, moderate photos, and
          manage gallery access.
        </p>

        <div className="mt-8">
          <GoogleSignInButton next={nextPath} />
        </div>

        {error && errorMessages[error] ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessages[error]}
          </p>
        ) : null}

        <p className="mt-6 text-sm text-ink-muted">
          Guests don&apos;t need an account — they join with the event QR code
          or link.
        </p>
      </section>
    </main>
  );
}
