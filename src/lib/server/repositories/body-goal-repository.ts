import "server-only";

import { requireAdminUser } from "@/lib/server/auth";
import { query, withTransaction } from "@/lib/server/db";
import type {
  AdminBodyGoalItem,
  AdminRecordStatus,
  BodyGoalImageGender,
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
  status?: AdminRecordStatus | "All";
}

export interface BodyGoalWriteInput {
  id?: number;
  label: string;
  description: string;
  maleImageUrl?: string | null;
  femaleImageUrl?: string | null;
  unisexImageUrl?: string | null;
  workoutTemplateId?: number | null;
  nutritionTemplateId?: number | null;
  status: AdminRecordStatus;
}

interface BodyGoalRow {
  id: number;
  label: string;
  description: string;
  male_image_url: string | null;
  female_image_url: string | null;
  unisex_image_url: string | null;
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
    maleImageUrl: row.male_image_url ?? "",
    femaleImageUrl: row.female_image_url ?? "",
    unisexImageUrl: row.unisex_image_url ?? "",
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
        MAX(bgi.image_url) FILTER (WHERE bgi.gender = 'male') AS male_image_url,
        MAX(bgi.image_url) FILTER (WHERE bgi.gender = 'female') AS female_image_url,
        MAX(bgi.image_url) FILTER (WHERE bgi.gender = 'unisex') AS unisex_image_url,
        bg.workout_template_id,
        bg.nutrition_template_id,
        bg.status,
        wt.name AS workout_template_name,
        nt.name AS nutrition_template_name
      FROM body_goals AS bg
      LEFT JOIN body_goal_images AS bgi
        ON bgi.body_goal_id = bg.id
      LEFT JOIN workout_templates AS wt
        ON wt.id = bg.workout_template_id
      LEFT JOIN nutrition_templates AS nt
        ON nt.id = bg.nutrition_template_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      GROUP BY
        bg.id,
        bg.label,
        bg.description,
        bg.workout_template_id,
        bg.nutrition_template_id,
        bg.status,
        wt.name,
        nt.name
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

  const imageEntries: Array<{
    gender: BodyGoalImageGender;
    imageUrl: string | null;
  }> = [
    { gender: "male", imageUrl: input.maleImageUrl ?? null },
    { gender: "female", imageUrl: input.femaleImageUrl ?? null },
    { gender: "unisex", imageUrl: input.unisexImageUrl ?? null },
  ];

  return withTransaction(async (client) => {
    const params = [
      input.label,
      input.description,
      input.workoutTemplateId ?? null,
      input.nutritionTemplateId ?? null,
      input.status,
    ];

    let bodyGoalId = input.id;

    if (bodyGoalId !== undefined) {
      const result = await client.query<{ id: number }>(
        `
          UPDATE body_goals
          SET
            label = $1,
            description = $2,
            workout_template_id = $3,
            nutrition_template_id = $4,
            status = $5
          WHERE id = $6
          RETURNING id
        `,
        [...params, bodyGoalId],
      );

      if (!result.rows[0]) {
        return null;
      }
    } else {
      const result = await client.query<{ id: number }>(
        `
          INSERT INTO body_goals (
            label,
            description,
            workout_template_id,
            nutrition_template_id,
            status
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `,
        params,
      );

      bodyGoalId = result.rows[0].id;
    }

    for (const entry of imageEntries) {
      if (entry.imageUrl) {
        await client.query(
          `
            INSERT INTO body_goal_images (
              body_goal_id,
              gender,
              image_url
            )
            VALUES ($1, $2, $3)
            ON CONFLICT (body_goal_id, gender)
            DO UPDATE SET
              image_url = EXCLUDED.image_url
          `,
          [bodyGoalId, entry.gender, entry.imageUrl],
        );
      } else {
        await client.query(
          `
            DELETE FROM body_goal_images
            WHERE body_goal_id = $1
              AND gender = $2
          `,
          [bodyGoalId, entry.gender],
        );
      }
    }

    const savedResult = await client.query<BodyGoalRow>(
      `
        SELECT
          bg.id,
          bg.label,
          bg.description,
          MAX(bgi.image_url) FILTER (WHERE bgi.gender = 'male') AS male_image_url,
          MAX(bgi.image_url) FILTER (WHERE bgi.gender = 'female') AS female_image_url,
          MAX(bgi.image_url) FILTER (WHERE bgi.gender = 'unisex') AS unisex_image_url,
          bg.workout_template_id,
          bg.nutrition_template_id,
          bg.status,
          wt.name AS workout_template_name,
          nt.name AS nutrition_template_name
        FROM body_goals AS bg
        LEFT JOIN body_goal_images AS bgi
          ON bgi.body_goal_id = bg.id
        LEFT JOIN workout_templates AS wt
          ON wt.id = bg.workout_template_id
        LEFT JOIN nutrition_templates AS nt
          ON nt.id = bg.nutrition_template_id
        WHERE bg.id = $1
        GROUP BY
          bg.id,
          bg.label,
          bg.description,
          bg.workout_template_id,
          bg.nutrition_template_id,
          bg.status,
          wt.name,
          nt.name
      `,
      [bodyGoalId],
    );

    return savedResult.rows[0] ? mapBodyGoalRow(savedResult.rows[0]) : null;
  });
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
    `,
    [id, status],
  );

  if (!result.rowCount) {
    return null;
  }

  const savedResult = await query<BodyGoalRow>(
    `
      SELECT
        bg.id,
        bg.label,
        bg.description,
        MAX(bgi.image_url) FILTER (WHERE bgi.gender = 'male') AS male_image_url,
        MAX(bgi.image_url) FILTER (WHERE bgi.gender = 'female') AS female_image_url,
        MAX(bgi.image_url) FILTER (WHERE bgi.gender = 'unisex') AS unisex_image_url,
        bg.workout_template_id,
        bg.nutrition_template_id,
        bg.status,
        wt.name AS workout_template_name,
        nt.name AS nutrition_template_name
      FROM body_goals AS bg
      LEFT JOIN body_goal_images AS bgi
        ON bgi.body_goal_id = bg.id
      LEFT JOIN workout_templates AS wt
        ON wt.id = bg.workout_template_id
      LEFT JOIN nutrition_templates AS nt
        ON nt.id = bg.nutrition_template_id
      WHERE bg.id = $1
      GROUP BY
        bg.id,
        bg.label,
        bg.description,
        bg.workout_template_id,
        bg.nutrition_template_id,
        bg.status,
        wt.name,
        nt.name
    `,
    [id],
  );

  return savedResult.rows[0] ? mapBodyGoalRow(savedResult.rows[0]) : null;
}
