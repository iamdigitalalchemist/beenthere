import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseEnv, isWhitelistedEmail } from "@/server/env";

export type AuthenticatedUser = {
  id: string;
  email: string;
};

export async function createSupabaseAuthClient() {
  const env = getSupabaseEnv();

  if (!env.url || !env.anonKey) {
    return undefined;
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies; proxy.ts refreshes sessions.
        }
      },
    },
  });
}

export async function getAuthenticatedUser(): Promise<
  AuthenticatedUser | undefined
> {
  const supabase = await createSupabaseAuthClient();

  if (!supabase) {
    return undefined;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.email) {
    return undefined;
  }

  return {
    id: data.user.id,
    email: data.user.email,
  };
}

export function isHostUser(user: AuthenticatedUser | undefined) {
  return Boolean(user && isWhitelistedEmail(user.email));
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export function canManageEvent(
  user: AuthenticatedUser | undefined,
  ownerUserId: string | undefined | null,
) {
  if (!user) {
    return false;
  }

  return isWhitelistedEmail(user.email) || (!!ownerUserId && ownerUserId === user.id);
}

export async function getUserForApi(): Promise<
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; status: 401; error: string }
> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, status: 401, error: "Sign in required." };
  }

  return { ok: true, user };
}

export async function getEventManagerForApi(
  ownerUserId: string | undefined | null,
): Promise<
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; status: 401 | 403; error: string }
> {
  const auth = await getUserForApi();

  if (!auth.ok) {
    return auth;
  }

  if (!canManageEvent(auth.user, ownerUserId)) {
    return {
      ok: false,
      status: 403,
      error: "You do not manage this event.",
    };
  }

  return auth;
}
