"use server";

import { revalidatePath } from "next/cache";

import type { WorkoutTemplateActionState } from "@/app/admin/workout-templates/action-state";
import { requireAdminUser } from "@/lib/server/auth";
import {
  findActiveBodyGoalById,
  findWorkoutTemplateDuplicate,
  saveWorkoutTemplateWithDays,
  updateWorkoutTemplateStatus,
} from "@/lib/server/repositories/workout-template-repository";
import {
  difficultyOptions,
  focusCategoryOptions,
  statusOptions,
  templateDayTypeOptions,
  workoutTemplateDaysPerWeekOptions,
  type AdminRecordStatus,
  type ExerciseDifficulty,
  type FocusCategory,
  type TemplateDayType,
} from "@/types/admin-data";

function isValidDifficulty(value: string): value is ExerciseDifficulty {
  return difficultyOptions.includes(value as ExerciseDifficulty);
}

function isValidStatus(value: string): value is AdminRecordStatus {
  return statusOptions.includes(value as AdminRecordStatus);
}

function isValidDayType(value: string): value is TemplateDayType {
  return templateDayTypeOptions.includes(value as TemplateDayType);
}

function isValidFocusCategory(value: string): value is FocusCategory {
  return focusCategoryOptions.includes(value as FocusCategory);
}

function isValidDaysPerWeek(value: number): value is 3 | 4 | 5 | 6 {
  return workoutTemplateDaysPerWeekOptions.includes(value as 3 | 4 | 5 | 6);
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function saveWorkoutTemplateAction(
  _previousState: WorkoutTemplateActionState,
  formData: FormData,
): Promise<WorkoutTemplateActionState> {
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
  const bodyGoalIdValue = parseOptionalNumber(formData.get("bodyGoalId"));
  const daysPerWeekValue = parseOptionalNumber(formData.get("daysPerWeek"));
  const difficultyValue = String(formData.get("difficulty") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const statusValue = String(formData.get("status") ?? "");

  const dayNumbers = formData.getAll("dayNumbers");
  const dayTypes = formData.getAll("dayTypes");
  const focusCategories = formData.getAll("focusCategories");
  const exerciseCounts = formData.getAll("exerciseCounts");

  const errors: Record<string, string> = {};

  if (idValue !== undefined && !Number.isInteger(idValue)) {
    errors.form = "Invalid workout template record.";
  }

  if (!name) {
    errors.templateName = "Template name is required.";
  }

  if (
    bodyGoalIdValue === undefined ||
    Number.isNaN(bodyGoalIdValue) ||
    !Number.isInteger(bodyGoalIdValue) ||
    bodyGoalIdValue <= 0
  ) {
    errors.bodyGoalId = "Select an active body goal.";
  }

  if (
    daysPerWeekValue === undefined ||
    Number.isNaN(daysPerWeekValue) ||
    !Number.isInteger(daysPerWeekValue) ||
    !isValidDaysPerWeek(daysPerWeekValue)
  ) {
    errors.daysPerWeek = "Select a valid days-per-week value.";
  }

  if (!isValidDifficulty(difficultyValue)) {
    errors.difficulty = "Select a valid difficulty.";
  }

  if (!isValidStatus(statusValue)) {
    errors.status = "Select a valid status.";
  }

  const parsedRows = dayNumbers.map((dayNumberValue, index) => {
    const dayNumber = parseOptionalNumber(dayNumberValue);
    const dayType = String(dayTypes[index] ?? "");
    const focusCategory = String(focusCategories[index] ?? "");
    const exerciseCount = parseOptionalNumber(exerciseCounts[index] ?? null);

    return {
      dayNumber,
      dayType,
      focusCategory,
      exerciseCount,
    };
  });

  if (
    dayNumbers.length !== 7 ||
    dayTypes.length !== 7 ||
    focusCategories.length !== 7 ||
    exerciseCounts.length !== 7
  ) {
    errors.weeklyDayStructure = "Submit exactly seven weekly day rows.";
  } else {
    const uniqueDayNumbers = new Set<number>();

    for (const row of parsedRows) {
      if (
        row.dayNumber === undefined ||
        Number.isNaN(row.dayNumber) ||
        !Number.isInteger(row.dayNumber) ||
        row.dayNumber < 1 ||
        row.dayNumber > 7
      ) {
        errors.weeklyDayStructure = "Each day number must be between 1 and 7.";
        break;
      }

      if (uniqueDayNumbers.has(row.dayNumber)) {
        errors.weeklyDayStructure =
          "Each weekly day must use a unique day number.";
        break;
      }

      uniqueDayNumbers.add(row.dayNumber);

      if (!isValidDayType(row.dayType)) {
        errors.weeklyDayStructure = "Each weekly row must use a valid day type.";
        break;
      }

      if (!isValidFocusCategory(row.focusCategory)) {
        errors.weeklyDayStructure =
          "Each weekly row must use a valid focus category.";
        break;
      }

      if (
        row.exerciseCount === undefined ||
        Number.isNaN(row.exerciseCount) ||
        !Number.isInteger(row.exerciseCount) ||
        row.exerciseCount < 0
      ) {
        errors.weeklyDayStructure =
          "Exercise count must be zero or greater for every day.";
        break;
      }
    }
  }

  if (!errors.templateName) {
    const duplicate = await findWorkoutTemplateDuplicate(
      name,
      idValue !== undefined ? idValue : undefined,
    );

    if (duplicate) {
      errors.templateName = "A workout template with this name already exists.";
    }
  }

  if (!errors.bodyGoalId && bodyGoalIdValue !== undefined) {
    const bodyGoal = await findActiveBodyGoalById(bodyGoalIdValue);

    if (!bodyGoal) {
      errors.bodyGoalId = "Select an active body goal.";
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
    const saved = await saveWorkoutTemplateWithDays({
      id: idValue !== undefined ? idValue : undefined,
      name,
      bodyGoalId: bodyGoalIdValue as number,
      daysPerWeek: daysPerWeekValue as 3 | 4 | 5 | 6,
      difficulty: difficultyValue as ExerciseDifficulty,
      notes: notes || null,
      status: statusValue as AdminRecordStatus,
      weeklyDayStructure: parsedRows.map((row) => ({
        dayNumber: row.dayNumber as number,
        dayType: row.dayType as TemplateDayType,
        focusCategory: row.focusCategory as FocusCategory,
        exerciseCount: row.exerciseCount as number,
      })),
    });

    if (!saved) {
      return {
        success: false,
        message: "",
        errors: {
          form: "The workout template record could not be found.",
        },
      };
    }
  } catch {
    return {
      success: false,
      message: "",
      errors: {
        form: "Unable to save workout template right now.",
      },
    };
  }

  revalidatePath("/admin/workout-templates");
  revalidatePath("/admin/body-goals");

  return {
    success: true,
    message: "Workout template saved successfully.",
    errors: {},
  };
}

export async function updateWorkoutTemplateStatusAction(input: {
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
      message: "Invalid workout template update.",
    };
  }

  try {
    const saved = await updateWorkoutTemplateStatus(input.id, input.status);

    if (!saved) {
      return {
        success: false,
        message: "The workout template record could not be found.",
      };
    }
  } catch {
    return {
      success: false,
      message: "Unable to update workout template status right now.",
    };
  }

  revalidatePath("/admin/workout-templates");
  revalidatePath("/admin/body-goals");

  return {
    success: true,
    message: "Workout template status updated.",
  };
}
