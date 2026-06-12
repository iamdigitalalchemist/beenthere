"use client";

import { GuestRecoveryCodePanel } from "@/components/gallery/guest-recovery-code-panel";

type GuestRecoveryRevealProps = {
  displayName: string;
  recoveryCode: string;
  onContinue: () => void;
};

export function GuestRecoveryReveal({
  displayName,
  recoveryCode,
  onContinue,
}: GuestRecoveryRevealProps) {
  return (
    <div className="sheet-overlay fixed inset-0 z-50 isolate flex items-end justify-center sm:items-center sm:p-4">
      <div className="sheet-panel relative z-10 w-full max-w-md rounded-t-[2rem] bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl sm:rounded-[2rem] sm:p-6">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-border sm:hidden" />
        <h2 className="text-xl font-semibold text-ink">You&apos;re in, {displayName}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Screenshot or copy your guest code before you close this. You&apos;ll
          need it if you switch phones or log out.
        </p>
        <div className="mt-5">
          <GuestRecoveryCodePanel code={recoveryCode} />
        </div>
        <button
          className="mt-6 min-h-11 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-surface transition hover:bg-ink/90 active:scale-[0.98]"
          onClick={onContinue}
          type="button"
        >
          I&apos;ve saved my code
        </button>
      </div>
    </div>
  );
}
