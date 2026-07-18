"use server";

import { revalidatePath } from "next/cache";

import type { ClientProfileActionState } from "@/app/(client)/profile/action-state";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { saveMeasurementSnapshotForUser } from "@/lib/server/repositories/profile-settings-repository";
import type { BodyMeasurementsDraft } from "@/types/client-journey";

function isPositiveNumber(value: string) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

export async function saveClientProfileAction(
  input: BodyMeasurementsDraft,
): Promise<ClientProfileActionState> {
  let userId: string;

  try {
    const authUser = await requireAuthenticatedUser();
    userId = authUser.userId;
  } catch {
    return {
      success: false,
      didInsertMeasurement: false,
      message: "",
      errors: {
        form: "Sign in is required before saving measurements.",
      },
    };
  }

  const errors: Record<string, string> = {};

  const measurementEntries = [
    ["heightCm", "height"],
    ["weightKg", "weight"],
    ["waistCm", "waist measurement"],
    ["chestCm", "chest measurement"],
    ["hipCm", "hip measurement"],
    ["armCm", "arm measurement"],
    ["thighCm", "thigh measurement"],
  ] as const;

  for (const [key, label] of measurementEntries) {
    if (!isPositiveNumber(input[key])) {
      errors[key] = `Enter a valid ${label}.`;
    }
  }

  if (input.bodyFatPercentage.trim() && !isPositiveNumber(input.bodyFatPercentage)) {
    errors.bodyFatPercentage = "Enter a valid body fat percentage.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      didInsertMeasurement: false,
      message: "",
      errors,
    };
  }

  try {
    const result = await saveMeasurementSnapshotForUser(userId, input);

    revalidatePath("/profile");
    revalidatePath("/profile/body-goal");
    revalidatePath("/assessment");
    revalidatePath("/calendar");
    revalidatePath("/home");
    revalidatePath("/history");
    revalidatePath("/settings");

    return {
      success: true,
      didInsertMeasurement: result.didInsertMeasurement,
      message: result.didInsertMeasurement
        ? "Your measurement progress was recorded."
        : "",
      errors: {},
    };
  } catch {
    return {
      success: false,
      didInsertMeasurement: false,
      message: "",
      errors: {
        form: "Unable to save your measurements right now. Please try again.",
      },
    };
  }
}
