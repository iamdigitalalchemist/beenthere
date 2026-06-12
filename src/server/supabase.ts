import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/server/env";

export function createSupabaseServiceClient() {
  const env = getSupabaseEnv();

  if (!env.url || !env.serviceRoleKey) {
    throw new Error(
      "Missing Supabase service configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
