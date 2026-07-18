import "server-only";

import type { PoolClient } from "pg";

import { requireAdminUser } from "@/lib/server/auth";
import { query, withTransaction } from "@/lib/server/db";
import type {
  AdminRecordStatus,
  AdminWorkoutTemplateItem,
  ExerciseDifficulty,
  FocusCategory,
  TemplateDayType,
  WorkoutTemplateDayRow,
} from "@/types/admin-data";

export interface WorkoutTemplateRecord extends AdminWorkoutTemplateItem {
  bodyGoalLabel: string;
}

export interface WorkoutTemplateListFilters {
  search?: string;
  bodyGoalId?: number | "All";
  difficulty?: ExerciseDifficulty | "All";
  status?: AdminRecordStatus | "All";
}

export interface WorkoutTemplateWriteDayInput {
  dayNumber: number;
  dayType: TemplateDayType;
  focusCategory: FocusCategory;
  exerciseCount: number;
}

export interface WorkoutTemplateWriteInput {
  id?: number;
  name: string;
  bodyGoalId: number;
  daysPerWeek: 3 | 4 | 5 | 6;
  difficulty: ExerciseDifficulty;
  notes?: string | null;
  status: AdminRecordStatus;
  weeklyDayStructure: WorkoutTemplateWriteDayInput[];
}

interface WorkoutTemplateRow {
  id: number;
  name: string;
  body_goal_id: number;
  body_goal_label: string;
  days_per_week: 3 | 4 | 5 | 6;
  difficulty: ExerciseDifficulty;
  notes: string | null;
  status: AdminRecordStatus;
}

interface WorkoutTemplateDayDbRow {
  id: number;
  workout_template_id: number;
  day_number: number;
  day_type: TemplateDayType;
  focus_category: FocusCategory;
  exercise_count: number;
}

interface BodyGoalTemplateLinkRow {
  body_goal_id: number;
}

function mapWorkoutTemplateDayRow(
  row: WorkoutTemplateDayDbRow,
): WorkoutTemplateDayRow {
  return {
    id: String(row.id),
    dayNumber: row.day_number,
    dayType: row.day_type,
    focusCategory: row.focus_category,
    exerciseCount: row.exercise_count,
  };
}

function mapWorkoutTemplateRow(
  row: WorkoutTemplateRow,
  weeklyDayStructure: WorkoutTemplateDayRow[],
): WorkoutTemplateRecord {
  return {
    id: String(row.id),
    templateName: row.name,
    bodyGoalId: String(row.body_goal_id),
    bodyGoalLabel: row.body_goal_label,
    daysPerWeek: row.days_per_week,
    difficulty: row.difficulty,
    weeklyDayStructure,
    notes: row.notes ?? "",
    status: row.status,
  };
}

export async function listWorkoutTemplates(
  filters: WorkoutTemplateListFilters,
): Promise<WorkoutTemplateRecord[]> {
  const params: unknown[] = [];
  const where: string[] = [];

  if (filters.search) {
    params.push(`%${filters.search.trim()}%`);
    where.push(`wt.name ILIKE $${params.length}`);
  }

  if (filters.bodyGoalId && filters.bodyGoalId !== "All") {
    params.push(filters.bodyGoalId);
    where.push(`wt.body_goal_id = $${params.length}`);
  }

  if (filters.difficulty && filters.difficulty !== "All") {
    params.push(filters.difficulty);
    where.push(`wt.difficulty = $${params.length}`);
  }

  if (filters.status && filters.status !== "All") {
    params.push(filters.status);
    where.push(`wt.status = $${params.length}`);
  }

  const templateResult = await query<WorkoutTemplateRow>(
    `
      SELECT
        wt.id,
        wt.name,
        wt.body_goal_id,
        bg.label AS body_goal_label,
        wt.days_per_week,
        wt.difficulty,
        wt.notes,
        wt.status
      FROM workout_templates AS wt
      INNER JOIN body_goals AS bg
        ON bg.id = wt.body_goal_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY wt.name ASC, wt.id ASC
    `,
    params,
  );

  if (!templateResult.rows.length) {
    return [];
  }

  const templateIds = templateResult.rows.map((row) => row.id);
  const dayResult = await query<WorkoutTemplateDayDbRow>(
    `
      SELECT
        id,
        workout_template_id,
        day_number,
        day_type,
        focus_category,
        exercise_count
      FROM workout_template_days
      WHERE workout_template_id = ANY($1::int[])
      ORDER BY workout_template_id ASC, day_number ASC, id ASC
    `,
    [templateIds],
  );

  const daysByTemplateId = new Map<number, WorkoutTemplateDayRow[]>();

  for (const row of dayResult.rows) {
    const current = daysByTemplateId.get(row.workout_template_id) ?? [];
    current.push(mapWorkoutTemplateDayRow(row));
    daysByTemplateId.set(row.workout_template_id, current);
  }

  return templateResult.rows.map((row) =>
    mapWorkoutTemplateRow(row, daysByTemplateId.get(row.id) ?? []),
  );
}

