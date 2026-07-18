"use server";

import { revalidatePath } from "next/cache";

import type { EquipmentActionState } from "@/app/admin/equipment/action-state";
import { requireAdminUser } from "@/lib/server/auth";
import {
  findEquipmentSourceNumberConflict,
  saveEquipment,
  updateEquipmentAvailability,
} from "@/lib/server/repositories/equipment-repository";
import {
  equipmentAvailabilityOptions,
  equipmentCategoryOptions,
  equipmentUnitOptions,
  type EquipmentAvailability,
  type EquipmentCategory,
  type EquipmentUnit,
} from "@/types/admin-data";

function isValidCategory(value: string): value is EquipmentCategory {
  return equipmentCategoryOptions.includes(value as EquipmentCategory);
}

function isValidUnit(value: string): value is EquipmentUnit {
  return equipmentUnitOptions.includes(value as EquipmentUnit);
}

function isValidAvailability(value: string): value is EquipmentAvailability {
  return equipmentAvailabilityOptions.includes(value as EquipmentAvailability);
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function saveEquipmentAction(
  _previousState: EquipmentActionState,
  formData: FormData,
): Promise<EquipmentActionState> {
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
  const sourceNumberValue = parseOptionalNumber(formData.get("sourceNumber"));
  const name = String(formData.get("name") ?? "").trim();
  const categoryValue = String(formData.get("category") ?? "");
  const quantityValue = parseOptionalNumber(formData.get("quantity"));
  const unitValue = String(formData.get("unit") ?? "");
  const planSelectable = String(formData.get("planSelectable") ?? "") === "true";
  const availabilityValue = String(formData.get("availability") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  const errors: Record<string, string> = {};

  if (idValue !== undefined && !Number.isInteger(idValue)) {
    errors.form = "Invalid equipment record.";
  }

  if (sourceNumberValue !== undefined) {
    if (!Number.isInteger(sourceNumberValue) || sourceNumberValue < 0) {
      errors.sourceNumber = "Source number must be a whole number.";
    }
  }

  if (!name) {
    errors.equipmentName = "Equipment name is required.";
  }

  if (!isValidCategory(categoryValue)) {
    errors.category = "Select a valid category.";
  }

  if (
    quantityValue === undefined ||
    Number.isNaN(quantityValue) ||
    !Number.isInteger(quantityValue) ||
    quantityValue < 0
  ) {
    errors.quantity = "Quantity must be 0 or higher.";
  }

  if (!isValidUnit(unitValue)) {
    errors.unit = "Select a valid unit.";
  }

  if (!isValidAvailability(availabilityValue)) {
    errors.availability = "Select a valid availability value.";
  }

  if (
    sourceNumberValue !== undefined &&
    !errors.sourceNumber &&
    Number.isInteger(sourceNumberValue)
  ) {
    const conflict = await findEquipmentSourceNumberConflict(
      sourceNumberValue,
      idValue !== undefined ? idValue : undefined,
    );

    if (conflict) {
      errors.sourceNumber =
        "Source number must be unique when a source number is provided.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "",
      errors,
    };
  }

  const category = categoryValue as EquipmentCategory;
  const quantity = quantityValue as number;
  const unit = unitValue as EquipmentUnit;
  const availability = availabilityValue as EquipmentAvailability;

  try {
    const saved = await saveEquipment({
      id: idValue !== undefined ? idValue : undefined,
      sourceNumber: sourceNumberValue ?? null,
      name,
      category,
      quantity,
      unit,
      planSelectable,
      availability,
      notes,
    });

    if (!saved) {
      return {
        success: false,
        message: "",
        errors: {
          form: "The equipment record could not be found.",
        },
      };
    }
  } catch {
    return {
      success: false,
      message: "",
      errors: {
        form: "Unable to save equipment right now.",
      },
    };
  }

  revalidatePath("/admin/equipment");

  return {
    success: true,
    message: "Equipment saved successfully.",
    errors: {},
  };
}

export async function updateEquipmentAvailabilityAction(input: {
  id: number;
  availability: EquipmentAvailability;
}) {
  try {
    await requireAdminUser();
  } catch {
    return {
      success: false,
      message: "Admin access is required for this action.",
    };
  }

  if (!Number.isInteger(input.id) || !isValidAvailability(input.availability)) {
    return {
      success: false,
      message: "Invalid equipment update.",
    };
  }

  try {
    const saved = await updateEquipmentAvailability(input.id, input.availability);

    if (!saved) {
      return {
        success: false,
        message: "The equipment record could not be found.",
      };
    }
  } catch {
    return {
      success: false,
      message: "Unable to update equipment availability right now.",
    };
  }

  revalidatePath("/admin/equipment");

  return {
    success: true,
    message: "Equipment availability updated.",
  };
}
