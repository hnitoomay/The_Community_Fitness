"use server";

import { revalidatePath } from "next/cache";

import type { FoodActionState } from "@/app/admin/foods/action-state";
import { requireAdminUser } from "@/lib/server/auth";
import {
  findFoodDuplicate,
  saveFood,
  updateFoodStatus,
} from "@/lib/server/repositories/food-repository";
import {
  mealCategoryOptions,
  statusOptions,
  type AdminRecordStatus,
  type FoodMealCategory,
} from "@/types/admin-data";

function isValidMealCategory(value: string): value is FoodMealCategory {
  return mealCategoryOptions.includes(value as FoodMealCategory);
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

export async function saveFoodAction(
  _previousState: FoodActionState,
  formData: FormData,
): Promise<FoodActionState> {
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
  const mealCategoryValue = String(formData.get("mealCategory") ?? "");
  const servingDescription = String(
    formData.get("servingDescription") ?? "",
  ).trim();
  const caloriesValue = parseOptionalNumber(formData.get("calories"));
  const proteinValue = parseOptionalNumber(formData.get("proteinGrams"));
  const allergen = String(formData.get("allergen") ?? "").trim();
  const statusValue = String(formData.get("status") ?? "");

  const errors: Record<string, string> = {};

  if (idValue !== undefined && !Number.isInteger(idValue)) {
    errors.form = "Invalid food record.";
  }

  if (!name) {
    errors.foodName = "Food name is required.";
  }

  if (!isValidMealCategory(mealCategoryValue)) {
    errors.mealCategory = "Select a valid meal category.";
  }

  if (!servingDescription) {
    errors.servingDescription = "Serving description is required.";
  }

  if (
    caloriesValue === undefined ||
    Number.isNaN(caloriesValue) ||
    caloriesValue < 0
  ) {
    errors.calories = "Calories must be 0 or higher.";
  }

  if (
    proteinValue !== undefined &&
    (Number.isNaN(proteinValue) || proteinValue < 0)
  ) {
    errors.proteinGrams = "Protein must be 0 or higher when provided.";
  }

  if (!isValidStatus(statusValue)) {
    errors.status = "Select a valid status.";
  }

  if (
    !errors.foodName &&
    !errors.mealCategory &&
    !errors.servingDescription &&
    isValidMealCategory(mealCategoryValue)
  ) {
    const duplicate = await findFoodDuplicate({
      name,
      mealCategory: mealCategoryValue,
      servingDescription,
      excludeId: idValue !== undefined ? idValue : undefined,
    });

    if (duplicate) {
      errors.foodName =
        "A food with the same name, meal category, and serving description already exists.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "",
      errors,
    };
  }

  const mealCategory = mealCategoryValue as FoodMealCategory;
  const status = statusValue as AdminRecordStatus;
  const calories = caloriesValue as number;

  try {
    const saved = await saveFood({
      id: idValue !== undefined ? idValue : undefined,
      name,
      mealCategory,
      servingDescription,
      calories,
      proteinGrams: proteinValue ?? null,
      allergen,
      status,
    });

    if (!saved) {
      return {
        success: false,
        message: "",
        errors: {
          form: "The food record could not be found.",
        },
      };
    }
  } catch {
    return {
      success: false,
      message: "",
      errors: {
        form: "Unable to save food right now.",
      },
    };
  }

  revalidatePath("/admin/foods");

  return {
    success: true,
    message: "Food saved successfully.",
    errors: {},
  };
}

export async function updateFoodStatusAction(input: {
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
      message: "Invalid food update.",
    };
  }

  try {
    const saved = await updateFoodStatus(input.id, input.status);

    if (!saved) {
      return {
        success: false,
        message: "The food record could not be found.",
      };
    }
  } catch {
    return {
      success: false,
      message: "Unable to update food status right now.",
    };
  }

  revalidatePath("/admin/foods");

  return {
    success: true,
    message: "Food status updated.",
  };
}
