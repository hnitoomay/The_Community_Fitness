function normalizePrescriptionValue(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/\s+rounds?\s*$/i, "").trim();
}

function isDurationPrescription(value: string) {
  return /\b(?:sec|secs|second|seconds|min|mins|minute|minutes)\b/i.test(value);
}

export function formatExercisePrescription(
  defaultSets: number | null | undefined,
  defaultRepsOrDuration: string | null | undefined,
) {
  const normalizedValue = normalizePrescriptionValue(defaultRepsOrDuration);

  if (!normalizedValue) {
    return null;
  }

  if (isDurationPrescription(normalizedValue)) {
    if (typeof defaultSets === "number" && defaultSets > 1) {
      return `${defaultSets} rounds \u00d7 ${normalizedValue}`;
    }

    return normalizedValue;
  }

  if (typeof defaultSets === "number" && defaultSets > 0) {
    return `${defaultSets} sets \u00d7 ${normalizedValue}`;
  }

  return normalizedValue;
}
