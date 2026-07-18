import "server-only";

import { requireAdminUser } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import type {
  AdminBodyGoalItem,
  AdminRecordStatus,
  GenderDisplay,
} from "@/types/admin-data";

export interface BodyGoalRecord extends AdminBodyGoalItem {
  workoutTemplateName?: string;
  nutritionTemplateName?: string;
}

export interface BodyGoalTemplateOption {
  id: number;
  name: string;
}

export interface ActiveBodyGoalOption {
  id: number;
  label: string;
}

export interface BodyGoalListFilters {
  search?: string;
  genderDisplay?: GenderDisplay | "All";
  status?: AdminRecordStatus | "All";
}

export interface BodyGoalWriteInput {
  id?: number;
  label: string;
  description: string;
  genderDisplay: GenderDisplay;
  imageUrl?: string | null;
  workoutTemplateId?: number | null;
  nutritionTemplateId?: number | null;
  status: AdminRecordStatus;
}

interface BodyGoalRow {
  id: number;
  label: string;
  description: string;
  gender_display: GenderDisplay;
  image_url: string | null;
  workout_template_id: number | null;
  nutrition_template_id: number | null;
  status: AdminRecordStatus;
  workout_template_name: string | null;
  nutrition_template_name: string | null;
}

function mapBodyGoalRow(row: BodyGoalRow): BodyGoalRecord {
  return {
    id: String(row.id),
    goalLabel: row.label,
    shortDescription: row.description,
    genderDisplay: row.gender_display,
    image: row.image_url ?? "",
    workoutTemplateId:
      row.workout_template_id === null ? "" : String(row.workout_template_id),
    nutritionTemplateId:
      row.nutrition_template_id === null
        ? ""
        : String(row.nutrition_template_id),
    status: row.status,
    workoutTemplateName: row.workout_template_name ?? undefined,
    nutritionTemplateName: row.nutrition_template_name ?? undefined,
  };
}

export async function listBodyGoals(
  filters: BodyGoalListFilters,
): Promise<BodyGoalRecord[]> {
  const params: unknown[] = [];
  const where: string[] = [];

  if (filters.search) {
    params.push(`%${filters.search.trim()}%`);
    where.push(`bg.label ILIKE $${params.length}`);
  }

  if (filters.genderDisplay && filters.genderDisplay !== "All") {
    params.push(filters.genderDisplay);
    where.push(`bg.gender_display = $${params.length}`);
  }

  if (filters.status && filters.status !== "All") {
    params.push(filters.status);
    where.push(`bg.status = $${params.length}`);
  }

  const result = await query<BodyGoalRow>(
    `
      SELECT
        bg.id,
        bg.label,
        bg.description,
        bg.gender_display,
        bg.image_url,
        bg.workout_template_id,
        bg.nutrition_template_id,
        bg.status,
        wt.name AS workout_template_name,
        nt.name AS nutrition_template_name
      FROM body_goals AS bg
      LEFT JOIN workout_templates AS wt
        ON wt.id = bg.workout_template_id
      LEFT JOIN nutrition_templates AS nt
        ON nt.id = bg.nutrition_template_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY bg.label ASC, bg.id ASC
    `,
    params,
  );

  return result.rows.map(mapBodyGoalRow);
}

export async function listActiveWorkoutTemplateOptions(): Promise<
  BodyGoalTemplateOption[]
> {
  const result = await query<{ id: number; name: string }>(
    `
      SELECT id, name
      FROM workout_templates
      WHERE status = 'Active'
      ORDER BY name ASC, id ASC
    `,
  );

  return result.rows;
}

export async function listActiveBodyGoalOptions(): Promise<
  ActiveBodyGoalOption[]
> {
  const result = await query<{ id: number; label: string }>(
    `
      SELECT id, label
      FROM body_goals
      WHERE status = 'Active'
      ORDER BY label ASC, id ASC
    `,
  );

  return result.rows;
}

export async function listActiveNutritionTemplateOptions(): Promise<
  BodyGoalTemplateOption[]
> {
  const result = await query<{ id: number; name: string }>(
    `
      SELECT id, name
      FROM nutrition_templates
      WHERE status = 'Active'
      ORDER BY name ASC, id ASC
    `,
  );

  return result.rows;
}

export async function findBodyGoalLabelDuplicate(
  label: string,
  excludeId?: number,
) {
  const params: unknown[] = [label.trim().toLowerCase()];
  let text = `
    SELECT id
    FROM body_goals
    WHERE LOWER(label) = $1
  `;

  if (excludeId !== undefined) {
    params.push(excludeId);
    text += ` AND id <> $2`;
  }

  text += " LIMIT 1";

  const result = await query<{ id: number }>(text, params);
  return result.rows[0] ?? null;
}

export async function findActiveWorkoutTemplateById(id: number) {
  const result = await query<{ id: number }>(
    `
      SELECT id
      FROM workout_templates
      WHERE id = $1
        AND status = 'Active'
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function findActiveNutritionTemplateById(id: number) {
  const result = await query<{ id: number }>(
    `
      SELECT id
      FROM nutrition_templates
      WHERE id = $1
        AND status = 'Active'
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function saveBodyGoal(input: BodyGoalWriteInput) {
  await requireAdminUser();

  const params = [
    input.label,
    input.description,
    input.genderDisplay,
    input.imageUrl ?? null,
    input.workoutTemplateId ?? null,
    input.nutritionTemplateId ?? null,
    input.status,
  ];

  if (input.id !== undefined) {
    const result = await query<BodyGoalRow>(
      `
        UPDATE body_goals
        SET
          label = $1,
          description = $2,
          gender_display = $3,
          image_url = $4,
          workout_template_id = $5,
          nutrition_template_id = $6,
          status = $7
        WHERE id = $8
        RETURNING
          id,
          label,
          description,
          gender_display,
          image_url,
          workout_template_id,
          nutrition_template_id,
          status,
          NULL::text AS workout_template_name,
          NULL::text AS nutrition_template_name
      `,
      [...params, input.id],
    );

    return result.rows[0] ? mapBodyGoalRow(result.rows[0]) : null;
  }

  const result = await query<BodyGoalRow>(
    `
      INSERT INTO body_goals (
        label,
        description,
        gender_display,
        image_url,
        workout_template_id,
        nutrition_template_id,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        label,
        description,
        gender_display,
        image_url,
        workout_template_id,
        nutrition_template_id,
        status,
        NULL::text AS workout_template_name,
        NULL::text AS nutrition_template_name
    `,
    params,
  );

  return mapBodyGoalRow(result.rows[0]);
}

export async function updateBodyGoalStatus(
  id: number,
  status: AdminRecordStatus,
) {
  await requireAdminUser();

  const result = await query<BodyGoalRow>(
    `
      UPDATE body_goals
      SET status = $2
      WHERE id = $1
      RETURNING
        id,
        label,
        description,
        gender_display,
        image_url,
        workout_template_id,
        nutrition_template_id,
        status,
        NULL::text AS workout_template_name,
        NULL::text AS nutrition_template_name
    `,
    [id, status],
  );

  return result.rows[0] ? mapBodyGoalRow(result.rows[0]) : null;
}
