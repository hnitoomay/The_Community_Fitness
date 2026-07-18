import "server-only";

import { resolveCurrentAge } from "@/lib/date-of-birth";
import { query } from "@/lib/server/db";
import type {
  AiAssessmentContent,
  AiAssessmentRecord,
  ClientAssessmentInput,
} from "@/types/client-onboarding";

interface AssessmentInputRow {
  date_of_birth: string | null;
  age: number | null;
  gender: string | null;
  selected_body_goal_id: number | null;
  goal_label: string | null;
  goal_description: string | null;
  height_cm: string | number | null;
  weight_kg: string | number | null;
  waist_cm: string | number | null;
  chest_cm: string | number | null;
  hip_cm: string | number | null;
  arm_cm: string | number | null;
  thigh_cm: string | number | null;
  body_fat_percent: string | number | null;
  medical_conditions: string[] | null;
  other_health_condition: string | null;
  disliked_exercises: string[] | null;
  food_allergies: string[] | null;
  food_restrictions: string[] | null;
  disliked_foods: string[] | null;
}

interface AiAssessmentRow {
  id: number;
  user_id: string;
  body_goal_id: number | null;
  profile_snapshot: ClientAssessmentInput;
  input_hash: string;
  assessment: AiAssessmentContent;
  language: string;
  model_name: string;
  created_at: string;
}

function mapAssessmentInputRow(row?: AssessmentInputRow): ClientAssessmentInput | null {
  if (!row) {
    return null;
  }

  return {
    age: resolveCurrentAge({
      dateOfBirth: row.date_of_birth,
      legacyAge: row.age,
    }),
    gender: row.gender,
    measurements: {
      heightCm: row.height_cm === null ? null : String(row.height_cm),
      weightKg: row.weight_kg === null ? null : String(row.weight_kg),
      waistCm: row.waist_cm === null ? null : String(row.waist_cm),
      chestCm: row.chest_cm === null ? null : String(row.chest_cm),
      hipCm: row.hip_cm === null ? null : String(row.hip_cm),
      armCm: row.arm_cm === null ? null : String(row.arm_cm),
      thighCm: row.thigh_cm === null ? null : String(row.thigh_cm),
      bodyFatPercent:
        row.body_fat_percent === null ? null : String(row.body_fat_percent),
    },
    bodyGoal: {
      id: row.selected_body_goal_id,
      label: row.goal_label,
      description: row.goal_description,
    },
    medicalConditions: row.medical_conditions ?? [],
    otherHealthCondition: row.other_health_condition,
    dislikedExercises: row.disliked_exercises ?? [],
    foodAllergies: row.food_allergies ?? [],
    foodRestrictions: row.food_restrictions ?? [],
    dislikedFoods: row.disliked_foods ?? [],
  };
}

function mapAiAssessmentRow(row: AiAssessmentRow): AiAssessmentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    bodyGoalId: row.body_goal_id,
    profileSnapshot: row.profile_snapshot,
    inputHash: row.input_hash,
    assessment: row.assessment,
    language: row.language,
    modelName: row.model_name,
    createdAt: row.created_at,
  };
}

export async function getAssessmentInputForUser(userId: string) {
  const result = await query<AssessmentInputRow>(
    `
      SELECT
        cp.date_of_birth::text,
        cp.age,
        cp.gender,
        cp.selected_body_goal_id,
        bg.label AS goal_label,
        bg.description AS goal_description,
        latest.height_cm,
        latest.weight_kg,
        latest.waist_cm,
        latest.chest_cm,
        latest.hip_cm,
        latest.arm_cm,
        latest.thigh_cm,
        latest.body_fat_percent,
        pref.medical_conditions,
        pref.other_health_condition,
        pref.disliked_exercises,
        pref.food_allergies,
        pref.food_restrictions,
        pref.disliked_foods
      FROM client_profiles AS cp
      LEFT JOIN body_goals AS bg
        ON bg.id = cp.selected_body_goal_id
      LEFT JOIN LATERAL (
        SELECT
          bm.height_cm,
          bm.weight_kg,
          bm.waist_cm,
          bm.chest_cm,
          bm.hip_cm,
          bm.arm_cm,
          bm.thigh_cm,
          bm.body_fat_percent
        FROM body_measurements AS bm
        WHERE bm.user_id = cp.user_id
        ORDER BY bm.measured_at DESC, bm.id DESC
        LIMIT 1
      ) AS latest
        ON TRUE
      LEFT JOIN client_preferences AS pref
        ON pref.user_id = cp.user_id
      WHERE cp.user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  return mapAssessmentInputRow(result.rows[0]);
}

export async function getLatestAiAssessmentForUser(userId: string) {
  const result = await query<AiAssessmentRow>(
    `
      SELECT
        id,
        user_id,
        body_goal_id,
        profile_snapshot,
        input_hash,
        assessment,
        language,
        model_name,
        created_at::text
      FROM ai_assessments
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] ? mapAiAssessmentRow(result.rows[0]) : null;
}

export async function insertAiAssessment(input: {
  userId: string;
  bodyGoalId: number | null;
  profileSnapshot: ClientAssessmentInput;
  inputHash: string;
  assessment: AiAssessmentContent;
  language: string;
  modelName: string;
}) {
  const result = await query<AiAssessmentRow>(
    `
      INSERT INTO ai_assessments (
        user_id,
        body_goal_id,
        profile_snapshot,
        input_hash,
        assessment,
        language,
        model_name
      )
      VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6, $7)
      RETURNING
        id,
        user_id,
        body_goal_id,
        profile_snapshot,
        input_hash,
        assessment,
        language,
        model_name,
        created_at::text
    `,
    [
      input.userId,
      input.bodyGoalId,
      JSON.stringify(input.profileSnapshot),
      input.inputHash,
      JSON.stringify(input.assessment),
      input.language,
      input.modelName,
    ],
  );

  return mapAiAssessmentRow(result.rows[0]);
}
