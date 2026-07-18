import "server-only";

import { resolveCurrentAge } from "@/lib/date-of-birth";
import { createAssessmentInputHash } from "@/lib/server/ai-assessment";
import { requireAdminUser } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import type {
  AdminClientAssessmentStatus,
  AdminClientDetailData,
  AdminClientListFilters,
  AdminClientListItem,
  AdminClientListResult,
  AdminClientPlanViewData,
  AdminClientPlanStatus,
  AdminClientStatusSummary,
} from "@/types/admin-clients";
import type { ClientAssessmentInput } from "@/types/client-onboarding";

const nonAdminRoleSql = "COALESCE(au.role, '') !~* '(^|\\s*,\\s*)admin(\\s*,\\s*|$)'";

interface AdminClientBaseRow {
  user_id: string;
  account_name: string;
  email: string;
  role: string | null;
  image: string | null;
  joined_at: string;
  full_name: string | null;
  date_of_birth: string | null;
  age: number | null;
  gender: string | null;
  selected_body_goal_id: number | null;
  body_goal_label: string | null;
  onboarding_completed: boolean | null;
  height_cm: string | number | null;
  weight_kg: string | number | null;
  waist_cm: string | number | null;
  chest_cm: string | number | null;
  hip_cm: string | number | null;
  arm_cm: string | number | null;
  thigh_cm: string | number | null;
  body_fat_percent: string | number | null;
  latest_measurement_at: string | null;
  medical_conditions: string[] | null;
  other_health_condition: string | null;
  disliked_exercises: string[] | null;
  food_allergies: string[] | null;
  food_restrictions: string[] | null;
  disliked_foods: string[] | null;
  latest_assessment_input_hash: string | null;
  latest_assessment_created_at: string | null;
  active_plan_id: number | null;
  active_plan_source_input_hash: string | null;
  active_plan_start_date: string | null;
  active_plan_end_date: string | null;
}

interface BodyGoalFilterRow {
  id: number;
  label: string;
}

function stringifyNumber(value: string | number | null) {
  return value === null ? null : String(value);
}

function buildAssessmentInput(row: AdminClientBaseRow): ClientAssessmentInput {
  return {
    age: resolveCurrentAge({
      dateOfBirth: row.date_of_birth,
      legacyAge: row.age,
    }),
    gender: row.gender,
    measurements: {
      heightCm: stringifyNumber(row.height_cm),
      weightKg: stringifyNumber(row.weight_kg),
      waistCm: stringifyNumber(row.waist_cm),
      chestCm: stringifyNumber(row.chest_cm),
      hipCm: stringifyNumber(row.hip_cm),
      armCm: stringifyNumber(row.arm_cm),
      thighCm: stringifyNumber(row.thigh_cm),
      bodyFatPercent: stringifyNumber(row.body_fat_percent),
    },
    bodyGoal: {
      id: row.selected_body_goal_id,
      label: row.body_goal_label,
      description: null,
    },
    medicalConditions: row.medical_conditions ?? [],
    otherHealthCondition: row.other_health_condition,
    dislikedExercises: row.disliked_exercises ?? [],
    foodAllergies: row.food_allergies ?? [],
    foodRestrictions: row.food_restrictions ?? [],
    dislikedFoods: row.disliked_foods ?? [],
  };
}

function resolveStatusSummary(row: AdminClientBaseRow): AdminClientStatusSummary {
  const currentInputHash = createAssessmentInputHash(buildAssessmentInput(row)).inputHash;
  const onboarding: AdminClientStatusSummary["onboarding"] = row.onboarding_completed
    ? "Complete"
    : "Incomplete";

  const assessment: AdminClientAssessmentStatus = row.latest_assessment_input_hash
    ? row.latest_assessment_input_hash === currentInputHash
      ? "Current"
      : "Outdated"
    : "Not Generated";

  const plan: AdminClientPlanStatus = row.active_plan_source_input_hash
    ? row.active_plan_source_input_hash === currentInputHash
      ? "Active"
      : "Outdated"
    : "No Plan";

  return { onboarding, assessment, plan };
}

function matchesAssessmentFilter(
  status: AdminClientAssessmentStatus,
  filter: AdminClientListFilters["assessment"],
) {
  if (filter === "all") {
    return true;
  }

  if (filter === "current") {
    return status === "Current";
  }

  if (filter === "outdated") {
    return status === "Outdated";
  }

  return status === "Not Generated";
}

