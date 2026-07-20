"use server";

import { revalidatePath } from "next/cache";

import type { BodyGoalActionState } from "@/app/admin/body-goals/action-state";
import { requireAdminUser } from "@/lib/server/auth";
import {
  deleteManagedImageIfPresent,
  isManagedAdminImagePath,
} from "@/lib/server/admin-image-storage";
import {
  findActiveNutritionTemplateById,
  findActiveWorkoutTemplateById,
  findBodyGoalLabelDuplicate,
  saveBodyGoal,
  updateBodyGoalStatus,
} from "@/lib/server/repositories/body-goal-repository";
import {
  statusOptions,
  type AdminRecordStatus,
} from "@/types/admin-data";

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
  const maleImageUrl = String(formData.get("maleImageUrl") ?? "").trim();
  const femaleImageUrl = String(formData.get("femaleImageUrl") ?? "").trim();
  const unisexImageUrl = String(formData.get("unisexImageUrl") ?? "").trim();
  const previousMaleImageUrl = String(formData.get("previousMaleImageUrl") ?? "").trim();
  const previousFemaleImageUrl = String(
    formData.get("previousFemaleImageUrl") ?? "",
  ).trim();
  const previousUnisexImageUrl = String(
    formData.get("previousUnisexImageUrl") ?? "",
  ).trim();
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

  for (const [fieldName, value] of [
    ["maleImageUrl", maleImageUrl],
    ["femaleImageUrl", femaleImageUrl],
    ["unisexImageUrl", unisexImageUrl],
  ] as const) {
    if (value && !isManagedAdminImagePath(value, "body-goals")) {
      errors[fieldName] = "Upload a valid body goal image.";
    }
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

  const status = statusValue as AdminRecordStatus;

  try {
    const saved = await saveBodyGoal({
      id: idValue !== undefined ? idValue : undefined,
      label,
      description,
      maleImageUrl: maleImageUrl || null,
      femaleImageUrl: femaleImageUrl || null,
      unisexImageUrl: unisexImageUrl || null,
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

    for (const [nextImageUrl, previousImageUrl] of [
      [maleImageUrl, previousMaleImageUrl],
      [femaleImageUrl, previousFemaleImageUrl],
      [unisexImageUrl, previousUnisexImageUrl],
    ]) {
      if (
        previousImageUrl &&
        (!nextImageUrl || nextImageUrl !== previousImageUrl)
      ) {
        await deleteManagedImageIfPresent(previousImageUrl, "body-goals");
      }
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
