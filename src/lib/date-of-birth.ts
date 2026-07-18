import { getTodayDateOnly, parseDateOnly } from "@/lib/date-only";

export const YANGON_TIME_ZONE = "Asia/Yangon";

function compareDateOnly(left: string, right: string) {
  const leftParts = parseDateOnly(left);
  const rightParts = parseDateOnly(right);

  if (leftParts.year !== rightParts.year) {
    return leftParts.year - rightParts.year;
  }

  if (leftParts.monthIndex !== rightParts.monthIndex) {
    return leftParts.monthIndex - rightParts.monthIndex;
  }

  return leftParts.day - rightParts.day;
}

export function isFutureDateOfBirth(
  dateOfBirth: string,
  referenceDateOnly = getTodayDateOnly(YANGON_TIME_ZONE),
) {
  return compareDateOnly(dateOfBirth, referenceDateOnly) > 0;
}

export function calculateAgeFromDateOfBirth(
  dateOfBirth: string,
  referenceDateOnly = getTodayDateOnly(YANGON_TIME_ZONE),
) {
  if (isFutureDateOfBirth(dateOfBirth, referenceDateOnly)) {
    return null;
  }

  const birth = parseDateOnly(dateOfBirth);
  const reference = parseDateOnly(referenceDateOnly);
  let age = reference.year - birth.year;

  if (
    reference.monthIndex < birth.monthIndex ||
    (reference.monthIndex === birth.monthIndex && reference.day < birth.day)
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function resolveCurrentAge(input: {
  dateOfBirth: string | null | undefined;
  legacyAge: number | null | undefined;
  referenceDateOnly?: string;
}) {
  if (input.dateOfBirth) {
    const calculatedAge = calculateAgeFromDateOfBirth(
      input.dateOfBirth,
      input.referenceDateOnly,
    );

    if (calculatedAge !== null) {
      return calculatedAge;
    }
  }

  return input.legacyAge ?? null;
}

export const __testing__ = {
  compareDateOnly,
};
