import type { GuestSocialHandles } from "@/types/domain";

export function normalizeSocialHandle(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed
    .replace(/^https?:\/\/(www\.)?[^/]+\//i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
}

export function normalizeSocialHandles(
  handles: Partial<GuestSocialHandles> | undefined,
): GuestSocialHandles {
  return {
    instagram: normalizeSocialHandle(handles?.instagram ?? ""),
    facebook: normalizeSocialHandle(handles?.facebook ?? ""),
    x: normalizeSocialHandle(handles?.x ?? ""),
    tiktok: normalizeSocialHandle(handles?.tiktok ?? ""),
  };
}

export function hasAnySocialHandle(handles: GuestSocialHandles) {
  return Boolean(
    handles.instagram || handles.facebook || handles.x || handles.tiktok,
  );
}
