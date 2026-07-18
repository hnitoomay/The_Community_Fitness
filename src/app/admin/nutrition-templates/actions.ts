"use server";

import { revalidatePath } from "next/cache";

import type { NutritionTemplateActionState } from "@/app/admin/nutrition-templates/action-state";
import { requireAdminUser } from "@/lib/server/auth";
import {
  findActiveBodyGoalById,
  findNutritionTemplateDuplicate,
  saveNutritionTemplate,
  updateNutritionTemplateStatus,
} from "@/lib/server/repositories/nutrition-template-repository";
import {
  mealCategoryOptions,
  mealsPerDayOptions,
  statusOptions,
  type AdminRecordStatus,
  type FoodMealCategory,
} from "@/types/admin-data";

function isValidStatus(value: string): value is AdminRecordStatus {
  return statusOptions.includes(value as AdminRecordStatus);
}

function isValidMealsPerDay(value: number): value is 3 | 4 | 5 {
  return mealsPerDayOptions.includes(value as 3 | 4 | 5);
}

function isValidMealCategory(value: string): value is FoodMealCategory {
  return mealCategoryOptions.includes(value as FoodMealCategory);
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function saveNutritionTemplateAction(
  _previousState: NutritionTemplateActionState,
  formData: FormData,
): Promise<NutritionTemplateActionState> {
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
  const mealsPerDayValue = parseOptionalNumber(formData.get("mealsPerDay"));
  const minimumCaloriesValue = parseOptionalNumber(
    formData.get("minimumCalories"),
  );
  const maximumCaloriesValue = parseOptionalNumber(
    formData.get("maximumCalories"),
  );
  const mealStructureValues = formData.getAll("mealStructure");
  const notes = String(formData.get("notes") ?? "").trim();
  const statusValue = String(formData.get("status") ?? "");

  const errors: Record<string, string> = {};

  if (idValue !== undefined && !Number.isInteger(idValue)) {
    errors.form = "Invalid nutrition template record.";
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
    mealsPerDayValue === undefined ||
    Number.isNaN(mealsPerDayValue) ||
    !Number.isInteger(mealsPerDayValue) ||
    !isValidMealsPerDay(mealsPerDayValue)
  ) {
    errors.mealsPerDay = "Select a valid meals-per-day value.";
  }

  if (
    minimumCaloriesValue === undefined ||
    Number.isNaN(minimumCaloriesValue) ||
    !Number.isInteger(minimumCaloriesValue) ||
    minimumCaloriesValue < 0
  ) {
    errors.minimumDailyCalories = "Minimum calories must be 0 or higher.";
  }

  if (
    maximumCaloriesValue === undefined ||
    Number.isNaN(maximumCaloriesValue) ||
    !Number.isInteger(maximumCaloriesValue) ||
    maximumCaloriesValue < 0
  ) {
    errors.maximumDailyCalories = "Maximum calories must be 0 or higher.";
  }

  if (
    !errors.minimumDailyCalories &&
    !errors.maximumDailyCalories &&
    (maximumCaloriesValue as number) < (minimumCaloriesValue as number)
  ) {
    errors.maximumDailyCalories =
      "Maximum calories must not be lower than minimum calories.";
  }

  if (!isValidStatus(statusValue)) {
    errors.status = "Select a valid status.";
  }

  const invalidMealStructureValue = mealStructureValues.find(
    (value) => !isValidMealCategory(String(value)),
  );

  if (!mealStructureValues.length) {
    errors.mealStructure = "Select at least one meal structure item.";
  } else if (invalidMealStructureValue) {
    errors.mealStructure = "Meal structure contains an invalid value.";
  }

  if (!errors.templateName) {
    const duplicate = await findNutritionTemplateDuplicate(
      name,
      idValue !== undefined ? idValue : undefined,
    );

    if (duplicate) {
      errors.templateName =
        "A nutrition template with this name already exists.";
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
    const saved = await saveNutritionTemplate({
      id: idValue !== undefined ? idValue : undefined,
      name,
      bodyGoalId: bodyGoalIdValue as number,
      mealsPerDay: mealsPerDayValue as 3 | 4 | 5,
      minimumCalories: minimumCaloriesValue as number,
      maximumCalories: maximumCaloriesValue as number,
      mealStructure: mealStructureValues.map(
        (value) => String(value) as FoodMealCategory,
      ),
      notes: notes || null,
      status: statusValue as AdminRecordStatus,
    });

    if (!saved) {
      return {
        success: false,
        message: "",
        errors: {
          form: "The nutrition template record could not be found.",
        },
      };
    }
  } catch {
    return {
      success: false,
      message: "",
      errors: {
        form: "Unable to save nutrition template right now.",
      },
    };
  }

  revalidatePath("/admin/nutrition-templates");
  revalidatePath("/admin/body-goals");

  return {
    success: true,
    message: "Nutrition template saved successfully.",
    errors: {},
  };
}

export async function updateNutritionTemplateStatusAction(input: {
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
      message: "Invalid nutrition template update.",
    };
  }

  try {
    const saved = await updateNutritionTemplateStatus(input.id, input.status);

    if (!saved) {
      return {
        success: false,
        message: "The nutrition template record could not be found.",
      };
    }
  } catch {
    return {
      success: false,
      message: "Unable to update nutrition template status right now.",
    };
  }

  revalidatePath("/admin/nutrition-templates");
  revalidatePath("/admin/body-goals");

  return {
    success: true,
    message: "Nutrition template status updated.",
  };
}
