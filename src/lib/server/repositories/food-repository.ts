import "server-only";

import { requireAdminUser } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import type {
  AdminFoodItem,
  AdminRecordStatus,
  FoodMealCategory,
} from "@/types/admin-data";

export interface FoodListFilters {
  search?: string;
  mealCategory?: FoodMealCategory | "All";
  allergen?: string | "All";
  status?: AdminRecordStatus | "All";
}

export interface FoodWriteInput {
  id?: number;
  name: string;
  mealCategory: FoodMealCategory;
  servingDescription: string;
  calories: number;
  proteinGrams?: number | null;
  allergen: string;
  status: AdminRecordStatus;
}

interface FoodRow {
  id: number;
  name: string;
  meal_category: FoodMealCategory;
  serving_description: string;
  calories: number;
  protein_grams: string | number | null;
  allergen: string | null;
  status: AdminRecordStatus;
}

function mapFoodRow(row: FoodRow): AdminFoodItem {
  return {
    id: String(row.id),
    foodName: row.name,
    mealCategory: row.meal_category,
    servingDescription: row.serving_description,
    calories: row.calories,
    proteinGrams:
      row.protein_grams === null ? undefined : Number(row.protein_grams),
    allergen: row.allergen ?? "",
    status: row.status,
  };
}

export async function listFoods(
  filters: FoodListFilters,
): Promise<AdminFoodItem[]> {
  const params: unknown[] = [];
  const where: string[] = [];

  if (filters.search) {
    params.push(`%${filters.search.trim()}%`);
    where.push(`name ILIKE $${params.length}`);
  }

  if (filters.mealCategory && filters.mealCategory !== "All") {
    params.push(filters.mealCategory);
    where.push(`meal_category = $${params.length}`);
  }

  if (filters.allergen && filters.allergen !== "All") {
    params.push(filters.allergen);
    where.push(`COALESCE(NULLIF(allergen, ''), 'None') = $${params.length}`);
  }

  if (filters.status && filters.status !== "All") {
    params.push(filters.status);
    where.push(`status = $${params.length}`);
  }

  const result = await query<FoodRow>(
    `
      SELECT
        id,
        name,
        meal_category,
        serving_description,
        calories,
        protein_grams,
        allergen,
        status
      FROM foods
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY name ASC, id ASC
    `,
    params,
  );

  return result.rows.map(mapFoodRow);
}

export async function listFoodAllergens(): Promise<string[]> {
  const result = await query<{ allergen: string }>(
    `
      SELECT DISTINCT COALESCE(NULLIF(allergen, ''), 'None') AS allergen
      FROM foods
      ORDER BY allergen ASC
    `,
  );

  return result.rows.map((row) => row.allergen);
}

export async function findFoodDuplicate(input: {
  name: string;
  mealCategory: FoodMealCategory;
  servingDescription: string;
  excludeId?: number;
}) {
  const params: unknown[] = [
    input.name.trim().toLowerCase(),
    input.mealCategory,
    input.servingDescription.trim().toLowerCase(),
  ];
  let text = `
    SELECT id
    FROM foods
    WHERE LOWER(name) = $1
      AND meal_category = $2
      AND LOWER(serving_description) = $3
  `;

  if (input.excludeId !== undefined) {
    params.push(input.excludeId);
    text += ` AND id <> $4`;
  }

  text += " LIMIT 1";

  const result = await query<{ id: number }>(text, params);
  return result.rows[0] ?? null;
}

export async function saveFood(input: FoodWriteInput) {
  await requireAdminUser();

  const params = [
    input.name,
    input.mealCategory,
    input.servingDescription,
    input.calories,
    input.proteinGrams ?? null,
    input.allergen || null,
    input.status,
  ];

  if (input.id !== undefined) {
    const result = await query<FoodRow>(
      `
        UPDATE foods
        SET
          name = $1,
          meal_category = $2,
          serving_description = $3,
          calories = $4,
          protein_grams = $5,
          allergen = $6,
          status = $7
        WHERE id = $8
        RETURNING
          id,
          name,
          meal_category,
          serving_description,
          calories,
          protein_grams,
          allergen,
          status
      `,
      [...params, input.id],
    );

    return result.rows[0] ? mapFoodRow(result.rows[0]) : null;
  }

  const result = await query<FoodRow>(
    `
      INSERT INTO foods (
        name,
        meal_category,
        serving_description,
        calories,
        protein_grams,
        allergen,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        name,
        meal_category,
        serving_description,
        calories,
        protein_grams,
        allergen,
        status
    `,
    params,
  );

  return mapFoodRow(result.rows[0]);
}

export async function updateFoodStatus(
  id: number,
  status: AdminRecordStatus,
) {
  await requireAdminUser();

  const result = await query<FoodRow>(
    `
      UPDATE foods
      SET status = $2
      WHERE id = $1
      RETURNING
        id,
        name,
        meal_category,
        serving_description,
        calories,
        protein_grams,
        allergen,
        status
    `,
    [id, status],
  );

  return result.rows[0] ? mapFoodRow(result.rows[0]) : null;
}
