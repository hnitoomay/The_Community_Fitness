"use server";

import { revalidatePath } from "next/cache";

import type { BodyGoalActionState } from "@/app/admin/body-goals/action-state";
import { requireAdminUser } from "@/lib/server/auth";
import {
  findActiveNutritionTemplateById,
  findActiveWorkoutTemplateById,
  findBodyGoalLabelDuplicate,
  saveBodyGoal,
  updateBodyGoalStatus,
} from "@/lib/server/repositories/body-goal-repository";
import {
  genderDisplayOptions,
  statusOptions,
  type AdminRecordStatus,
  type GenderDisplay,
} from "@/types/admin-data";

function isValidGenderDisplay(value: string): value is GenderDisplay {
  return genderDisplayOptions.includes(value as GenderDisplay);
}

function isValidStatus(value: string): value is AdminRecordStatus {
  return statusOptions.includes(value as AdminRecordStatus);
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function saveBodyGoalAction(
  _previousState: BodyGoalActionState,
  formData: FormData,
): Promise<BodyGoalActionState> {
  try {
    await requireAdminUser();
  } catch {
    return {
      success: false,
      message: "",
      errors: {
        form: "Admin access is required for this action.",
      },
    };
  }

  const idValue = parseOptionalNumber(formData.get("id"));
  const label = String(formData.get("label") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const genderDisplayValue = String(formData.get("genderDisplay") ?? "");
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const workoutTemplateIdValue = parseOptionalNumber(formData.get("workoutTemplateId"));
  const nutritionTemplateIdValue = parseOptionalNumber(
    formData.get("nutritionTemplateId"),
  );
  const statusValue = String(formData.get("status") ?? "");

  const errors: Record<string, string> = {};

  if (idValue !== undefined && !Number.isInteger(idValue)) {
    errors.form = "Invalid body goal record.";
  }

  if (!label) {
    errors.goalLabel = "Goal label is required.";
  }

  if (!description) {
    errors.shortDescription = "Short description is required.";
  }

  if (!isValidGenderDisplay(genderDisplayValue)) {
    errors.genderDisplay = "Select a valid gender display.";
  }

  if (
    workoutTemplateIdValue !== undefined &&
    (!Number.isInteger(workoutTemplateIdValue) || workoutTemplateIdValue <= 0)
  ) {
    errors.workoutTemplateId = "Select a valid workout template.";
  }

  if (
    nutritionTemplateIdValue !== undefined &&
    (!Number.isInteger(nutritionTemplateIdValue) || nutritionTemplateIdValue <= 0)
  ) {
    errors.nutritionTemplateId = "Select a valid nutrition template.";
  }

  if (!isValidStatus(statusValue)) {
    errors.status = "Select a valid status.";
  }

  if (!errors.goalLabel) {
    const duplicate = await findBodyGoalLabelDuplicate(
      label,
      idValue !== undefined ? idValue : undefined,
    );

    if (duplicate) {
      errors.goalLabel = "A body goal with this label already exists.";
    }
  }

  if (!errors.workoutTemplateId && workoutTemplateIdValue !== undefined) {
    const workoutTemplate = await findActiveWorkoutTemplateById(workoutTemplateIdValue);

    if (!workoutTemplate) {
      errors.workoutTemplateId =
        "Select an active workout template or leave the field empty.";
    }
  }

  if (!errors.nutritionTemplateId && nutritionTemplateIdValue !== undefined) {
    const nutritionTemplate = await findActiveNutritionTemplateById(
      nutritionTemplateIdValue,
    );

    if (!nutritionTemplate) {
      errors.nutritionTemplateId =
        "Select an active nutrition template or leave the field empty.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "",
      errors,
    };
  }

  const genderDisplay = genderDisplayValue as GenderDisplay;
  const status = statusValue as AdminRecordStatus;

  try {
    const saved = await saveBodyGoal({
      id: idValue !== undefined ? idValue : undefined,
      label,
      description,
      genderDisplay,
      imageUrl: imageUrl || null,
      workoutTemplateId: workoutTemplateIdValue ?? null,
      nutritionTemplateId: nutritionTemplateIdValue ?? null,
      status,
    });

    if (!saved) {
      return {
        success: false,
        message: "",
        errors: {
          form: "The body goal record could not be found.",
        },
      };
    }
  } catch {
    return {
      success: false,
      message: "",
      errors: {
        form: "Unable to save body goal right now.",
      },
    };
  }

  revalidatePath("/admin/body-goals");

  return {
    success: true,
    message: "Body goal saved successfully.",
    errors: {},
  };
}

export async function updateBodyGoalStatusAction(input: {
  id: number;
  status: AdminRecordStatus;
}) {
  try {
    await requireAdminUser();
  } catch {
    return {
      success: false,
      message: "Admin access is required for this action.",
    };
  }

  if (!Number.isInteger(input.id) || !isValidStatus(input.status)) {
    return {
      success: false,
      message: "Invalid body goal update.",
    };
  }

  try {
    const saved = await updateBodyGoalStatus(input.id, input.status);

    if (!saved) {
      return {
        success: false,
        message: "The body goal record could not be found.",
      };
    }
  } catch {
    return {
      success: false,
      message: "Unable to update body goal status right now.",
    };
  }

  revalidatePath("/admin/body-goals");

  return {
    success: true,
    message: "Body goal status updated.",
  };
}
