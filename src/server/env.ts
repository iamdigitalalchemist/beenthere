const requiredR2Keys = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
] as const;

export function getR2Env() {
  const missing = requiredR2Keys.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return {
      configured: false as const,
      missing,
    };
  }

  return {
    configured: true as const,
    accountId: process.env.R2_ACCOUNT_ID!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucketName: process.env.R2_BUCKET_NAME!,
  };
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    configured: Boolean(url && anonKey),
    url,
    anonKey,
    serviceRoleKey,
  };
}

export function getHostEmailAllowlist() {
  return (process.env.HOST_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isWhitelistedEmail(email: string | undefined | null) {
  if (!email) {
    return false;
  }

  return getHostEmailAllowlist().includes(email.trim().toLowerCase());
}

export function isLocalUploadStorageEnabled() {
  return process.env.LOCAL_UPLOADS_ENABLED === "true";
}
