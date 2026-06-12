import type { EventParticipant, GuestSocialHandles } from "@/types/domain";

export type StoredParticipant = {
  id: string;
  displayName: string;
  consentVersion?: string;
  profilePhotoUrl?: string;
  recoveryCode?: string;
  socialHandles?: GuestSocialHandles;
};

export function participantToStoredState(
  participant: EventParticipant,
  recoveryCode?: string,
): StoredParticipant {
  return {
    id: participant.id,
    displayName: participant.displayName,
    consentVersion: participant.consentVersion,
    profilePhotoUrl: participant.profilePhotoUrl,
    recoveryCode,
    socialHandles: participant.socialHandles,
  };
}

function getRecoveryCodeIndexKey(eventId: string) {
  return `beenthere:${eventId}:recovery-codes`;
}

export function storeRecoveryCodeMapping(
  eventId: string,
  recoveryCode: string,
  participantId: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedCode = recoveryCode.trim().toUpperCase();
  const raw = window.localStorage.getItem(getRecoveryCodeIndexKey(eventId));
  const index = raw ? (JSON.parse(raw) as Record<string, string>) : {};

  index[normalizedCode] = participantId;
  window.localStorage.setItem(
    getRecoveryCodeIndexKey(eventId),
    JSON.stringify(index),
  );
}

export function lookupRecoveryCodeParticipantId(
  eventId: string,
  recoveryCode: string,
) {
  if (typeof window === "undefined") {
    return undefined;
  }

  const raw = window.localStorage.getItem(getRecoveryCodeIndexKey(eventId));

  if (!raw) {
    return undefined;
  }

  try {
    const index = JSON.parse(raw) as Record<string, string>;
    return index[recoveryCode.trim().toUpperCase()];
  } catch {
    return undefined;
  }
}

export function getStoredParticipant(eventId: string): StoredParticipant | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const raw = window.localStorage.getItem(`beenthere:${eventId}:participant`);

  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as StoredParticipant;
  } catch {
    return undefined;
  }
}

export function storeParticipant(
  eventId: string,
  participant: StoredParticipant,
) {
  window.localStorage.setItem(
    `beenthere:${eventId}:participant`,
    JSON.stringify(participant),
  );
}

export function clearStoredParticipant(eventId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(`beenthere:${eventId}:participant`);
}
