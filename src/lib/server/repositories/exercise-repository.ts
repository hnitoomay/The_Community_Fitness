import "server-only";

import { requireAdminUser } from "@/lib/server/auth";
import { query, withTransaction } from "@/lib/server/db";
import type {
  AdminExerciseItem,
  AdminRecordStatus,
  EquipmentAvailability,
  ExerciseCategory,
  ExerciseDifficulty,
} from "@/types/admin-data";

export interface ExerciseListFilters {
  search?: string;
  category?: ExerciseCategory | "All";
  difficulty?: ExerciseDifficulty | "All";
  status?: AdminRecordStatus | "All";
}

export interface ExerciseEquipmentOption {
  id: number;
  name: string;
  category: string;
}

export interface ExerciseListItem extends AdminExerciseItem {
  requiredEquipmentNames: string[];
}

export interface ExerciseWriteInput {
  id?: number;
  name: string;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  defaultSets?: number | null;
  defaultRepetitionsOrDuration: string;
  instructions: string;
  status: AdminRecordStatus;
  equipmentIds: number[];
}

interface ExerciseListRow {
  id: number;
  name: string;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  default_sets: number | null;
  default_reps_or_duration: string;
  instructions: string;
  status: AdminRecordStatus;
  equipment_ids: Array<number | null>;
  equipment_names: Array<string | null>;
}

interface ExerciseCoreRow {
  id: number;
  name: string;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  default_sets: number | null;
  default_reps_or_duration: string;
  instructions: string;
  status: AdminRecordStatus;
}

function mapExerciseListRow(row: ExerciseListRow): ExerciseListItem {
  const equipmentIds = row.equipment_ids.filter(
    (value): value is number => typeof value === "number",
  );
  const equipmentNames = row.equipment_names.filter(
    (value): value is string => typeof value === "string",
  );

  return {
    id: String(row.id),
    exerciseName: row.name,
    category: row.category,
    difficulty: row.difficulty,
    requiredEquipmentIds: equipmentIds.map(String),
    requiredEquipmentNames: equipmentNames,
    defaultSets: row.default_sets ?? undefined,
    defaultRepetitionsOrDuration: row.default_reps_or_duration,
    shortInstructions: row.instructions,
    status: row.status,
  };
}

export async function listExercises(
  filters: ExerciseListFilters,
): Promise<ExerciseListItem[]> {
  const params: unknown[] = [];
  const where: string[] = [];

  if (filters.search) {
    params.push(`%${filters.search.trim()}%`);
    where.push(`e.name ILIKE $${params.length}`);
  }

  if (filters.category && filters.category !== "All") {
    params.push(filters.category);
    where.push(`e.category = $${params.length}`);
  }

  if (filters.difficulty && filters.difficulty !== "All") {
    params.push(filters.difficulty);
    where.push(`e.difficulty = $${params.length}`);
  }

  if (filters.status && filters.status !== "All") {
    params.push(filters.status);
    where.push(`e.status = $${params.length}`);
  }

  const result = await query<ExerciseListRow>(
    `
      WITH requirement_equipment AS (
        SELECT DISTINCT ON (eer.exercise_id, eer.equipment_type_id)
          eer.exercise_id,
          ge.id AS equipment_id,
          ge.name AS equipment_name
        FROM exercise_equipment_requirements AS eer
        JOIN gym_equipment AS ge
          ON ge.equipment_type_id = eer.equipment_type_id
        WHERE ge.plan_selectable = true
        ORDER BY
          eer.exercise_id,
          eer.equipment_type_id,
          CASE WHEN ge.availability = 'Available' THEN 0 ELSE 1 END,
          ge.name ASC,
          ge.id ASC
      )
      SELECT
        e.id,
        e.name,
        e.category,
        e.difficulty,
        e.default_sets,
        e.default_reps_or_duration,
        e.instructions,
        e.status,
        COALESCE(
          ARRAY_AGG(re.equipment_id ORDER BY re.equipment_name)
            FILTER (WHERE re.equipment_id IS NOT NULL),
          ARRAY[]::integer[]
        ) AS equipment_ids,
        COALESCE(
          ARRAY_AGG(re.equipment_name ORDER BY re.equipment_name)
            FILTER (WHERE re.equipment_name IS NOT NULL),
          ARRAY[]::text[]
        ) AS equipment_names
      FROM exercises AS e
      LEFT JOIN requirement_equipment AS re
        ON re.exercise_id = e.id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      GROUP BY
        e.id,
        e.name,
        e.category,
        e.difficulty,
        e.default_sets,
        e.default_reps_or_duration,
        e.instructions,
        e.status
      ORDER BY e.name ASC, e.id ASC
    `,
    params,
  );

  return result.rows.map(mapExerciseListRow);
}

