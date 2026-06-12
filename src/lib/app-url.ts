import { headers } from "next/headers";

export async function getAppOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? null;
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}
