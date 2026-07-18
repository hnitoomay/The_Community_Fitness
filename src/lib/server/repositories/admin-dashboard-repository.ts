import "server-only";

import { resolveCurrentAge } from "@/lib/date-of-birth";
import { createAssessmentInputHash } from "@/lib/server/ai-assessment";
import { requireAdminUser } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import type {
  AdminDashboardActivityItem,
  AdminDashboardData,
  AdminDashboardMetric,
  AdminDashboardReferenceItem,
  AdminRecentClientItem,
} from "@/types/admin-clients";
import { getAdminClientList } from "@/lib/server/repositories/admin-client-repository";
import type { ClientAssessmentInput } from "@/types/client-onboarding";

interface DashboardCountsRow {
  total_clients: number;
  onboarding_completed: number;
  active_plans: number;
  workouts_completed_this_week: number;
  available_equipment: number;
  total_equipment: number;
  active_exercises: number;
  failed_plan_generations: number;
  measurement_updates_this_month: number;
  workout_templates: number;
  foods: number;
  nutrition_templates: number;
  body_goals: number;
}

interface ActivityCountRow {
  active_plans: number;
  plans_generated_this_month: number;
  failed_generation_attempts_this_month: number;
  completed_workouts_this_week: number;
  skipped_workouts_this_week: number;
}

interface OutdatedActivePlanRow {
  user_id: string;
  date_of_birth: string | null;
  age: number | null;
  gender: string | null;
  selected_body_goal_id: number | null;
  body_goal_label: string | null;
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
  source_input_hash: string;
}

function stringifyNumber(value: string | number | null) {
  return value === null ? null : String(value);
}