function matchesPlanFilter(
  status: AdminClientPlanStatus,
  filter: AdminClientListFilters["plan"],
) {
  if (filter === "all") {
    return true;
  }

  if (filter === "active") {
    return status === "Active";
  }

  if (filter === "outdated") {
    return status === "Outdated";
  }

  return status === "No Plan";
}

function mapClientListItem(row: AdminClientBaseRow): AdminClientListItem {
  return {
    userId: row.user_id,
    fullName: row.full_name ?? row.account_name,
    email: row.email,
    gender: row.gender,
    age: resolveCurrentAge({
      dateOfBirth: row.date_of_birth,
      legacyAge: row.age,
    }),
    bodyGoal: row.body_goal_label,
    statuses: resolveStatusSummary(row),
    latestMeasurementAt: row.latest_measurement_at,
    joinedAt: row.joined_at,
    profileImageUrl: row.image,
  };
}

function normalizeListPageFilters(
  input: Partial<Record<string, string | string[] | undefined>>,
): AdminClientListFilters {
  const pick = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] ?? "" : value ?? "";
  const rawPage = Number(pick(input.page));

  return {
    query: pick(input.q).trim(),
    onboarding:
      pick(input.onboarding) === "complete" || pick(input.onboarding) === "incomplete"
        ? (pick(input.onboarding) as AdminClientListFilters["onboarding"])
        : "all",
    bodyGoalId: pick(input.bodyGoalId),
    assessment:
      pick(input.assessment) === "current" ||
      pick(input.assessment) === "outdated" ||
      pick(input.assessment) === "not_generated"
        ? (pick(input.assessment) as AdminClientListFilters["assessment"])
        : "all",
    plan:
      pick(input.plan) === "active" ||
      pick(input.plan) === "outdated" ||
      pick(input.plan) === "no_plan"
        ? (pick(input.plan) as AdminClientListFilters["plan"])
        : "all",
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
    pageSize: 12,
  };
}

async function listBodyGoalFilters() {
  const result = await query<BodyGoalFilterRow>(
    `
      SELECT id, label
      FROM body_goals
      ORDER BY label ASC, id ASC
    `,
  );

  return result.rows.map((row) => ({
    id: String(row.id),
    label: row.label,
  }));
}

async function listClientBaseRows(filters: AdminClientListFilters) {
  const params: Array<number | string | null> = [];
  let parameterIndex = 1;
  const whereClauses = [nonAdminRoleSql];

  if (filters.query) {
    params.push(`%${filters.query}%`);
    whereClauses.push(
      `(COALESCE(cp.full_name, au.name) ILIKE $${parameterIndex} OR au.email ILIKE $${parameterIndex})`,
    );
    parameterIndex += 1;
  }

  if (filters.onboarding === "complete") {
    whereClauses.push("COALESCE(cp.onboarding_completed, false) = true");
  }

  if (filters.onboarding === "incomplete") {
    whereClauses.push("COALESCE(cp.onboarding_completed, false) = false");
  }

  if (filters.bodyGoalId) {
    params.push(Number(filters.bodyGoalId));
    whereClauses.push(`cp.selected_body_goal_id = $${parameterIndex}`);
    parameterIndex += 1;
  }

  const result = await query<AdminClientBaseRow>(
    `
      SELECT
        au.id AS user_id,
        au.name AS account_name,
        au.email,
        au.role,
        au.image,
        au.created_at::text AS joined_at,
        cp.full_name,
        cp.date_of_birth::text,
        cp.age,
        cp.gender,
        cp.selected_body_goal_id,
        bg.label AS body_goal_label,
        cp.onboarding_completed,
        latest.height_cm,
        latest.weight_kg,
        latest.waist_cm,
        latest.chest_cm,
        latest.hip_cm,
        latest.arm_cm,
        latest.thigh_cm,
        latest.body_fat_percent,
        latest.latest_measurement_at,
        pref.medical_conditions,
        pref.other_health_condition,
        pref.disliked_exercises,
        pref.food_allergies,
        pref.food_restrictions,
        pref.disliked_foods,
        latest_assessment.input_hash AS latest_assessment_input_hash,
        latest_assessment.created_at::text AS latest_assessment_created_at,
        active_plan.id AS active_plan_id,
        active_plan.source_input_hash AS active_plan_source_input_hash,
        active_plan.start_date::text AS active_plan_start_date,
        active_plan.end_date::text AS active_plan_end_date
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
          bm.body_fat_percent,
          bm.measured_at::text AS latest_measurement_at
        FROM body_measurements AS bm
        WHERE bm.user_id = au.id
        ORDER BY bm.measured_at DESC, bm.id DESC
        LIMIT 1
      ) AS latest
        ON TRUE
      LEFT JOIN client_preferences AS pref
        ON pref.user_id = au.id
      LEFT JOIN LATERAL (
        SELECT
          aa.input_hash,
          aa.created_at
        FROM ai_assessments AS aa
        WHERE aa.user_id = au.id
        ORDER BY aa.created_at DESC, aa.id DESC
        LIMIT 1
      ) AS latest_assessment
        ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          gp.id,
          gp.source_input_hash,
          gp.start_date,
          gp.end_date
        FROM generated_plans AS gp
        WHERE gp.user_id = au.id
          AND gp.status = 'active'
        ORDER BY gp.created_at DESC, gp.id DESC
        LIMIT 1
      ) AS active_plan
        ON TRUE
      WHERE ${whereClauses.join("\n        AND ")}
      ORDER BY au.created_at DESC, au.id DESC
    `,
    params,
  );

  return result.rows;
}

