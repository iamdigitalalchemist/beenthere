type CookieRequest = Pick<Request, "url" | "headers">;

export function isSecureCookieContext(request?: CookieRequest) {
  if (request) {
    const forwardedProto = request.headers.get("x-forwarded-proto");

    if (forwardedProto) {
      return forwardedProto.split(",")[0]?.trim() === "https";
    }

    try {
      return new URL(request.url).protocol === "https:";
    } catch {
      // Fall through to env-based detection.
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (appUrl) {
    try {
      return new URL(appUrl).protocol === "https:";
    } catch {
      return false;
    }
  }

  return false;
}