export async function listSelectableExerciseEquipment(): Promise<
  ExerciseEquipmentOption[]
> {
  const result = await query<{
    id: number;
    name: string;
    category: string;
    availability: EquipmentAvailability;
  }>(
    `
      SELECT id, name, category, availability
      FROM gym_equipment
      WHERE plan_selectable = true
        AND availability = 'Available'
      ORDER BY name ASC, id ASC
    `,
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
  }));
}

export async function updateExerciseStatus(
  id: number,
  status: AdminRecordStatus,
) {
  await requireAdminUser();

  const result = await query<ExerciseCoreRow>(
    `
      UPDATE exercises
      SET status = $2
      WHERE id = $1
      RETURNING
        id,
        name,
        category,
        difficulty,
        default_sets,
        default_reps_or_duration,
        instructions,
        status
    `,
    [id, status],
  );

  return result.rows[0] ?? null;
}

export async function saveExerciseWithEquipment(input: ExerciseWriteInput) {
  await requireAdminUser();

  return withTransaction(async (client) => {
    if (input.equipmentIds.length) {
      const selectableEquipmentResult = await client.query<{
        id: number;
        equipment_type_id: number | null;
      }>(
        `
          SELECT id, equipment_type_id
          FROM gym_equipment
          WHERE id = ANY($1::int[])
            AND plan_selectable = true
            AND availability = 'Available'
            AND equipment_type_id IS NOT NULL
        `,
        [input.equipmentIds],
      );

      const selectableIds = new Set(selectableEquipmentResult.rows.map((row) => row.id));

      for (const equipmentId of input.equipmentIds) {
        if (!selectableIds.has(equipmentId)) {
          throw new Error("INVALID_EQUIPMENT_SELECTION");
        }
      }
    }

    let exerciseId = input.id;

    if (exerciseId !== undefined) {
      const updateResult = await client.query<{ id: number }>(
        `
          UPDATE exercises
          SET
            name = $1,
            category = $2,
            difficulty = $3,
            default_sets = $4,
            default_reps_or_duration = $5,
            instructions = $6,
            status = $7
          WHERE id = $8
          RETURNING id
        `,
        [
          input.name,
          input.category,
          input.difficulty,
          input.defaultSets ?? null,
          input.defaultRepetitionsOrDuration,
          input.instructions,
          input.status,
          exerciseId,
        ],
      );

      if (!updateResult.rows[0]) {
        return null;
      }
    } else {
      const insertResult = await client.query<{ id: number }>(
        `
          INSERT INTO exercises (
            name,
            category,
            difficulty,
            default_sets,
            default_reps_or_duration,
            instructions,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `,
        [
          input.name,
          input.category,
          input.difficulty,
          input.defaultSets ?? null,
          input.defaultRepetitionsOrDuration,
          input.instructions,
          input.status,
        ],
      );

      exerciseId = insertResult.rows[0].id;
    }

    await client.query(
      `
        DELETE FROM exercise_equipment_requirements
        WHERE exercise_id = $1
      `,
      [exerciseId],
    );

    if (input.equipmentIds.length) {
      const selectedEquipmentTypes = await client.query<{
        equipment_type_id: number;
      }>(
        `
          SELECT DISTINCT ge.equipment_type_id
          FROM gym_equipment AS ge
          WHERE ge.id = ANY($1::int[])
            AND ge.plan_selectable = true
            AND ge.availability = 'Available'
            AND ge.equipment_type_id IS NOT NULL
        `,
        [input.equipmentIds],
      );

      const equipmentTypeIds = selectedEquipmentTypes.rows.map(
        (row) => row.equipment_type_id,
      );

      await client.query(
        `
          INSERT INTO exercise_equipment_requirements (
            exercise_id,
            equipment_type_id,
            required,
            notes
          )
          SELECT
            $1,
            UNNEST($2::int[]),
            true,
            NULL
        `,
        [exerciseId, equipmentTypeIds],
      );
    }

    return exerciseId;
  });
}