export async function getAdminClientList(
  input: Partial<Record<string, string | string[] | undefined>>,
): Promise<AdminClientListResult> {
  await requireAdminUser();

  const filters = normalizeListPageFilters(input);
  const [rows, availableBodyGoals] = await Promise.all([
    listClientBaseRows(filters),
    listBodyGoalFilters(),
  ]);

  const matchedItems = rows
    .map(mapClientListItem)
    .filter((item) => matchesAssessmentFilter(item.statuses.assessment, filters.assessment))
    .filter((item) => matchesPlanFilter(item.statuses.plan, filters.plan));

  const totalCount = matchedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize));
  const currentPage = Math.min(filters.page, totalPages);
  const startIndex = (currentPage - 1) * filters.pageSize;

  return {
    items: matchedItems.slice(startIndex, startIndex + filters.pageSize),
    totalCount,
    totalPages,
    currentPage,
    availableBodyGoals,
    filters: {
      ...filters,
      page: currentPage,
    },
  };
}

export async function getAdminClientDetail(userId: string): Promise<AdminClientDetailData | null> {
  await requireAdminUser();

  const result = await query<AdminClientBaseRow>(
    `
      SELECT
        au.id AS user_id,
        au.name AS account_name,
        au.email,
        au.role,
        au.image,
        au.created_at::text AS joined_at,
        cp.full_name,
        cp.date_of_birth::text,
        cp.age,
        cp.gender,
        cp.selected_body_goal_id,
        bg.label AS body_goal_label,
        cp.onboarding_completed,
        latest.height_cm,
        latest.weight_kg,
        latest.waist_cm,
        latest.chest_cm,
        latest.hip_cm,
        latest.arm_cm,
        latest.thigh_cm,
        latest.body_fat_percent,
        latest.latest_measurement_at,
        pref.medical_conditions,
        pref.other_health_condition,
        pref.disliked_exercises,
        pref.food_allergies,
        pref.food_restrictions,
        pref.disliked_foods,
        latest_assessment.input_hash AS latest_assessment_input_hash,
        latest_assessment.created_at::text AS latest_assessment_created_at,
        active_plan.id AS active_plan_id,
        active_plan.source_input_hash AS active_plan_source_input_hash,
        active_plan.start_date::text AS active_plan_start_date,
        active_plan.end_date::text AS active_plan_end_date
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
          bm.body_fat_percent,
          bm.measured_at::text AS latest_measurement_at
        FROM body_measurements AS bm
        WHERE bm.user_id = au.id
        ORDER BY bm.measured_at DESC, bm.id DESC
        LIMIT 1
      ) AS latest
        ON TRUE
      LEFT JOIN client_preferences AS pref
        ON pref.user_id = au.id
      LEFT JOIN LATERAL (
        SELECT
          aa.input_hash,
          aa.created_at
        FROM ai_assessments AS aa
        WHERE aa.user_id = au.id
        ORDER BY aa.created_at DESC, aa.id DESC
        LIMIT 1
      ) AS latest_assessment
        ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          gp.id,
          gp.source_input_hash,
          gp.start_date,
          gp.end_date
        FROM generated_plans AS gp
        WHERE gp.user_id = au.id
          AND gp.status = 'active'
        ORDER BY gp.created_at DESC, gp.id DESC
        LIMIT 1
      ) AS active_plan
        ON TRUE
      WHERE au.id = $1
        AND ${nonAdminRoleSql}
      LIMIT 1
    `,
    [userId],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  const statusSummary = resolveStatusSummary(row);
  const historyResult = await query<{
    measured_at: string;
    weight_kg: string | number;
    waist_cm: string | number;
    body_fat_percent: string | number | null;
  }>(
    `
      SELECT
        measured_at::text,
        weight_kg,
        waist_cm,
        body_fat_percent
      FROM body_measurements
      WHERE user_id = $1
      ORDER BY measured_at DESC, id DESC
    `,
    [userId],
  );

  const workoutProgressResult = await query<{
    completed_count: number;
    skipped_count: number;
    in_progress_count: number;
    planned_days_count: number;
  }>(
    `
      WITH active_plan AS (
        SELECT id
        FROM generated_plans
        WHERE user_id = $1
          AND status = 'active'
        LIMIT 1
      )
      SELECT
        COUNT(*) FILTER (WHERE ws.status = 'completed')::int AS completed_count,
        COUNT(*) FILTER (WHERE ws.status = 'skipped')::int AS skipped_count,
        COUNT(*) FILTER (WHERE ws.status = 'in_progress')::int AS in_progress_count,
        (
          SELECT COUNT(*)::int
          FROM generated_plan_days AS gpd
          WHERE gpd.plan_id = (SELECT id FROM active_plan)
        ) AS planned_days_count
      FROM active_plan
      LEFT JOIN workout_sessions AS ws
        ON ws.plan_id = active_plan.id
    `,
    [userId],
  );

  const workoutProgress = workoutProgressResult.rows[0] ?? {
    completed_count: 0,
    skipped_count: 0,
    in_progress_count: 0,
    planned_days_count: 0,
  };

  const completedOrSkipped = workoutProgress.completed_count + workoutProgress.skipped_count;

  return {
    userId: row.user_id,
    fullName: row.full_name ?? row.account_name,
    email: row.email,
    gender: row.gender,
    age: resolveCurrentAge({
      dateOfBirth: row.date_of_birth,
      legacyAge: row.age,
    }),
    joinedAt: row.joined_at,
    profileImageUrl: row.image,
    bodyGoal: row.body_goal_label,
    onboardingCompleted: Boolean(row.onboarding_completed),
    latestMeasurementAt: row.latest_measurement_at,
    latestMeasurements: {
      heightCm: stringifyNumber(row.height_cm),
      weightKg: stringifyNumber(row.weight_kg),
      waistCm: stringifyNumber(row.waist_cm),
      chestCm: stringifyNumber(row.chest_cm),
      hipCm: stringifyNumber(row.hip_cm),
      armCm: stringifyNumber(row.arm_cm),
      thighCm: stringifyNumber(row.thigh_cm),
      bodyFatPercent: stringifyNumber(row.body_fat_percent),
    },
    preferences: {
      medicalConditions: row.medical_conditions ?? [],
      otherHealthCondition: row.other_health_condition,
      dislikedExercises: row.disliked_exercises ?? [],
      foodAllergies: row.food_allergies ?? [],
      foodRestrictions: row.food_restrictions ?? [],
      dislikedFoods: row.disliked_foods ?? [],
    },
    aiAssessment: {
      status: statusSummary.assessment,
      generatedAt: row.latest_assessment_created_at,
    },
    currentPlan: {
      status: statusSummary.plan,
      startDate: row.active_plan_start_date,
      endDate: row.active_plan_end_date,
      planId: row.active_plan_id,
    },
    workoutProgress: {
      completed: workoutProgress.completed_count,
      skipped: workoutProgress.skipped_count,
      inProgress: workoutProgress.in_progress_count,
      completionPercentage:
        workoutProgress.planned_days_count > 0
          ? Math.round((completedOrSkipped / workoutProgress.planned_days_count) * 100)
          : null,
    },
    measurementHistory: historyResult.rows.map((historyRow) => ({
      measuredAt: historyRow.measured_at,
      weightKg: String(historyRow.weight_kg),
      waistCm: String(historyRow.waist_cm),
      bodyFatPercent:
        historyRow.body_fat_percent === null ? null : String(historyRow.body_fat_percent),
    })),
  };
}

export async function getAdminClientPlanView(
  userId: string,
  planId: number,
): Promise<AdminClientPlanViewData | null> {
  await requireAdminUser();

  const summaryResult = await query<{
    client_user_id: string;
    plan_id: number;
    status: string;
    body_goal: string;
    workout_template: string;
    nutrition_template: string;
    start_date: string;
    end_date: string;
    created_at: string;
    source_input_hash: string;
  }>(
    `
      SELECT
        gp.user_id AS client_user_id,
        gp.id AS plan_id,
        gp.status,
        bg.label AS body_goal,
        wt.name AS workout_template,
        nt.name AS nutrition_template,
        gp.start_date::text,
        gp.end_date::text,
        gp.created_at::text,
        gp.source_input_hash
      FROM generated_plans AS gp
      INNER JOIN body_goals AS bg
        ON bg.id = gp.body_goal_id
      INNER JOIN workout_templates AS wt
        ON wt.id = gp.workout_template_id
      INNER JOIN nutrition_templates AS nt
        ON nt.id = gp.nutrition_template_id
      WHERE gp.user_id = $1
        AND gp.id = $2
      LIMIT 1
    `,
    [userId, planId],
  );

  const summary = summaryResult.rows[0];

  if (!summary) {
    return null;
  }

  const [daysResult, progressResult] = await Promise.all([
    query<{
      plan_date: string;
      week_number: number;
      day_number: number;
      day_type: string;
      focus_category: string | null;
      estimated_duration_minutes: number | null;
      exercise_count: number;
      meal_item_count: number;
    }>(
      `
        SELECT
          gpd.plan_date::text,
          gpd.week_number,
          gpd.day_number,
          gpd.day_type,
          gpd.focus_category,
          gpd.estimated_duration_minutes,
          COUNT(DISTINCT gpe.id)::int AS exercise_count,
          COUNT(DISTINCT gpmi.id)::int AS meal_item_count
        FROM generated_plan_days AS gpd
        LEFT JOIN generated_plan_exercises AS gpe
          ON gpe.plan_day_id = gpd.id
        LEFT JOIN generated_plan_meal_items AS gpmi
          ON gpmi.plan_day_id = gpd.id
        WHERE gpd.plan_id = $1
        GROUP BY gpd.id
        ORDER BY gpd.plan_date ASC, gpd.id ASC
      `,
      [planId],
    ),
    query<{
      completed_count: number;
      skipped_count: number;
      in_progress_count: number;
    }>(
      `
        SELECT
          COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_count,
          COUNT(*) FILTER (WHERE status = 'skipped')::int AS skipped_count,
          COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress_count
        FROM workout_sessions
        WHERE user_id = $1
          AND plan_id = $2
      `,
      [userId, planId],
    ),
  ]);

  const progress = progressResult.rows[0] ?? {
    completed_count: 0,
    skipped_count: 0,
    in_progress_count: 0,
  };

  return {
    clientUserId: summary.client_user_id,
    planId: summary.plan_id,
    status: summary.status,
    bodyGoal: summary.body_goal,
    workoutTemplate: summary.workout_template,
    nutritionTemplate: summary.nutrition_template,
    startDate: summary.start_date,
    endDate: summary.end_date,
    createdAt: summary.created_at,
    sourceInputHash: summary.source_input_hash,
    days: daysResult.rows.map((row) => ({
      planDate: row.plan_date,
      weekNumber: row.week_number,
      dayNumber: row.day_number,
      dayType: row.day_type,
      focusCategory: row.focus_category,
      estimatedDurationMinutes: row.estimated_duration_minutes,
      exerciseCount: row.exercise_count,
      mealItemCount: row.meal_item_count,
    })),
    workoutProgress: {
      completed: progress.completed_count,
      skipped: progress.skipped_count,
      inProgress: progress.in_progress_count,
    },
  };
}
