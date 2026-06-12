import { createHmac, timingSafeEqual } from "node:crypto";
import type { RequestCookies, ResponseCookies } from "next/dist/server/web/spec-extension/cookies";

const PIN_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type CookieStore = RequestCookies | ResponseCookies;

function getPinAccessSecret() {
  return (
    process.env.PIN_ACCESS_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "beenthere-dev-pin-secret"
  );
}

export function getPinCookieName(publicId: string) {
  return `bt_pin_${publicId.replace(/[^a-zA-Z0-9-_]/g, "_")}`;
}

function signPinAccessToken(publicId: string, issuedAt: number) {
  return createHmac("sha256", getPinAccessSecret())
    .update(`${publicId}:${issuedAt}`)
    .digest("base64url");
}

export function createPinAccessToken(publicId: string) {
  const issuedAt = Date.now();
  const signature = signPinAccessToken(publicId, issuedAt);
  return `${issuedAt}.${signature}`;
}

function verifyPinAccessToken(publicId: string, token: string) {
  const [issuedAtRaw, signature] = token.split(".");
  const issuedAt = Number(issuedAtRaw);

  if (!issuedAtRaw || !signature || Number.isNaN(issuedAt)) {
    return false;
  }

  const expected = signPinAccessToken(publicId, issuedAt);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return false;
  }

  const ageMs = Date.now() - issuedAt;
  return ageMs >= 0 && ageMs <= PIN_ACCESS_MAX_AGE_SECONDS * 1000;
}

export function hasPinAccess(cookies: CookieStore, publicId: string) {
  const token = cookies.get(getPinCookieName(publicId))?.value;

  if (!token) {
    return false;
  }

  return verifyPinAccessToken(publicId, token);
}

export function setPinAccessCookie(
  cookies: CookieStore,
  publicId: string,
  options?: { secure?: boolean },
) {
  cookies.set(getPinCookieName(publicId), createPinAccessToken(publicId), {
    httpOnly: true,
    sameSite: "lax",
    secure: options?.secure ?? false,
    path: "/",
    maxAge: PIN_ACCESS_MAX_AGE_SECONDS,
  });
}