function buildAssessmentInput(row: OutdatedActivePlanRow): ClientAssessmentInput {
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

async function countOutdatedActivePlans() {
  const result = await query<OutdatedActivePlanRow>(
    `
      SELECT
        gp.user_id,
        cp.date_of_birth::text,
        cp.age,
        cp.gender,
        cp.selected_body_goal_id,
        bg.label AS body_goal_label,
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
        pref.disliked_foods,
        gp.source_input_hash
      FROM generated_plans AS gp
      INNER JOIN client_profiles AS cp
        ON cp.user_id = gp.user_id
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
        WHERE bm.user_id = gp.user_id
        ORDER BY bm.measured_at DESC, bm.id DESC
        LIMIT 1
      ) AS latest
        ON TRUE
      LEFT JOIN client_preferences AS pref
        ON pref.user_id = gp.user_id
      WHERE gp.status = 'active'
    `,
  );

  return result.rows.filter((row) => {
    const currentInputHash = createAssessmentInputHash(buildAssessmentInput(row)).inputHash;
    return currentInputHash !== row.source_input_hash;
  }).length;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requireAdminUser();

  const [countsResult, recentClientResult, activityResult, outdatedActivePlansCount] =
    await Promise.all([
      query<DashboardCountsRow>(
        `
          WITH yangon_now AS (
            SELECT timezone('Asia/Yangon', now()) AS local_now
          )
          SELECT
            (
              SELECT COUNT(*)::int
              FROM auth_users AS au
              WHERE COALESCE(au.role, '') !~* '(^|\\s*,\\s*)admin(\\s*,\\s*|$)'
            ) AS total_clients,
            (
              SELECT COUNT(*)::int
              FROM client_profiles
              WHERE onboarding_completed = true
            ) AS onboarding_completed,
            (
              SELECT COUNT(*)::int
              FROM generated_plans
              WHERE status = 'active'
            ) AS active_plans,
            (
              SELECT COUNT(*)::int
              FROM workout_sessions, yangon_now
              WHERE status = 'completed'
                AND timezone('Asia/Yangon', completed_at) >= date_trunc('week', yangon_now.local_now)
                AND timezone('Asia/Yangon', completed_at) < date_trunc('week', yangon_now.local_now) + interval '1 week'
            ) AS workouts_completed_this_week,
            (
              SELECT COUNT(*)::int
              FROM gym_equipment
              WHERE availability = 'Available'
                AND plan_selectable = true
            ) AS available_equipment,
            (
              SELECT COUNT(*)::int
              FROM gym_equipment
            ) AS total_equipment,
            (
              SELECT COUNT(*)::int
              FROM exercises
              WHERE status = 'Active'
            ) AS active_exercises,
            (
              SELECT COUNT(*)::int
              FROM generated_plans, yangon_now
              WHERE status = 'failed'
                AND created_at >= yangon_now.local_now - interval '30 days'
            ) AS failed_plan_generations,
            (
              SELECT COUNT(*)::int
              FROM body_measurements, yangon_now
              WHERE timezone('Asia/Yangon', created_at) >= date_trunc('month', yangon_now.local_now)
                AND timezone('Asia/Yangon', created_at) < date_trunc('month', yangon_now.local_now) + interval '1 month'
            ) AS measurement_updates_this_month,
            (
              SELECT COUNT(*)::int
              FROM workout_templates
            ) AS workout_templates,
            (
              SELECT COUNT(*)::int
              FROM foods
            ) AS foods,
            (
              SELECT COUNT(*)::int
              FROM nutrition_templates
            ) AS nutrition_templates,
            (
              SELECT COUNT(*)::int
              FROM body_goals
            ) AS body_goals
        `,
      ),
      getAdminClientList({ page: "1" }),
      query<ActivityCountRow>(
        `
          WITH yangon_now AS (
            SELECT timezone('Asia/Yangon', now()) AS local_now
          )
          SELECT
            (
              SELECT COUNT(*)::int
              FROM generated_plans
              WHERE status = 'active'
            ) AS active_plans,
            (
              SELECT COUNT(*)::int
              FROM generated_plans, yangon_now
              WHERE timezone('Asia/Yangon', created_at) >= date_trunc('month', yangon_now.local_now)
                AND timezone('Asia/Yangon', created_at) < date_trunc('month', yangon_now.local_now) + interval '1 month'
            ) AS plans_generated_this_month,
            (
              SELECT COUNT(*)::int
              FROM generated_plans, yangon_now
              WHERE status = 'failed'
                AND timezone('Asia/Yangon', created_at) >= date_trunc('month', yangon_now.local_now)
                AND timezone('Asia/Yangon', created_at) < date_trunc('month', yangon_now.local_now) + interval '1 month'
            ) AS failed_generation_attempts_this_month,
            (
              SELECT COUNT(*)::int
              FROM workout_sessions, yangon_now
              WHERE status = 'completed'
                AND timezone('Asia/Yangon', completed_at) >= date_trunc('week', yangon_now.local_now)
                AND timezone('Asia/Yangon', completed_at) < date_trunc('week', yangon_now.local_now) + interval '1 week'
            ) AS completed_workouts_this_week,
            (
              SELECT COUNT(*)::int
              FROM workout_sessions, yangon_now
              WHERE status = 'skipped'
                AND timezone('Asia/Yangon', updated_at) >= date_trunc('week', yangon_now.local_now)
                AND timezone('Asia/Yangon', updated_at) < date_trunc('week', yangon_now.local_now) + interval '1 week'
            ) AS skipped_workouts_this_week
        `,
      ),
      countOutdatedActivePlans(),
    ]);

  const counts = countsResult.rows[0];
  const activityCounts = activityResult.rows[0];

  const metrics: AdminDashboardMetric[] = [
    { label: "Total Clients", value: String(counts.total_clients), note: "Non-admin accounts", href: "/admin/clients" },
    { label: "Onboarding Completed", value: String(counts.onboarding_completed), note: "Profiles marked complete", href: "/admin/clients?onboarding=complete" },
    { label: "Active Plans", value: String(counts.active_plans), note: "Currently active generated plans" },
    { label: "Workouts Completed This Week", value: String(counts.workouts_completed_this_week), note: "Asia/Yangon calendar week" },
    { label: "Available Equipment", value: String(counts.available_equipment), note: `${counts.total_equipment} total equipment records`, href: "/admin/equipment" },
    { label: "Active Exercises", value: String(counts.active_exercises), note: "Exercises available to plans", href: "/admin/exercises" },
    { label: "Failed Plan Generations", value: String(counts.failed_plan_generations), note: "Failures in the last 30 days" },
    { label: "Measurement Updates This Month", value: String(counts.measurement_updates_this_month), note: "New body measurement snapshots" },
  ];

  const recentClients: AdminRecentClientItem[] = recentClientResult.items.slice(0, 5).map((item) => ({
    userId: item.userId,
    fullName: item.fullName,
    email: item.email,
    bodyGoal: item.bodyGoal,
    onboardingStatus: item.statuses.onboarding,
    activePlanStatus: item.statuses.plan,
    joinedAt: item.joinedAt,
  }));

  const activity: AdminDashboardActivityItem[] = [
    { label: "Active plans", value: String(activityCounts.active_plans), tone: "success" },
    { label: "Outdated active plans", value: String(outdatedActivePlansCount), tone: outdatedActivePlansCount > 0 ? "warning" : "default" },
    { label: "Plans generated this month", value: String(activityCounts.plans_generated_this_month), tone: "default" },
    { label: "Failed generation attempts this month", value: String(activityCounts.failed_generation_attempts_this_month), tone: activityCounts.failed_generation_attempts_this_month > 0 ? "error" : "default" },
    { label: "Completed workouts this week", value: String(activityCounts.completed_workouts_this_week), tone: "success" },
    { label: "Skipped workouts this week", value: String(activityCounts.skipped_workouts_this_week), tone: activityCounts.skipped_workouts_this_week > 0 ? "warning" : "default" },
  ];

  const referenceReadiness: AdminDashboardReferenceItem[] = [
    { label: "Equipment", count: counts.total_equipment, href: "/admin/equipment" },
    { label: "Exercises", count: counts.active_exercises, href: "/admin/exercises" },
    { label: "Workout Templates", count: counts.workout_templates, href: "/admin/workout-templates" },
    { label: "Foods", count: counts.foods, href: "/admin/foods" },
    { label: "Nutrition Templates", count: counts.nutrition_templates, href: "/admin/nutrition-templates" },
    { label: "Body Goals", count: counts.body_goals, href: "/admin/body-goals" },
  ];

  return {
    metrics,
    recentClients,
    activity,
    referenceReadiness,
  };
}
