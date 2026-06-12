import { sha256Hex } from "@/server/crypto";
import {
  generateGuestRecoveryCode,
  isValidGuestRecoveryCode,
  normalizeGuestRecoveryCode,
} from "@/lib/guest-recovery";

export {
  generateGuestRecoveryCode,
  isValidGuestRecoveryCode,
  normalizeGuestRecoveryCode,
};

export function hashGuestRecoveryCode(value: string) {
  return sha256Hex(normalizeGuestRecoveryCode(value));
}
