"use client";

import { FormEvent } from "react";
import { GuestRecoveryCodePanel } from "@/components/gallery/guest-recovery-code-panel";
import { ParticipantAvatar } from "@/components/gallery/participant-avatar";
import {
  formatGuestRecoveryCode,
  GUEST_CODE_LENGTH,
  normalizeGuestRecoveryCode,
} from "@/lib/guest-recovery";
import type { GuestSocialHandles } from "@/types/domain";

export type GuestResumeCandidate = {
  id: string;
  displayName: string;
  profilePhotoUrl?: string;
};

type IdentitySheetProps = {
  displayName: string;
  consentAccepted: boolean;
  errorMessage?: string | null;
  guestCode: string;
  hasParticipant: boolean;
  identityMode: "signup" | "code";
  isRegeneratingCode?: boolean;
  isResuming?: boolean;
  profilePhotoPreview?: string;
  recoveryCode?: string;
  resumeCandidates: GuestResumeCandidate[];
  selectedResumeId?: string;
  showNamePicker: boolean;
  socialHandles: GuestSocialHandles;
  onClose: () => void;
  onConsentChange: (accepted: boolean) => void;
  onDisplayNameChange: (name: string) => void;
  onGuestCodeChange: (value: string) => void;
  onIdentityModeChange: (mode: "signup" | "code") => void;
  onLogOut: () => void;
  onProfilePhotoChange: (file: File | null, previewUrl?: string) => void;
  onRegenerateRecoveryCode?: () => void;
  onResume: () => void;
  onSelectResumeCandidate: (participantId: string) => void;
  onSocialHandleChange: (
    platform: keyof GuestSocialHandles,
    value: string,
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleNamePicker: () => void;
};

const SOCIAL_FIELDS: Array<{
  key: keyof GuestSocialHandles;
  label: string;
  placeholder: string;
}> = [
  { key: "instagram", label: "Instagram", placeholder: "yourname" },
  { key: "facebook", label: "Facebook", placeholder: "your.name" },
  { key: "x", label: "X (Twitter)", placeholder: "yourname" },
  { key: "tiktok", label: "TikTok", placeholder: "yourname" },
];

export function IdentitySheet({
  displayName,
  consentAccepted,
  errorMessage,
  guestCode,
  hasParticipant,
  identityMode,
  isRegeneratingCode = false,
  isResuming = false,
  profilePhotoPreview,
  recoveryCode,
  resumeCandidates,
  selectedResumeId,
  showNamePicker,
  socialHandles,
  onClose,
  onConsentChange,
  onDisplayNameChange,
  onGuestCodeChange,
  onIdentityModeChange,
  onLogOut,
  onProfilePhotoChange,
  onRegenerateRecoveryCode,
  onResume,
  onSelectResumeCandidate,
  onSocialHandleChange,
  onSubmit,
  onToggleNamePicker,
}: IdentitySheetProps) {
  const isSignUp = !hasParticipant;
  const showCodeLogin = isSignUp && identityMode === "code";
  const normalizedGuestCode = normalizeGuestRecoveryCode(guestCode);
  const canResumeWithCode = normalizedGuestCode.length === GUEST_CODE_LENGTH;
  const canSubmit =
    Boolean(displayName.trim()) && (isSignUp ? consentAccepted : true);

  function handlePhotoSelect(file: File | null) {
    if (!file) {
      onProfilePhotoChange(null);
      return;
    }

    onProfilePhotoChange(file, URL.createObjectURL(file));
  }

  return (
    <div className="sheet-overlay fixed inset-0 z-40 isolate flex items-end justify-center sm:items-center sm:p-4">
      <button
        aria-label="Close guest details"
        className="absolute inset-0 z-0 bg-ink/50 backdrop-blur-sm touch-manipulation"
        onClick={onClose}
        type="button"
      />
      <form
        className="sheet-panel relative z-10 max-h-[92vh] w-full max-w-md touch-manipulation overflow-y-auto rounded-t-[2rem] bg-white/90 backdrop-blur-xl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl ring-1 ring-black/5 sm:rounded-[2rem] sm:p-6"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/15 sm:hidden" />
        <h2 className="text-xl font-bold text-ink">
          {isSignUp
            ? showCodeLogin
              ? "Welcome back"
              : "Join as a guest"
            : "Your guest profile"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {isSignUp
            ? showCodeLogin
              ? "Enter the guest code you saved when you first joined."
              : "Add how you want to appear in this gallery before uploading or tagging."
            : "Update how you appear in this gallery."}
        </p>

        {isSignUp ? (
          <div className="mt-5 flex rounded-full bg-black/5 p-1">
            <button
              className={`min-h-10 flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                identityMode === "signup"
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-muted"
              }`}
              onClick={() => onIdentityModeChange("signup")}
              type="button"
            >
              New guest
            </button>
            <button
              className={`min-h-10 flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                identityMode === "code"
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-muted"
              }`}
              onClick={() => onIdentityModeChange("code")}
              type="button"
            >
              Guest code
            </button>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent">
            {errorMessage}
          </p>
        ) : null}

        {showCodeLogin ? (
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-ink" htmlFor="guest-code">
              Guest code
              <input
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                className="mt-2 min-h-11 w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-center font-mono text-2xl font-semibold tracking-[0.35em] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                id="guest-code"
                inputMode="text"
                maxLength={7}
                onChange={(event) =>
                  onGuestCodeChange(
                    formatGuestRecoveryCode(event.target.value),
                  )
                }
                placeholder="ABC 123"
                spellCheck={false}
                type="text"
                value={guestCode}
              />
            </label>
            <button
              className="min-h-11 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/80 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canResumeWithCode || isResuming}
              onClick={onResume}
              type="button"
            >
              {isResuming ? "Opening profile..." : "Continue with guest code"}
            </button>
            <button
              className="w-full text-sm font-semibold text-accent transition hover:text-accent-hover"
              onClick={onToggleNamePicker}
              type="button"
            >
              {showNamePicker
                ? "Hide guest list"
                : "Or pick your name from the guest list"}
            </button>
            {showNamePicker ? (
              <div className="space-y-2 border-t border-border pt-4">
                {resumeCandidates.length === 0 ? (
                  <p className="rounded-2xl border border-border bg-canvas px-4 py-3 text-sm text-ink-muted">
                    No guest profiles yet. Join as a new guest instead.
                  </p>
                ) : (
                  resumeCandidates.map((candidate) => {
                    const isSelected = selectedResumeId === candidate.id;

                    return (
                      <button
                        className={`flex min-h-11 w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition active:scale-[0.99] ${
                          isSelected
                            ? "border-accent bg-accent-soft"
                            : "border-border bg-canvas hover:border-accent/30"
                        }`}
                        key={candidate.id}
                        onClick={() => onSelectResumeCandidate(candidate.id)}
                        type="button"
                      >
                        <ParticipantAvatar
                          name={candidate.displayName}
                          photoUrl={candidate.profilePhotoUrl}
                          size="sm"
                        />
                        <span className="truncate text-sm font-semibold text-ink">
                          {candidate.displayName}
                        </span>
                      </button>
                    );
                  })
                )}
                <button
                  className="min-h-11 w-full rounded-full border border-border px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!selectedResumeId || isResuming}
                  onClick={onResume}
                  type="button"
                >
                  Continue as selected guest
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {hasParticipant && recoveryCode ? (
              <div className="mt-6">
                <GuestRecoveryCodePanel
                  code={recoveryCode}
                  compact
                  isRegenerating={isRegeneratingCode}
                  onRegenerate={onRegenerateRecoveryCode}
                />
              </div>
            ) : null}
            {hasParticipant && !recoveryCode && onRegenerateRecoveryCode ? (
              <div className="mt-6 rounded-2xl border border-border bg-canvas px-4 py-4">
                <p className="text-sm font-semibold text-ink">
                  Need your guest code?
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  Create a new code to return on another phone. Your old code
                  will stop working.
                </p>
                <button
                  className="mt-3 min-h-11 rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-ink/80 active:scale-[0.98] disabled:opacity-40"
                  disabled={isRegeneratingCode}
                  onClick={onRegenerateRecoveryCode}
                  type="button"
                >
                  {isRegeneratingCode
                    ? "Creating guest code..."
                    : "Create guest code"}
                </button>
              </div>
            ) : null}

            <div className="mt-6 flex items-center gap-4">
              <label className="group relative shrink-0 cursor-pointer">
                <ParticipantAvatar
                  name={displayName || "Guest"}
                  photoUrl={profilePhotoPreview}
                  size="lg"
                />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/0 text-xs font-semibold text-transparent transition group-hover:bg-ink/45 group-hover:text-white">
                  Edit
                </span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) =>
                    handlePhotoSelect(event.target.files?.[0] ?? null)
                  }
                  type="file"
                />
              </label>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">Profile photo</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  Optional. We&apos;ll use your initials if you skip this.
                </p>
                {profilePhotoPreview ? (
                  <button
                    className="mt-2 text-sm font-semibold text-accent"
                    onClick={() => handlePhotoSelect(null)}
                    type="button"
                  >
                    Remove photo
                  </button>
                ) : null}
              </div>
            </div>

            <label
              className="mt-6 block text-sm font-medium text-ink"
              htmlFor="display-name"
            >
              Display name
              <input
                className="mt-2 min-h-11 w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                id="display-name"
                onChange={(event) => onDisplayNameChange(event.target.value)}
                placeholder="Aunt Lisa, Tom, Amira..."
                value={displayName}
              />
            </label>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-ink">
                Social accounts
              </legend>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                Optional. Saved for future sharing and auto-tagging features.
              </p>
              <div className="mt-4 space-y-3">
                {SOCIAL_FIELDS.map((field) => (
                  <label
                    className="block text-sm text-ink-muted"
                    key={field.key}
                  >
                    {field.label}
                    <input
                      className="mt-2 min-h-11 w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                      onChange={(event) =>
                        onSocialHandleChange(field.key, event.target.value)
                      }
                      placeholder={field.placeholder}
                      value={socialHandles[field.key] ?? ""}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            {isSignUp ? (
              <label className="mt-6 flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-black/8 bg-black/5 px-3 py-3 text-sm leading-relaxed text-ink-muted">
                <input
                  checked={consentAccepted}
                  className="mt-0.5 size-5 shrink-0 accent-accent"
                  onChange={(event) => onConsentChange(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  I confirm I have the right to share these photos and
                  understand they&apos;ll be visible according to this
                  event&apos;s settings.
                </span>
              </label>
            ) : null}

            <div className="mt-6 flex flex-col gap-3">
              <button
                className="min-h-11 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-surface transition hover:bg-ink/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSubmit}
                type="submit"
              >
                {isSignUp ? "Continue" : "Save changes"}
              </button>
              {isSignUp && !consentAccepted && displayName.trim() ? (
                <p className="text-center text-xs text-ink-muted">
                  Accept the consent above to continue.
                </p>
              ) : null}
              {hasParticipant ? (
                <button
                  className="min-h-11 w-full rounded-full border border-black/10 bg-black/5 px-5 py-3 text-sm font-semibold text-ink-muted transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 active:scale-[0.98]"
                  onClick={onLogOut}
                  type="button"
                >
                  Log out
                </button>
              ) : null}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