export async function findWorkoutTemplateDuplicate(
  name: string,
  excludeId?: number,
) {
  const params: unknown[] = [name.trim().toLowerCase()];
  let text = `
    SELECT id
    FROM workout_templates
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

async function findWorkoutTemplateBodyGoalLink(
  client: PoolClient,
  templateId: number,
) {
  const result = await client.query<BodyGoalTemplateLinkRow>(
    `
      SELECT id AS body_goal_id
      FROM body_goals
      WHERE workout_template_id = $1
      LIMIT 1
    `,
    [templateId],
  );

  return result.rows[0] ?? null;
}

export async function saveWorkoutTemplateWithDays(
  input: WorkoutTemplateWriteInput,
) {
  await requireAdminUser();

  return withTransaction(async (client) => {
    const previousLinkedBodyGoal =
      input.id !== undefined
        ? await findWorkoutTemplateBodyGoalLink(client, input.id)
        : null;

    const params = [
      input.name,
      input.bodyGoalId,
      input.daysPerWeek,
      input.difficulty,
      input.notes ?? null,
      input.status,
    ];

    const templateResult =
      input.id !== undefined
        ? await client.query<WorkoutTemplateRow>(
            `
              UPDATE workout_templates
              SET
                name = $1,
                body_goal_id = $2,
                days_per_week = $3,
                difficulty = $4,
                notes = $5,
                status = $6
              WHERE id = $7
              RETURNING
                id,
                name,
                body_goal_id,
                ''::text AS body_goal_label,
                days_per_week,
                difficulty,
                notes,
                status
            `,
            [...params, input.id],
          )
        : await client.query<WorkoutTemplateRow>(
            `
              INSERT INTO workout_templates (
                name,
                body_goal_id,
                days_per_week,
                difficulty,
                notes,
                status
              )
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING
                id,
                name,
                body_goal_id,
                ''::text AS body_goal_label,
                days_per_week,
                difficulty,
                notes,
                status
            `,
            params,
          );

    const savedTemplate = templateResult.rows[0];

    if (!savedTemplate) {
      return null;
    }

    await client.query(
      `
        DELETE FROM workout_template_days
        WHERE workout_template_id = $1
      `,
      [savedTemplate.id],
    );

    for (const day of input.weeklyDayStructure) {
      await client.query(
        `
          INSERT INTO workout_template_days (
            workout_template_id,
            day_number,
            day_type,
            focus_category,
            exercise_count
          )
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          savedTemplate.id,
          day.dayNumber,
          day.dayType,
          day.focusCategory,
          day.exerciseCount,
        ],
      );
    }

    if (previousLinkedBodyGoal) {
      await client.query(
        `
          UPDATE body_goals
          SET workout_template_id = NULL
          WHERE id = $1
            AND workout_template_id = $2
        `,
        [previousLinkedBodyGoal.body_goal_id, savedTemplate.id],
      );
    }

    if (input.status === "Active") {
      await client.query(
        `
          UPDATE body_goals
          SET workout_template_id = $2
          WHERE id = $1
            AND (workout_template_id IS NULL OR workout_template_id = $2)
        `,
        [input.bodyGoalId, savedTemplate.id],
      );
    }

    return savedTemplate.id;
  });
}

export async function updateWorkoutTemplateStatus(
  id: number,
  status: AdminRecordStatus,
) {
  await requireAdminUser();

  return withTransaction(async (client) => {
    const result = await client.query<{ id: number }>(
      `
        UPDATE workout_templates
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
          SET workout_template_id = NULL
          WHERE workout_template_id = $1
        `,
        [id],
      );
    }

    return saved;
  });
}
