"use server";

import { revalidatePath } from "next/cache";

import type { ExerciseActionState } from "@/app/admin/exercises/action-state";
import { requireAdminUser } from "@/lib/server/auth";
import {
  saveExerciseWithEquipment,
  updateExerciseStatus,
} from "@/lib/server/repositories/exercise-repository";
import {
  difficultyOptions,
  exerciseCategoryOptions,
  statusOptions,
  type AdminRecordStatus,
  type ExerciseCategory,
  type ExerciseDifficulty,
} from "@/types/admin-data";

function isValidCategory(value: string): value is ExerciseCategory {
  return exerciseCategoryOptions.includes(value as ExerciseCategory);
}

function isValidDifficulty(value: string): value is ExerciseDifficulty {
  return difficultyOptions.includes(value as ExerciseDifficulty);
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

export async function saveExerciseAction(
  _previousState: ExerciseActionState,
  formData: FormData,
): Promise<ExerciseActionState> {
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
  const name = String(formData.get("name") ?? "").trim();
  const categoryValue = String(formData.get("category") ?? "");
  const difficultyValue = String(formData.get("difficulty") ?? "");
  const defaultSetsValue = parseOptionalNumber(formData.get("defaultSets"));
  const defaultRepetitionsOrDuration = String(
    formData.get("defaultRepetitionsOrDuration") ?? "",
  ).trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const statusValue = String(formData.get("status") ?? "");
  const equipmentIds = formData
    .getAll("equipmentIds")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));

  const errors: Record<string, string> = {};

  if (idValue !== undefined && !Number.isInteger(idValue)) {
    errors.form = "Invalid exercise record.";
  }

  if (!name) {
    errors.exerciseName = "Exercise name is required.";
  }

  if (!isValidCategory(categoryValue)) {
    errors.category = "Select a valid category.";
  }

  if (!isValidDifficulty(difficultyValue)) {
    errors.difficulty = "Select a valid difficulty.";
  }

  if (
    defaultSetsValue !== undefined &&
    (Number.isNaN(defaultSetsValue) ||
      !Number.isInteger(defaultSetsValue) ||
      defaultSetsValue < 0)
  ) {
    errors.defaultSets = "Default sets must be 0 or higher.";
  }

  if (!defaultRepetitionsOrDuration) {
    errors.defaultRepetitionsOrDuration =
      "Repetitions or duration is required.";
  }

  if (!instructions) {
    errors.shortInstructions = "Short instructions are required.";
  }

  if (!isValidStatus(statusValue)) {
    errors.status = "Select a valid status.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "",
      errors,
    };
  }

  const category = categoryValue as ExerciseCategory;
  const difficulty = difficultyValue as ExerciseDifficulty;
  const status = statusValue as AdminRecordStatus;

  try {
    const saved = await saveExerciseWithEquipment({
      id: idValue !== undefined ? idValue : undefined,
      name,
      category,
      difficulty,
      defaultSets: defaultSetsValue ?? null,
      defaultRepetitionsOrDuration,
      instructions,
      status,
      equipmentIds,
    });

    if (!saved) {
      return {
        success: false,
        message: "",
        errors: {
          form: "The exercise record could not be found.",
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "",
      errors: {
        form:
          error instanceof Error &&
          error.message === "INVALID_EQUIPMENT_SELECTION"
            ? "Select only available, plan-selectable equipment."
            : "Unable to save exercise right now.",
      },
    };
  }

  revalidatePath("/admin/exercises");

  return {
    success: true,
    message: "Exercise saved successfully.",
    errors: {},
  };
}

export async function updateExerciseStatusAction(input: {
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
      message: "Invalid exercise update.",
    };
  }

  try {
    const saved = await updateExerciseStatus(input.id, input.status);

    if (!saved) {
      return {
        success: false,
        message: "The exercise record could not be found.",
      };
    }
  } catch {
    return {
      success: false,
      message: "Unable to update exercise status right now.",
    };
  }

  revalidatePath("/admin/exercises");

  return {
    success: true,
    message: "Exercise status updated.",
  };
}
