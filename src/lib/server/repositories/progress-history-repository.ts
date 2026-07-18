import "server-only";

import { buildMeasurementHistoryWithProgress } from "@/lib/measurement-progress";
import { query } from "@/lib/server/db";
import type {
  GeneratedPlanHistoryEntry,
  GeneratedPlanHistoryStatus,
  MeasurementHistoryEntry,
  MeasurementProgressSummary,
} from "@/types/progress-history";

interface MeasurementHistoryRow {
  id: number;
  measured_at: string;
  weight_kg: string | number;
  waist_cm: string | number;
  chest_cm: string | number;
  hip_cm: string | number;
  arm_cm: string | number;
  thigh_cm: string | number;
  body_fat_percent: string | number | null;
}

interface SelectedGoalRow {
  goal_label: string | null;
}

interface GeneratedPlanHistoryRow {
  plan_id: number;
  start_date: string;
  end_date: string;
  body_goal_label: string;
  status: GeneratedPlanHistoryStatus;
  created_at: string;
  completed_workout_count: number;
  total_scheduled_workout_count: number;
}

function toNumber(value: string | number) {
  return Number(value);
}

function toOptionalNumber(value: string | number | null) {
  return value === null ? null : Number(value);
}

function buildMeasurementProgressSummary(
  entries: MeasurementHistoryEntry[],
): MeasurementProgressSummary | null {
  if (entries.length === 0) {
    return null;
  }

  const latest = entries[0];
  const first = entries.at(-1);

  if (!first) {
    return null;
  }

  const firstBodyFat = first.bodyFatPercentage;
  const latestBodyFat = latest.bodyFatPercentage;

  return {
    firstWeightKg: first.weightKg,
    latestWeightKg: latest.weightKg,
    totalWeightChangeKg: Math.round((latest.weightKg - first.weightKg) * 10) / 10,
    firstWaistCm: first.waistCm,
    latestWaistCm: latest.waistCm,
    totalWaistChangeCm: Math.round((latest.waistCm - first.waistCm) * 10) / 10,
    firstBodyFatPercentage: firstBodyFat,
    latestBodyFatPercentage: latestBodyFat,
    totalBodyFatChangePercent:
      firstBodyFat === null || latestBodyFat === null
        ? null
        : Math.round((latestBodyFat - firstBodyFat) * 10) / 10,
    measurementCount: entries.length,
  };
}

export async function getMeasurementHistoryForUser(userId: string): Promise<{
  goalLabel: string | null;
  entries: MeasurementHistoryEntry[];
  summary: MeasurementProgressSummary | null;
}> {
  const [goalResult, measurementResult] = await Promise.all([
    query<SelectedGoalRow>(
      `
        SELECT bg.label AS goal_label
        FROM client_profiles AS cp
        LEFT JOIN body_goals AS bg
          ON bg.id = cp.selected_body_goal_id
        WHERE cp.user_id = $1
        LIMIT 1
      `,
      [userId],
    ),
    query<MeasurementHistoryRow>(
      `
        SELECT
          bm.id,
          bm.measured_at::text,
          bm.weight_kg,
          bm.waist_cm,
          bm.chest_cm,
          bm.hip_cm,
          bm.arm_cm,
          bm.thigh_cm,
          bm.body_fat_percent
        FROM body_measurements AS bm
        WHERE bm.user_id = $1
        ORDER BY bm.measured_at DESC NULLS LAST, bm.created_at DESC, bm.id DESC
      `,
      [userId],
    ),
  ]);

  const entries = buildMeasurementHistoryWithProgress(
    measurementResult.rows.map((row) => ({
      id: row.id,
      measuredAt: row.measured_at,
      weightKg: toNumber(row.weight_kg),
      waistCm: toNumber(row.waist_cm),
      chestCm: toNumber(row.chest_cm),
      hipCm: toNumber(row.hip_cm),
      armCm: toNumber(row.arm_cm),
      thighCm: toNumber(row.thigh_cm),
      bodyFatPercentage: toOptionalNumber(row.body_fat_percent),
    })),
  );

  return {
    goalLabel: goalResult.rows[0]?.goal_label ?? null,
    entries,
    summary: buildMeasurementProgressSummary(entries),
  };
}

export async function listGeneratedPlanHistoryForUser(
  userId: string,
  options?: { includeFailed?: boolean },
): Promise<GeneratedPlanHistoryEntry[]> {
  const includeFailed = options?.includeFailed ?? false;

  const result = await query<GeneratedPlanHistoryRow>(
    `
      SELECT
        gp.id AS plan_id,
        gp.start_date::text,
        gp.end_date::text,
        bg.label AS body_goal_label,
        gp.status,
        gp.created_at::text,
        COUNT(DISTINCT ws.id)
          FILTER (WHERE ws.status = 'completed')::int AS completed_workout_count,
        COUNT(DISTINCT gpd.id)
          FILTER (WHERE gpd.day_type = 'workout')::int AS total_scheduled_workout_count
      FROM generated_plans AS gp
      INNER JOIN body_goals AS bg
        ON bg.id = gp.body_goal_id
      LEFT JOIN generated_plan_days AS gpd
        ON gpd.plan_id = gp.id
      LEFT JOIN workout_sessions AS ws
        ON ws.plan_id = gp.id
       AND ws.plan_day_id = gpd.id
       AND ws.user_id = gp.user_id
      WHERE gp.user_id = $1
        AND ($2::boolean = true OR gp.status <> 'failed')
      GROUP BY gp.id, bg.label
      ORDER BY gp.created_at DESC, gp.id DESC
    `,
    [userId, includeFailed],
  );

  return result.rows.map<GeneratedPlanHistoryEntry>((row) => ({
    planId: row.plan_id,
    startDate: row.start_date,
    endDate: row.end_date,
    bodyGoalLabel: row.body_goal_label,
    status: row.status,
    createdAt: row.created_at,
    completedWorkoutCount: row.completed_workout_count ?? 0,
    totalScheduledWorkoutCount: row.total_scheduled_workout_count ?? 0,
  }));
}

export const __testing__ = {
  buildMeasurementProgressSummary,
};
