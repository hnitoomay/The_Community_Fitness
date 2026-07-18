"use server";

import { revalidatePath } from "next/cache";

import type { ClientPreferencesActionState } from "@/app/(client)/profile/body-goal/action-state";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  findActiveClientBodyGoalById,
  hasClientProfile,
  saveClientPreferencesAndGoal,
} from "@/lib/server/repositories/client-onboarding-repository";
import type { SaveClientPreferencesInput } from "@/types/client-onboarding";

function parseGoalId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

export async function saveClientPreferencesAction(
  input: SaveClientPreferencesInput,
): Promise<ClientPreferencesActionState> {
  let userId: string;

  try {
    const authUser = await requireAuthenticatedUser();
    userId = authUser.userId;
  } catch {
    return {
      success: false,
      message: "",
      errors: {
        form: "Sign in is required before saving your preferences.",
      },
    };
  }

  const errors: Record<string, string> = {};
  const goalId = parseGoalId(input.selectedBodyGoalId);

  if (!Number.isInteger(goalId)) {
    errors.goal = "Select a valid body goal before submitting.";
  }

  if (
    input.preferences.medicalConditionIds.includes("other-condition") &&
    !input.preferences.otherHealthConditionText.trim()
  ) {
    errors.otherHealthConditionText = "Describe the other health condition.";
  }

  if (
    input.preferences.exerciseDislikeChoice === "yes" &&
    !input.preferences.dislikedExercises.trim()
  ) {
    errors.dislikedExercises = "List the exercises you want to avoid.";
  }

  if (
    input.preferences.foodAllergyChoice === "yes" &&
    !input.preferences.foodAllergies.trim()
  ) {
    errors.foodAllergies = "List the food allergies.";
  }

  if (
    input.preferences.foodRestrictionChoice === "yes" &&
    !input.preferences.foodRestrictions.trim()
  ) {
    errors.foodRestrictions = "Describe the food restrictions.";
  }

  if (
    input.preferences.dislikedFoodChoice === "yes" &&
    !input.preferences.dislikedFoods.trim()
  ) {
    errors.dislikedFoods = "List the foods you dislike.";
  }

  const profileExists = await hasClientProfile(userId);

  if (!profileExists) {
    errors.form = "Complete your basic profile and measurements before this step.";
  }

  if (!errors.goal && Number.isInteger(goalId)) {
    const goal = await findActiveClientBodyGoalById(goalId);

    if (!goal) {
      errors.goal = "Select an active body goal.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "",
      errors,
    };
  }

  try {
    await saveClientPreferencesAndGoal(userId, input);
  } catch {
    return {
      success: false,
      message: "",
      errors: {
        form: "Unable to save your preferences right now. Please try again.",
      },
    };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/body-goal");
  revalidatePath("/assessment");

  return {
    success: true,
    message: "Your body goal and preferences were saved.",
    errors: {},
  };
}
