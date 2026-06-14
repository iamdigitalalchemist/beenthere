import type { AuthenticatedUser } from "@/server/auth";
import { isWhitelistedEmail } from "@/server/env";

const REVENUECAT_API_URL = "https://api.revenuecat.com/v1";

export function getRevenueCatEnv() {
  const secretApiKey = process.env.REVENUECAT_SECRET_API_KEY;
  const publicWebApiKey = process.env.NEXT_PUBLIC_REVENUECAT_WEB_API_KEY;

  return {
    // The public Web Billing key can read subscriber entitlements, so it
    // serves as a fallback until a secret key is configured.
    configured: Boolean(secretApiKey || publicWebApiKey),
    apiKey: secretApiKey || publicWebApiKey,
    publicWebApiKey,
    entitlementId: process.env.REVENUECAT_ENTITLEMENT_ID ?? "host",
  };
}

type RevenueCatSubscriber = {
  subscriber?: {
    entitlements?: Record<
      string,
      {
        expires_date: string | null;
      }
    >;
  };
};

async function hasActiveRevenueCatEntitlement(appUserId: string) {
  const env = getRevenueCatEnv();

  if (!env.configured) {
    return false;
  }

  const response = await fetch(
    `${REVENUECAT_API_URL}/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: {
        Authorization: `Bearer ${env.apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return false;
  }

  const body = (await response.json()) as RevenueCatSubscriber;
  const entitlement = body.subscriber?.entitlements?.[env.entitlementId];

  if (!entitlement) {
    return false;
  }

  return (
    entitlement.expires_date === null ||
    new Date(entitlement.expires_date).getTime() > Date.now()
  );
}

export type EntitlementResult = {
  entitled: boolean;
  reason: "whitelisted" | "entitled" | "not_entitled" | "billing_not_configured";
};

export async function checkHostEntitlement(
  user: AuthenticatedUser,
): Promise<EntitlementResult> {
  if (isWhitelistedEmail(user.email)) {
    return { entitled: true, reason: "whitelisted" };
  }

  if (!getRevenueCatEnv().configured) {
    return { entitled: false, reason: "billing_not_configured" };
  }

  const entitled = await hasActiveRevenueCatEntitlement(user.id);

  return entitled
    ? { entitled: true, reason: "entitled" }
    : { entitled: false, reason: "not_entitled" };
}
