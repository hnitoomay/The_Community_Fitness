"use server";

import { revalidatePath } from "next/cache";

import type { EditProfileActionState } from "@/app/(client)/settings/profile/action-state";
import { isFutureDateOfBirth } from "@/lib/date-of-birth";
import { parseDateOnly } from "@/lib/date-only";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { saveEditableProfileForUser } from "@/lib/server/repositories/profile-settings-repository";
import type { GenderValue } from "@/types/client-journey";
import type { EditableProfileDraft } from "@/types/profile-settings";

function isValidGender(value: string): value is GenderValue {
  return value === "male" || value === "female" || value === "other";
}

export async function saveEditableProfileAction(
  input: EditableProfileDraft,
): Promise<EditProfileActionState> {
  let userId: string;

  try {
    const authUser = await requireAuthenticatedUser();
    userId = authUser.userId;
  } catch {
    return {
      success: false,
      didUpdate: false,
      message: "",
      errors: {
        form: "Sign in is required before updating your profile.",
      },
    };
  }

  const errors: Record<string, string> = {};

  if (!input.fullName.trim()) {
    errors.fullName = "Enter your full name.";
  }

  if (!isValidGender(input.gender)) {
    errors.gender = "Choose a valid gender.";
  }

  if (input.dateOfBirth.trim()) {
    try {
      parseDateOnly(input.dateOfBirth);

      if (isFutureDateOfBirth(input.dateOfBirth)) {
        errors.dateOfBirth = "Date of birth cannot be in the future.";
      }
    } catch {
      errors.dateOfBirth = "Enter a valid date of birth.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      didUpdate: false,
      message: "",
      errors,
    };
  }

  try {
    const result = await saveEditableProfileForUser(userId, input);

    revalidatePath("/settings");
    revalidatePath("/settings/profile");
    revalidatePath("/profile");
    revalidatePath("/assessment");
    revalidatePath("/home");

    return {
      success: true,
      didUpdate: result.didUpdate,
      message: result.didUpdate ? "Profile updated successfully." : "",
      errors: {},
    };
  } catch (error) {
    if (error instanceof Error && error.message === "DATE_OF_BIRTH_REQUIRED") {
      return {
        success: false,
        didUpdate: false,
        message: "",
        errors: {
          dateOfBirth: "Add your date of birth before saving this profile.",
        },
      };
    }

    if (error instanceof Error && error.message === "INVALID_DATE_OF_BIRTH") {
      return {
        success: false,
        didUpdate: false,
        message: "",
        errors: {
          dateOfBirth: "Date of birth cannot be in the future.",
        },
      };
    }

    return {
      success: false,
      didUpdate: false,
      message: "",
      errors: {
        form: "Unable to update your profile right now. Please try again.",
      },
    };
  }
}
