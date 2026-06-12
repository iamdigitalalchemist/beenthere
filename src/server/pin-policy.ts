export function normalizeEventPin(pin: string) {
  return pin.trim();
}

export function validateEventPin(pin: string) {
  const normalized = normalizeEventPin(pin);

  if (normalized.length < 4 || normalized.length > 12) {
    return "PIN must be between 4 and 12 characters.";
  }

  if (!/^[0-9A-Za-z]+$/.test(normalized)) {
    return "PIN can only contain letters and numbers.";
  }

  return null;
}
