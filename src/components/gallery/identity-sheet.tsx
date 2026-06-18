"use client";

import { FormEvent } from "react";
import Image from "next/image";
import { SegmentedControl } from "@/components/segmented-control";
import { GuestRecoveryCodePanel } from "@/components/gallery/guest-recovery-code-panel";
import { ParticipantAvatar } from "@/components/gallery/participant-avatar";
import {
  formatGuestRecoveryCode,
  GUEST_CODE_LENGTH,
  normalizeGuestRecoveryCode,
} from "@/lib/guest-recovery";
import { LangToggle, useLang } from "@/lib/lang";
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
  collectSocials?: boolean;
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
  collectSocials = false,
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
  const { t } = useLang();
  const isSignUp = !hasParticipant;
  const showCodeLogin = isSignUp && identityMode === "code";
  const normalizedGuestCode = normalizeGuestRecoveryCode(guestCode);
  const canResumeWithCode = normalizedGuestCode.length === GUEST_CODE_LENGTH;
  const canSubmit =
    Boolean(displayName.trim()) && (isSignUp ? consentAccepted : true);

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.10)",
    color: "rgba(255,255,255,.92)",
    borderRadius: "16px",
    padding: "12px 16px",
    fontSize: "16px",
    outline: "none",
    width: "100%",
    minHeight: "44px",
  };

  function handlePhotoSelect(file: File | null) {
    if (!file) { onProfilePhotoChange(null); return; }
    onProfilePhotoChange(file, URL.createObjectURL(file));
  }

  return (
    <div className="sheet-overlay fixed inset-0 z-40 isolate flex items-end justify-center sm:items-center sm:p-4">
      <button
        aria-label="Close guest details"
        className="absolute inset-0 z-0 touch-manipulation"
        onClick={onClose}
        style={{ background: "rgba(0,0,0,.60)", backdropFilter: "blur(8px)" }}
        type="button"
      />
      <form
        className="sheet-panel relative z-10 max-h-[92vh] w-full max-w-md touch-manipulation overflow-y-auto rounded-t-[2rem] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl sm:rounded-[2rem] sm:p-6"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
        style={{
          background: "rgba(15,16,35,.96)",
          border: "1px solid rgba(255,255,255,.08)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div
          className="mx-auto mb-4 h-1 w-10 rounded-full sm:hidden"
          style={{ background: "rgba(255,255,255,.15)" }}
        />
        <div className="mb-4 flex items-center justify-between">
          <Image
            alt="beenThere"
            className="brightness-0 invert opacity-60"
            height={20}
            src="/logo.webp"
            width={80}
          />
          <LangToggle />
        </div>
        <h2
          className="text-xl font-bold"
          style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.01em" }}
        >
          {isSignUp ? (showCodeLogin ? t.welcomeBack : t.joinAsGuest) : t.yourGuestProfile}
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.45)" }}>
          {isSignUp
            ? showCodeLogin
              ? t.subtitleCode
              : t.subtitleSignup
            : t.subtitleProfile}
        </p>

        {isSignUp ? (
          <SegmentedControl
            className="mt-5 rounded-full"
            onChange={onIdentityModeChange}
            options={[
              { id: "signup" as const, label: t.newGuest },
              { id: "code" as const, label: t.guestCode },
            ]}
            value={identityMode}
          />
        ) : null}

        {errorMessage ? (
          <p
            className="mt-4 rounded-2xl px-4 py-3 text-sm"
            style={{ background: "rgba(255,109,174,.12)", border: "1px solid rgba(255,109,174,.20)", color: "#FF6DAE" }}
          >
            {errorMessage}
          </p>
        ) : null}

        {showCodeLogin ? (
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium" htmlFor="guest-code" style={{ color: "rgba(255,255,255,.55)" }}>
              {t.guestCodeLabel}
              <input
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                id="guest-code"
                inputMode="text"
                maxLength={7}
                onChange={(event) => onGuestCodeChange(formatGuestRecoveryCode(event.target.value))}
                placeholder="ABC 123"
                spellCheck={false}
                style={{ ...inputStyle, textAlign: "center", fontSize: "22px", fontFamily: "monospace", fontWeight: 600, letterSpacing: "0.35em", marginTop: "8px" }}
                type="text"
                value={guestCode}
              />
            </label>
            <button
              className="min-h-11 w-full rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canResumeWithCode || isResuming}
              onClick={onResume}
              style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)" }}
              type="button"
            >
              {isResuming ? t.openingProfile : t.continueWithCode}
            </button>
            <button
              className="w-full text-sm font-semibold transition"
              onClick={onToggleNamePicker}
              style={{
                background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
              type="button"
            >
              {showNamePicker ? t.hideGuestList : t.orPickName}
            </button>
            {showNamePicker ? (
              <div className="space-y-2 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
                {resumeCandidates.length === 0 ? (
                  <p
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "rgba(255,255,255,.40)" }}
                  >
                    {t.noGuestsYet}
                  </p>
                ) : (
                  resumeCandidates.map((candidate) => {
                    const isSelected = selectedResumeId === candidate.id;
                    return (
                      <button
                        className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition active:scale-[0.99]"
                        key={candidate.id}
                        onClick={() => onSelectResumeCandidate(candidate.id)}
                        style={isSelected
                          ? { background: "rgba(255,109,174,.12)", border: "1px solid rgba(255,109,174,.25)" }
                          : { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }
                        }
                        type="button"
                      >
                        <ParticipantAvatar name={candidate.displayName} photoUrl={candidate.profilePhotoUrl} size="sm" />
                        <span className="truncate text-sm font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>
                          {candidate.displayName}
                        </span>
                      </button>
                    );
                  })
                )}
                <button
                  className="min-h-11 w-full rounded-full px-5 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!selectedResumeId || isResuming}
                  onClick={onResume}
                  style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.70)" }}
                  type="button"
                >
                  {t.continueAsSelected}
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
              <div
                className="mt-6 rounded-2xl px-4 py-4"
                style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>
                  {t.needGuestCode}
                </p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.40)" }}>
                  {t.needGuestCodeHint}
                </p>
                <button
                  className="mt-3 min-h-11 rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                  disabled={isRegeneratingCode}
                  onClick={onRegenerateRecoveryCode}
                  style={{ background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.12)" }}
                  type="button"
                >
                  {isRegeneratingCode ? t.creatingGuestCode : t.createGuestCode}
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
                <span
                  className="absolute inset-0 flex items-center justify-center rounded-full text-xs font-semibold text-transparent transition group-hover:text-white"
                  style={{ background: "rgba(0,0,0,0)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,.45)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0)")}
                >
                  Edit
                </span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => handlePhotoSelect(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>{t.profilePhoto}</p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.40)" }}>
                  {t.profilePhotoHint}
                </p>
                {profilePhotoPreview ? (
                  <button
                    className="mt-2 text-sm font-semibold transition"
                    onClick={() => handlePhotoSelect(null)}
                    style={{
                      background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                    type="button"
                  >
                    {t.removePhoto}
                  </button>
                ) : null}
              </div>
            </div>

            <label className="mt-6 block text-sm font-medium" htmlFor="display-name" style={{ color: "rgba(255,255,255,.55)" }}>
              {t.displayName}
              <input
                id="display-name"
                onChange={(event) => onDisplayNameChange(event.target.value)}
                placeholder={t.displayNamePlaceholder}
                style={{ ...inputStyle, fontSize: "16px", marginTop: "8px" }}
                value={displayName}
              />
            </label>

            {collectSocials && (
              <fieldset className="mt-6">
                <legend className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.70)" }}>
                  {t.socialAccounts}
                </legend>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.35)" }}>
                  {t.socialHint}
                </p>
                <div className="mt-4 space-y-3">
                  {SOCIAL_FIELDS.map((field) => (
                    <label className="block text-sm" key={field.key} style={{ color: "rgba(255,255,255,.45)" }}>
                      {field.label}
                      <input
                        onChange={(event) => onSocialHandleChange(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        style={{ ...inputStyle, marginTop: "6px" }}
                        value={socialHandles[field.key] ?? ""}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {isSignUp ? (
              <label
                className="mt-6 flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl px-3 py-3 text-sm leading-relaxed"
                style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "rgba(255,255,255,.45)" }}
              >
                <input
                  checked={consentAccepted}
                  className="mt-0.5 size-5 shrink-0 accent-accent"
                  onChange={(event) => onConsentChange(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  {t.consentText}
                </span>
              </label>
            ) : null}

            <div className="mt-6 flex flex-col gap-3">
              <button
                className="min-h-11 w-full rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSubmit}
                style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 8px 24px rgba(205,95,255,.25)" }}
                type="submit"
              >
                {isSignUp ? t.continue : t.saveChanges}
              </button>
              {isSignUp && !consentAccepted && displayName.trim() ? (
                <p className="text-center text-xs" style={{ color: "rgba(255,255,255,.30)" }}>
                  {t.acceptConsent}
                </p>
              ) : null}
              {hasParticipant ? (
                <button
                  className="min-h-11 w-full rounded-full px-5 py-3 text-sm font-semibold transition active:scale-[0.98]"
                  onClick={onLogOut}
                  style={{ background: "rgba(255,95,123,.08)", border: "1px solid rgba(255,95,123,.15)", color: "#FF8FA3" }}
                  type="button"
                >
                  {t.logOut}
                </button>
              ) : null}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
