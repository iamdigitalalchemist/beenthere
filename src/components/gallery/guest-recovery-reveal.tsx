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
      <div
        className="sheet-panel relative z-10 w-full max-w-md rounded-t-[2rem] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl sm:rounded-[2rem] sm:p-6"
        style={{ background: "rgba(15,16,35,.96)", border: "1px solid rgba(255,255,255,.08)", backdropFilter: "blur(24px)" }}
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full sm:hidden" style={{ background: "rgba(255,255,255,.15)" }} />
        <h2 className="text-xl font-semibold" style={{ color: "rgba(255,255,255,.92)" }}>You&apos;re in, {displayName}</h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.45)" }}>
          Screenshot or copy your guest code before you close this. You&apos;ll
          need it if you switch phones or log out.
        </p>
        <div className="mt-5">
          <GuestRecoveryCodePanel code={recoveryCode} />
        </div>
        <button
          className="mt-6 min-h-11 w-full rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
          onClick={onContinue}
          style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 8px 24px rgba(205,95,255,.25)" }}
          type="button"
        >
          I&apos;ve saved my code
        </button>
      </div>
    </div>
  );
}
