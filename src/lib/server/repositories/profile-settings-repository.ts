import "server-only";

import type { PoolClient } from "pg";

import { calculateAgeFromDateOfBirth, resolveCurrentAge } from "@/lib/date-of-birth";
import { query, withTransaction } from "@/lib/server/db";
import type { BodyMeasurementsDraft, GenderValue } from "@/types/client-journey";
import type {
  EditableProfileDraft,
  EditableProfilePageData,
  MeasurementSnapshotPageData,
} from "@/types/profile-settings";

interface ProfilePageRow {
  email: string;
  auth_name: string | null;
  auth_image: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  gender: GenderValue | null;
  avatar_url: string | null;
  age: number | null;
  latest_measured_at: string | null;
}

interface AuthAccountRow {
  provider_id: string;
}

interface ExistingProfileRow {
  full_name: string;
  date_of_birth: string | null;
  gender: GenderValue;
  age: number;
  avatar_url: string | null;
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
  measured_at: string;
}

function getUploadStorageConfigured() {
  return false;
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

function formatMeasurementForForm(value: string | number | null | undefined) {
  return normalizeDecimal(value) ?? "";
}

function normalizeMeasurementInput(
  measurements: BodyMeasurementsDraft,
) {
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

function normalizeMeasurementRow(row: ExistingMeasurementRow) {
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

function measurementsAreEqual(
  left: ReturnType<typeof normalizeMeasurementInput>,
  right: ReturnType<typeof normalizeMeasurementRow>,
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

function latestMeasurementOrderBy(alias?: string) {
  const prefix = alias ? `${alias}.` : "";

  return `${prefix}measured_at DESC NULLS LAST, ${prefix}created_at DESC, ${prefix}id DESC`;
}

function mapProfilePageRow(
  row: ProfilePageRow,
  providerIds: string[],
): EditableProfilePageData {
  const profile: EditableProfileDraft = {
    fullName: row.full_name?.trim() || row.auth_name?.trim() || "",
    email: row.email,
    dateOfBirth: row.date_of_birth ?? "",
    gender: row.gender ?? "",
  };

  return {
    profile,
    avatarUrl: row.avatar_url,
    providerImageUrl: row.auth_image,
    currentAge: resolveCurrentAge({
      dateOfBirth: row.date_of_birth,
      legacyAge: row.age,
    }),
    hasCredentialAccount: providerIds.includes("credential"),
    latestMeasurementRecordedAt: row.latest_measured_at,
    uploadStorageConfigured: getUploadStorageConfigured(),
  };
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

async function getExistingProfileForUpdate(client: PoolClient, userId: string) {
  const result = await client.query<ExistingProfileRow>(
    `
      SELECT
        full_name,
        date_of_birth::text,
        gender,
        age,
        avatar_url
      FROM client_profiles
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}

async function getLatestMeasurementRow(client: PoolClient, userId: string) {
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
        body_fat_percent,
        measured_at::text
      FROM body_measurements
      WHERE user_id = $1
      ORDER BY ${latestMeasurementOrderBy()}
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function getSettingsAccountStateForUser(userId: string) {
  const result = await query<AuthAccountRow>(
    `
      SELECT provider_id
      FROM auth_accounts
      WHERE user_id = $1
      ORDER BY provider_id ASC, id ASC
    `,
    [userId],
  );

  const providerIds = result.rows.map((row) => row.provider_id);

  return {
    hasCredentialAccount: providerIds.includes("credential"),
    providerIds,
  };
}

export async function getEditableProfileForUser(userId: string): Promise<EditableProfilePageData | null> {
  const [profileResult, accountResult] = await Promise.all([
    query<ProfilePageRow>(
      `
        SELECT
          au.email,
          au.name AS auth_name,
          au.image AS auth_image,
          cp.full_name,
          cp.date_of_birth::text,
          cp.gender,
          cp.avatar_url,
          cp.age,
          latest.measured_at::text AS latest_measured_at
        FROM auth_users AS au
        LEFT JOIN client_profiles AS cp
          ON cp.user_id = au.id
        LEFT JOIN LATERAL (
          SELECT bm.measured_at
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
    ),
    getSettingsAccountStateForUser(userId),
  ]);

  const row = profileResult.rows[0];

  if (!row) {
    return null;
  }

  return mapProfilePageRow(row, accountResult.providerIds);
}

export async function saveEditableProfileForUser(
  userId: string,
  input: EditableProfileDraft,
) {
  return withTransaction(async (client) => {
    await lockAuthenticatedUser(client, userId);

    const existingProfile = await getExistingProfileForUpdate(client, userId);
    const normalizedDateOfBirth = input.dateOfBirth.trim() || null;
    const nextAge = normalizedDateOfBirth
      ? calculateAgeFromDateOfBirth(normalizedDateOfBirth)
      : existingProfile?.age ?? null;

    if (normalizedDateOfBirth && nextAge === null) {
      throw new Error("INVALID_DATE_OF_BIRTH");
    }

    if (nextAge === null) {
      throw new Error("DATE_OF_BIRTH_REQUIRED");
    }

    const didUpdate =
      !existingProfile ||
      existingProfile.full_name.trim() !== input.fullName.trim() ||
      (existingProfile.date_of_birth ?? null) !== normalizedDateOfBirth ||
      existingProfile.gender !== input.gender ||
      existingProfile.age !== nextAge;

    if (!didUpdate) {
      return { didUpdate: false };
    }

    await client.query(
      `
        INSERT INTO client_profiles (
          user_id,
          full_name,
          age,
          date_of_birth,
          gender,
          avatar_url
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id)
        DO UPDATE SET
          full_name = EXCLUDED.full_name,
          age = EXCLUDED.age,
          date_of_birth = EXCLUDED.date_of_birth,
          gender = EXCLUDED.gender
      `,
      [
        userId,
        input.fullName.trim(),
        nextAge,
        normalizedDateOfBirth,
        input.gender,
        existingProfile?.avatar_url ?? null,
      ],
    );

    return { didUpdate: true };
  });
}

export async function getLatestMeasurementSnapshotForUser(
  userId: string,
): Promise<MeasurementSnapshotPageData> {
  const result = await query<ExistingMeasurementRow>(
    `
      SELECT
        height_cm,
        weight_kg,
        waist_cm,
        chest_cm,
        hip_cm,
        arm_cm,
        thigh_cm,
        body_fat_percent,
        measured_at::text
      FROM body_measurements
      WHERE user_id = $1
      ORDER BY ${latestMeasurementOrderBy()}
      LIMIT 1
    `,
    [userId],
  );

  const row = result.rows[0];

  return {
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
    latestMeasuredAt: row?.measured_at ?? null,
  };
}

export async function saveMeasurementSnapshotForUser(
  userId: string,
  measurements: BodyMeasurementsDraft,
) {
  return withTransaction(async (client) => {
    await lockAuthenticatedUser(client, userId);

    const latestMeasurement = await getLatestMeasurementRow(client, userId);
    const normalizedInput = normalizeMeasurementInput(measurements);
    const normalizedLatest = latestMeasurement ? normalizeMeasurementRow(latestMeasurement) : null;
    const shouldInsert =
      normalizedLatest === null || !measurementsAreEqual(normalizedInput, normalizedLatest);

    if (!shouldInsert) {
      return { didInsertMeasurement: false };
    }

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

    return { didInsertMeasurement: true };
  });
}

export const __testing__ = {
  formatMeasurementForForm,
  latestMeasurementOrderBy,
  measurementsAreEqual,
  normalizeMeasurementInput,
  normalizeMeasurementRow,
};
