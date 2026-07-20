import "server-only";

import type { PoolClient } from "pg";

import { resolveCurrentAge } from "@/lib/date-of-birth";
import { query, withTransaction } from "@/lib/server/db";
import type {
  BodyGoalRecord,
  ClientPreferencesDraft,
  ClientProfileDraft,
  GenderValue,
} from "@/types/client-journey";
import type {
  ClientOnboardingSnapshot,
  ClientProfilePageData,
  SaveClientPreferencesInput,
  SaveClientProfileInput,
} from "@/types/client-onboarding";

type QueryExecutor = typeof query;

interface SnapshotRow {
  full_name: string | null;
  age: number | null;
  gender: GenderValue | null;
  selected_body_goal_id: number | null;
  onboarding_completed: boolean | null;
  preferred_language: string | null;
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

interface ProfilePageRow {
  full_name: string | null;
  age: number | null;
  date_of_birth: string | null;
  gender: GenderValue | null;
  height_cm: string | number | null;
  weight_kg: string | number | null;
  waist_cm: string | number | null;
  chest_cm: string | number | null;
  hip_cm: string | number | null;
  arm_cm: string | number | null;
  thigh_cm: string | number | null;
  body_fat_percent: string | number | null;
}

interface ClientBodyGoalRow {
  id: number;
  label: string;
  description: string;
  image_url: string | null;
}

interface ExistingProfileRow {
  id: number;
}

interface ExistingProfileSnapshotRow {
  full_name: string;
  age: number;
  gender: GenderValue;
}

interface ExistingMeasurementRow {
  height_cm: string | number;
  weight_kg: string | number;
  waist_cm: string | number;
  chest_cm: string | number;
  hip_cm: string | number;
  arm_cm: string | number;
  thigh_cm: string | number;
  body_fat_percent: string | number | null;
}

interface NormalizedMeasurementSnapshot {
  heightCm: string;
  weightKg: string;
  waistCm: string;
  chestCm: string;
  hipCm: string;
  armCm: string;
  thighCm: string;
  bodyFatPercentage: string | null;
}

function emptyProfile(): ClientProfileDraft {
  return {
    fullName: "",
    age: "",
    gender: "",
    measurements: {
      heightCm: "",
      weightKg: "",
      waistCm: "",
      chestCm: "",
      hipCm: "",
      armCm: "",
      thighCm: "",
      bodyFatPercentage: "",
    },
  };
}

function emptyPreferences(): ClientPreferencesDraft {
  return {
    medicalConditionIds: [],
    otherHealthConditionText: "",
    exerciseDislikeChoice: "none",
    dislikedExercises: "",
    foodAllergyChoice: "none",
    foodAllergies: "",
    foodRestrictionChoice: "no",
    foodRestrictions: "",
    dislikedFoodChoice: "no",
    dislikedFoods: "",
  };
}

function formatMeasurementForForm(value: string | number | null | undefined) {
  return normalizeDecimal(value) ?? "";
}

function joinArray(values: string[] | null | undefined) {
  return values && values.length > 0 ? values.join(", ") : "";
}

function mapBodyGoalRow(row: ClientBodyGoalRow): BodyGoalRecord {
  return {
    id: String(row.id),
    label: row.label,
    description: row.description,
    imageUrl: row.image_url,
    imagePlaceholder: row.label,
  };
}

function splitTextareaList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeMedicalConditions(values: string[] | null | undefined) {
  const normalized = (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => value !== "none" && value !== "မရှိ");

  return [...new Set(normalized)];
}

function normalizeOtherHealthCondition(
  medicalConditions: string[],
  otherHealthCondition: string | null | undefined,
) {
  if (!medicalConditions.includes("other-condition")) {
    return null;
  }

  const trimmed = (otherHealthCondition ?? "").trim();
  return trimmed ? trimmed : null;
}

function normalizeDecimal(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = String(value).trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? String(parsed) : trimmed;
}

function normalizeMeasurementInput(
  measurements: ClientProfileDraft["measurements"],
): NormalizedMeasurementSnapshot {
  return {
    heightCm: normalizeDecimal(measurements.heightCm) ?? "",
    weightKg: normalizeDecimal(measurements.weightKg) ?? "",
    waistCm: normalizeDecimal(measurements.waistCm) ?? "",
    chestCm: normalizeDecimal(measurements.chestCm) ?? "",
    hipCm: normalizeDecimal(measurements.hipCm) ?? "",
    armCm: normalizeDecimal(measurements.armCm) ?? "",
    thighCm: normalizeDecimal(measurements.thighCm) ?? "",
    bodyFatPercentage: normalizeDecimal(measurements.bodyFatPercentage),
  };
}

function normalizeMeasurementRow(
  row: ExistingMeasurementRow,
): NormalizedMeasurementSnapshot {
  return {
    heightCm: normalizeDecimal(row.height_cm) ?? "",
    weightKg: normalizeDecimal(row.weight_kg) ?? "",
    waistCm: normalizeDecimal(row.waist_cm) ?? "",
    chestCm: normalizeDecimal(row.chest_cm) ?? "",
    hipCm: normalizeDecimal(row.hip_cm) ?? "",
    armCm: normalizeDecimal(row.arm_cm) ?? "",
    thighCm: normalizeDecimal(row.thigh_cm) ?? "",
    bodyFatPercentage: normalizeDecimal(row.body_fat_percent),
  };
}

function latestMeasurementOrderBy(alias?: string) {
  const prefix = alias ? `${alias}.` : "";

  return `${prefix}measured_at DESC NULLS LAST, ${prefix}created_at DESC, ${prefix}id DESC`;
}

function measurementsAreEqual(
  left: NormalizedMeasurementSnapshot,
  right: NormalizedMeasurementSnapshot,
) {
  return (
    left.heightCm === right.heightCm &&
    left.weightKg === right.weightKg &&
    left.waistCm === right.waistCm &&
    left.chestCm === right.chestCm &&
    left.hipCm === right.hipCm &&
    left.armCm === right.armCm &&
    left.thighCm === right.thighCm &&
    left.bodyFatPercentage === right.bodyFatPercentage
  );
}

function profileFieldsAreEqual(
  existing: ExistingProfileSnapshotRow | undefined,
  input: SaveClientProfileInput,
) {
  if (!existing) {
    return false;
  }

  return (
    existing.full_name.trim() === input.fullName.trim() &&
    String(existing.age) === String(Number(input.age)) &&
    existing.gender === input.gender
  );
}

function mapSnapshotRow(row?: SnapshotRow): ClientOnboardingSnapshot {
  if (!row) {
    return {
      profile: emptyProfile(),
      selectedBodyGoalId: "",
      selectedBodyGoal: null,
      preferences: emptyPreferences(),
      onboardingCompleted: false,
      preferredLanguage: "my",
    };
  }

  const medicalConditionIds = normalizeMedicalConditions(row.medical_conditions);
  const otherHealthConditionText =
    normalizeOtherHealthCondition(medicalConditionIds, row.other_health_condition) ?? "";

  return {
    profile: {
      fullName: row.full_name ?? "",
      age: row.age === null ? "" : String(row.age),
      gender: row.gender ?? "",
      measurements: {
        heightCm: formatMeasurementForForm(row.height_cm),
        weightKg: formatMeasurementForForm(row.weight_kg),
        waistCm: formatMeasurementForForm(row.waist_cm),
        chestCm: formatMeasurementForForm(row.chest_cm),
        hipCm: formatMeasurementForForm(row.hip_cm),
        armCm: formatMeasurementForForm(row.arm_cm),
        thighCm: formatMeasurementForForm(row.thigh_cm),
        bodyFatPercentage: formatMeasurementForForm(row.body_fat_percent),
      },
    },
    selectedBodyGoalId:
      row.selected_body_goal_id === null ? "" : String(row.selected_body_goal_id),
    selectedBodyGoal:
      row.selected_body_goal_id === null ||
      row.goal_label === null ||
      row.goal_description === null
        ? null
        : {
            id: String(row.selected_body_goal_id),
            label: row.goal_label,
            description: row.goal_description,
          },
    preferences: {
      medicalConditionIds,
      otherHealthConditionText,
      exerciseDislikeChoice:
        row.disliked_exercises && row.disliked_exercises.length > 0 ? "yes" : "none",
      dislikedExercises: joinArray(row.disliked_exercises),
      foodAllergyChoice:
        row.food_allergies && row.food_allergies.length > 0 ? "yes" : "none",
      foodAllergies: joinArray(row.food_allergies),
      foodRestrictionChoice:
        row.food_restrictions && row.food_restrictions.length > 0 ? "yes" : "no",
      foodRestrictions: joinArray(row.food_restrictions),
      dislikedFoodChoice:
        row.disliked_foods && row.disliked_foods.length > 0 ? "yes" : "no",
      dislikedFoods: joinArray(row.disliked_foods),
    },
    onboardingCompleted: row.onboarding_completed ?? false,
    preferredLanguage: row.preferred_language ?? "my",
  };
}

function mapProfilePageRow(row?: ProfilePageRow): ClientProfilePageData {
  return {
    basicProfile: {
      fullName: row?.full_name ?? "",
      gender: row?.gender ?? "",
      dateOfBirth: row?.date_of_birth ?? "",
      currentAge: resolveCurrentAge({
        dateOfBirth: row?.date_of_birth,
        legacyAge: row?.age,
      }),
      usesLegacyAgeFallback: !row?.date_of_birth && row?.age !== null,
    },
    measurements: {
      heightCm: formatMeasurementForForm(row?.height_cm),
      weightKg: formatMeasurementForForm(row?.weight_kg),
      waistCm: formatMeasurementForForm(row?.waist_cm),
      chestCm: formatMeasurementForForm(row?.chest_cm),
      hipCm: formatMeasurementForForm(row?.hip_cm),
      armCm: formatMeasurementForForm(row?.arm_cm),
      thighCm: formatMeasurementForForm(row?.thigh_cm),
      bodyFatPercentage: formatMeasurementForForm(row?.body_fat_percent),
    },
  };
}

async function upsertClientProfile(
  client: PoolClient,
  userId: string,
  input: SaveClientProfileInput,
) {
  await client.query(
    `
      INSERT INTO client_profiles (
        user_id,
        full_name,
        age,
        gender
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender
    `,
    [userId, input.fullName, Number(input.age), input.gender],
  );
}

async function getExistingProfileSnapshot(client: PoolClient, userId: string) {
  const result = await client.query<ExistingProfileSnapshotRow>(
    `
      SELECT full_name, age, gender
      FROM client_profiles
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0];
}

async function lockAuthenticatedUser(client: PoolClient, userId: string) {
  await client.query(
    `
      SELECT id
      FROM auth_users
      WHERE id = $1
      FOR UPDATE
    `,
    [userId],
  );
}

async function getLatestMeasurementSnapshot(client: PoolClient, userId: string) {
  const result = await client.query<ExistingMeasurementRow>(
    `
      SELECT
        height_cm,
        weight_kg,
        waist_cm,
        chest_cm,
        hip_cm,
        arm_cm,
        thigh_cm,
        body_fat_percent
      FROM body_measurements
      WHERE user_id = $1
      ORDER BY ${latestMeasurementOrderBy()}
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0];
}

async function insertBodyMeasurement(
  client: PoolClient,
  userId: string,
  measurements: ClientProfileDraft["measurements"],
) {
  await client.query(
    `
      INSERT INTO body_measurements (
        user_id,
        height_cm,
        weight_kg,
        waist_cm,
        chest_cm,
        hip_cm,
        arm_cm,
        thigh_cm,
        body_fat_percent,
        measured_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
    `,
    [
      userId,
      Number(measurements.heightCm),
      Number(measurements.weightKg),
      Number(measurements.waistCm),
      Number(measurements.chestCm),
      Number(measurements.hipCm),
      Number(measurements.armCm),
      Number(measurements.thighCm),
      measurements.bodyFatPercentage.trim()
        ? Number(measurements.bodyFatPercentage)
        : null,
    ],
  );
}

export async function getClientOnboardingSnapshot(
  userId: string,
  executor: QueryExecutor = query,
) {
  const result = await executor<SnapshotRow>(
    `
      SELECT
        cp.full_name,
        cp.age,
        cp.gender,
        cp.selected_body_goal_id,
        cp.onboarding_completed,
        cp.preferred_language,
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
      FROM auth_users AS au
      LEFT JOIN client_profiles AS cp
        ON cp.user_id = au.id
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
        WHERE bm.user_id = au.id
        ORDER BY ${latestMeasurementOrderBy("bm")}
        LIMIT 1
      ) AS latest
        ON TRUE
      LEFT JOIN client_preferences AS pref
        ON pref.user_id = au.id
      WHERE au.id = $1
      LIMIT 1
    `,
    [userId],
  );

  return mapSnapshotRow(result.rows[0]);
}

export async function getClientProfilePageData(
  userId: string,
  executor: QueryExecutor = query,
) {
  const result = await executor<ProfilePageRow>(
    `
      SELECT
        cp.full_name,
        cp.age,
        cp.date_of_birth::text,
        cp.gender,
        latest.height_cm,
        latest.weight_kg,
        latest.waist_cm,
        latest.chest_cm,
        latest.hip_cm,
        latest.arm_cm,
        latest.thigh_cm,
        latest.body_fat_percent
      FROM auth_users AS au
      LEFT JOIN client_profiles AS cp
        ON cp.user_id = au.id
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
        WHERE bm.user_id = au.id
        ORDER BY ${latestMeasurementOrderBy("bm")}
        LIMIT 1
      ) AS latest
        ON TRUE
      WHERE au.id = $1
      LIMIT 1
    `,
    [userId],
  );

  return mapProfilePageRow(result.rows[0]);
}

export async function listActiveClientBodyGoals(gender: GenderValue) {
  const preferredGender =
    gender === "male" || gender === "female" ? gender : "unisex";
  const result = await query<ClientBodyGoalRow>(
    `
      SELECT
        bg.id,
        bg.label,
        bg.description,
        COALESCE(
          MAX(bgi.image_url) FILTER (WHERE bgi.gender = $1),
          MAX(bgi.image_url) FILTER (WHERE bgi.gender = 'unisex')
        ) AS image_url
      FROM body_goals AS bg
      LEFT JOIN body_goal_images AS bgi
        ON bgi.body_goal_id = bg.id
      WHERE bg.status = 'Active'
      GROUP BY bg.id, bg.label, bg.description
      ORDER BY bg.label ASC, bg.id ASC
    `,
    [preferredGender],
  );

  return result.rows.map(mapBodyGoalRow);
}

export async function findActiveClientBodyGoalById(id: number) {
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

export async function hasClientProfile(userId: string) {
  const result = await query<ExistingProfileRow>(
    `
      SELECT id
      FROM client_profiles
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  return Boolean(result.rows[0]);
}

export async function saveClientProfileAndMeasurement(
  userId: string,
  input: SaveClientProfileInput,
) {
  return withTransaction(async (client) => {
    await lockAuthenticatedUser(client, userId);

    const [existingProfile, latestMeasurement] = await Promise.all([
      getExistingProfileSnapshot(client, userId),
      getLatestMeasurementSnapshot(client, userId),
    ]);

    const normalizedInputMeasurement = normalizeMeasurementInput(input.measurements);
    const normalizedLatestMeasurement = latestMeasurement
      ? normalizeMeasurementRow(latestMeasurement)
      : null;

    const shouldUpdateProfile = !profileFieldsAreEqual(existingProfile, input);
    const shouldInsertMeasurement =
      normalizedLatestMeasurement === null ||
      !measurementsAreEqual(normalizedInputMeasurement, normalizedLatestMeasurement);

    if (shouldUpdateProfile) {
      await upsertClientProfile(client, userId, input);
    }

    if (shouldInsertMeasurement) {
      await insertBodyMeasurement(client, userId, input.measurements);
    }

    return {
      didUpdate: shouldUpdateProfile || shouldInsertMeasurement,
      didInsertMeasurement: shouldInsertMeasurement,
    };
  });
}

export const __testing__ = {
  measurementsAreEqual,
  normalizeMedicalConditions,
  normalizeOtherHealthCondition,
  normalizeDecimal,
  formatMeasurementForForm,
  latestMeasurementOrderBy,
  mapProfilePageRow,
  mapSnapshotRow,
  normalizeMeasurementInput,
  normalizeMeasurementRow,
};

export async function saveClientPreferencesAndGoal(
  userId: string,
  input: SaveClientPreferencesInput,
) {
  await withTransaction(async (client) => {
    const normalizedMedicalConditions = normalizeMedicalConditions(
      input.preferences.medicalConditionIds,
    );
    const normalizedOtherHealthCondition = normalizeOtherHealthCondition(
      normalizedMedicalConditions,
      input.preferences.otherHealthConditionText,
    );

    const profileUpdateResult = await client.query(
      `
        UPDATE client_profiles
        SET
          selected_body_goal_id = $2,
          onboarding_completed = true
        WHERE user_id = $1
      `,
      [userId, Number(input.selectedBodyGoalId)],
    );

    if (profileUpdateResult.rowCount !== 1) {
      throw new Error("CLIENT_PROFILE_NOT_FOUND");
    }

    const preferencesUpsertResult = await client.query(
      `
        INSERT INTO client_preferences (
          user_id,
          medical_conditions,
          other_health_condition,
          disliked_exercises,
          food_allergies,
          food_restrictions,
          disliked_foods
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id)
        DO UPDATE SET
          medical_conditions = EXCLUDED.medical_conditions,
          other_health_condition = EXCLUDED.other_health_condition,
          disliked_exercises = EXCLUDED.disliked_exercises,
          food_allergies = EXCLUDED.food_allergies,
          food_restrictions = EXCLUDED.food_restrictions,
          disliked_foods = EXCLUDED.disliked_foods
      `,
      [
        userId,
        normalizedMedicalConditions,
        normalizedOtherHealthCondition,
        splitTextareaList(input.preferences.dislikedExercises),
        splitTextareaList(input.preferences.foodAllergies),
        splitTextareaList(input.preferences.foodRestrictions),
        splitTextareaList(input.preferences.dislikedFoods),
      ],
    );

    if (preferencesUpsertResult.rowCount !== 1) {
      throw new Error("CLIENT_PREFERENCES_NOT_SAVED");
    }
  });
}
