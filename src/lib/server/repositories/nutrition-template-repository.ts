import "server-only";

import type { PoolClient } from "pg";

import { requireAdminUser } from "@/lib/server/auth";
import { query, withTransaction } from "@/lib/server/db";
import type {
  AdminNutritionTemplateItem,
  AdminRecordStatus,
  FoodMealCategory,
} from "@/types/admin-data";

export interface NutritionTemplateRecord extends AdminNutritionTemplateItem {
  bodyGoalLabel: string;
}

export interface NutritionTemplateListFilters {
  search?: string;
  bodyGoalId?: number | "All";
  status?: AdminRecordStatus | "All";
}

export interface NutritionTemplateWriteInput {
  id?: number;
  name: string;
  bodyGoalId: number;
  mealsPerDay: 3 | 4 | 5;
  minimumCalories: number;
  maximumCalories: number;
  mealStructure: FoodMealCategory[];
  notes?: string | null;
  status: AdminRecordStatus;
}

interface NutritionTemplateRow {
  id: number;
  name: string;
  body_goal_id: number;
  body_goal_label: string;
  meals_per_day: 3 | 4 | 5;
  minimum_calories: number;
  maximum_calories: number;
  meal_structure: FoodMealCategory[];
  notes: string | null;
  status: AdminRecordStatus;
}

interface BodyGoalTemplateLinkRow {
  body_goal_id: number;
}

function mapNutritionTemplateRow(
  row: NutritionTemplateRow,
): NutritionTemplateRecord {
  return {
    id: String(row.id),
    templateName: row.name,
    bodyGoalId: String(row.body_goal_id),
    bodyGoalLabel: row.body_goal_label,
    mealsPerDay: row.meals_per_day,
    minimumDailyCalories: row.minimum_calories,
    maximumDailyCalories: row.maximum_calories,
    mealStructure: row.meal_structure,
    notes: row.notes ?? "",
    status: row.status,
  };
}

export async function listNutritionTemplates(
  filters: NutritionTemplateListFilters,
): Promise<NutritionTemplateRecord[]> {
  const params: unknown[] = [];
  const where: string[] = [];

  if (filters.search) {
    params.push(`%${filters.search.trim()}%`);
    where.push(`nt.name ILIKE $${params.length}`);
  }

  if (filters.bodyGoalId && filters.bodyGoalId !== "All") {
    params.push(filters.bodyGoalId);
    where.push(`nt.body_goal_id = $${params.length}`);
  }

  if (filters.status && filters.status !== "All") {
    params.push(filters.status);
    where.push(`nt.status = $${params.length}`);
  }

  const result = await query<NutritionTemplateRow>(
    `
      SELECT
        nt.id,
        nt.name,
        nt.body_goal_id,
        bg.label AS body_goal_label,
        nt.meals_per_day,
        nt.minimum_calories,
        nt.maximum_calories,
        nt.meal_structure,
        nt.notes,
        nt.status
      FROM nutrition_templates AS nt
      INNER JOIN body_goals AS bg
        ON bg.id = nt.body_goal_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY nt.name ASC, nt.id ASC
    `,
    params,
  );

  return result.rows.map(mapNutritionTemplateRow);
}

export async function findNutritionTemplateDuplicate(
  name: string,
  excludeId?: number,
) {
  const params: unknown[] = [name.trim().toLowerCase()];
  let text = `
    SELECT id
    FROM nutrition_templates
    WHERE LOWER(name) = $1
  `;

  if (excludeId !== undefined) {
    params.push(excludeId);
    text += ` AND id <> $2`;
  }

  text += " LIMIT 1";

  const result = await query<{ id: number }>(text, params);
  return result.rows[0] ?? null;
}

export async function findActiveBodyGoalById(id: number) {
  const result = await query<{ id: number }>(
    `
      SELECT id
      FROM body_goals
      WHERE id = $1
        AND status = 'Active'
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

async function findNutritionTemplateBodyGoalLink(
  client: PoolClient,
  templateId: number,
) {
  const result = await client.query<BodyGoalTemplateLinkRow>(
    `
      SELECT id AS body_goal_id
      FROM body_goals
      WHERE nutrition_template_id = $1
      LIMIT 1
    `,
    [templateId],
  );

  return result.rows[0] ?? null;
}

export async function saveNutritionTemplate(
  input: NutritionTemplateWriteInput,
) {
  await requireAdminUser();

  return withTransaction(async (client) => {
    const previousLinkedBodyGoal =
      input.id !== undefined
        ? await findNutritionTemplateBodyGoalLink(client, input.id)
        : null;

    const params = [
      input.name,
      input.bodyGoalId,
      input.mealsPerDay,
      input.minimumCalories,
      input.maximumCalories,
      input.mealStructure,
      input.notes ?? null,
      input.status,
    ];

    const result =
      input.id !== undefined
        ? await client.query<{ id: number }>(
            `
              UPDATE nutrition_templates
              SET
                name = $1,
                body_goal_id = $2,
                meals_per_day = $3,
                minimum_calories = $4,
                maximum_calories = $5,
                meal_structure = $6,
                notes = $7,
                status = $8
              WHERE id = $9
              RETURNING id
            `,
            [...params, input.id],
          )
        : await client.query<{ id: number }>(
            `
              INSERT INTO nutrition_templates (
                name,
                body_goal_id,
                meals_per_day,
                minimum_calories,
                maximum_calories,
                meal_structure,
                notes,
                status
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING id
            `,
            params,
          );

    const saved = result.rows[0];

    if (!saved) {
      return null;
    }

    if (previousLinkedBodyGoal) {
      await client.query(
        `
          UPDATE body_goals
          SET nutrition_template_id = NULL
          WHERE id = $1
            AND nutrition_template_id = $2
        `,
        [previousLinkedBodyGoal.body_goal_id, saved.id],
      );
    }

    if (input.status === "Active") {
      await client.query(
        `
          UPDATE body_goals
          SET nutrition_template_id = $2
          WHERE id = $1
            AND (nutrition_template_id IS NULL OR nutrition_template_id = $2)
        `,
        [input.bodyGoalId, saved.id],
      );
    }

    return saved.id;
  });
}

export async function updateNutritionTemplateStatus(
  id: number,
  status: AdminRecordStatus,
) {
  await requireAdminUser();

  return withTransaction(async (client) => {
    const result = await client.query<{ id: number }>(
      `
        UPDATE nutrition_templates
        SET status = $2
        WHERE id = $1
        RETURNING id
      `,
      [id, status],
    );

    const saved = result.rows[0] ?? null;

    if (!saved) {
      return null;
    }

    if (status === "Inactive") {
      await client.query(
        `
          UPDATE body_goals
          SET nutrition_template_id = NULL
          WHERE nutrition_template_id = $1
        `,
        [id],
      );
    }

    return saved;
  });
}
