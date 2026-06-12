export const GUEST_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const GUEST_CODE_LENGTH = 6;

export function normalizeGuestRecoveryCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidGuestRecoveryCode(value: string) {
  const normalized = normalizeGuestRecoveryCode(value);

  return (
    normalized.length === GUEST_CODE_LENGTH &&
    [...normalized].every((character) =>
      GUEST_CODE_ALPHABET.includes(character),
    )
  );
}

export function generateGuestRecoveryCode() {
  const alphabetLength = GUEST_CODE_ALPHABET.length;
  const randomValues = new Uint32Array(GUEST_CODE_LENGTH);
  crypto.getRandomValues(randomValues);

  let code = "";

  for (let index = 0; index < GUEST_CODE_LENGTH; index += 1) {
    code += GUEST_CODE_ALPHABET[randomValues[index]! % alphabetLength];
  }

  return code;
}

export function formatGuestRecoveryCode(value: string) {
  const normalized = normalizeGuestRecoveryCode(value);
  return normalized.length <= 3
    ? normalized
    : `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
}
