import "server-only";

import { createAssessmentInputHash } from "@/lib/server/ai-assessment";
import { getAssessmentInputForUser, getLatestAiAssessmentForUser } from "@/lib/server/repositories/ai-assessment-repository";
import { query } from "@/lib/server/db";
import type {
  HomeActivePlanState,
  HomeDashboardNotice,
  HomeFirstTimeSetupState,
  HomeReturningAssessmentState,
  HomeReturningNoActivePlanState,
  HomeSetupState,
  HomeSetupStepId,
  HomeSetupStepState,
  HomeWorkoutDayPreview,
  HomeWorkoutExercisePreview,
  HomeWorkoutPlanPreview,
} from "@/types/home-workout";
import type { WorkoutSessionStatus } from "@/types/workout-tracking";

interface ActivePlanRow {
  plan_id: number;
  start_date: string;
  end_date: string;
  source_input_hash: string;
}

interface HomeSetupStatusRow {
  profile_id: number | null;
  full_name: string | null;
  date_of_birth: string | null;
  age: number | null;
  gender: string | null;
  selected_body_goal_id: number | null;
  onboarding_completed: boolean | null;
  latest_measurement_id: number | null;
  preferences_user_id: string | null;
  has_any_assessment: boolean;
  has_any_generated_plan: boolean;
  has_archived_plan: boolean;
  active_plan_source_input_hash: string | null;
}

interface HomeDayRow {
  plan_day_id: number;
  plan_date: string;
  day_type: HomeWorkoutDayPreview["dayType"];
  focus_category: string | null;
  estimated_duration_minutes: number | null;
  total_exercises: number;
  completed_exercises: number;
  status: Exclude<WorkoutSessionStatus, "not_started"> | null;
}

interface HomeExerciseRow {
  plan_date: string;
  generated_plan_exercise_id: number;
  sequence_number: number;
  exercise_name: string;
  image_url: string | null;
  required_equipment_names: Array<string | null>;
  sets: number | null;
  repetitions: string | null;
  duration_minutes: number | null;
  completed: boolean;
}

function calculateCompletionPercent(completedExercises: number, totalExercises: number) {
  if (totalExercises <= 0) {
    return 0;
  }

  return Math.round((completedExercises / totalExercises) * 100);
}

function mapWorkoutStatus(
  status: Exclude<WorkoutSessionStatus, "not_started"> | null,
): WorkoutSessionStatus {
  return status ?? "not_started";
}

function mapExerciseRow(row: HomeExerciseRow): HomeWorkoutExercisePreview {
  const equipmentNames = row.required_equipment_names.filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  return {
    generatedPlanExerciseId: row.generated_plan_exercise_id,
    sequenceNumber: row.sequence_number,
    exerciseName: row.exercise_name,
    imageUrl: row.image_url,
    equipmentLabel: equipmentNames.length > 0 ? equipmentNames.join(", ") : "Bodyweight",
    sets: row.sets,
    repetitions: row.repetitions,
    durationMinutes: row.duration_minutes,
    completed: row.completed,
  };
}

function isPersonalProfileComplete(row: HomeSetupStatusRow | null) {
  return Boolean(
    row?.profile_id &&
      row.full_name?.trim() &&
      (row.date_of_birth || row.age !== null) &&
      row.gender?.trim(),
  );
}

function isMeasurementsAndGoalComplete(row: HomeSetupStatusRow | null) {
  return Boolean(
    row?.latest_measurement_id &&
      row.selected_body_goal_id &&
      row.preferences_user_id &&
      row.onboarding_completed,
  );
}

function buildSetupSteps(nextStepId: HomeSetupStepId): HomeSetupStepState[] {
  const orderedSteps: Array<{
    id: HomeSetupStepId;
    title: string;
    description: string;
  }> = [
    {
      id: "personal_profile",
      title: "Personal Profile",
      description: "Add your identity details.",
    },
    {
      id: "measurements_goal",
      title: "Measurements & Goal",
      description: "Save your body stats and goal.",
    },
    {
      id: "ai_assessment",
      title: "Assessment",
      description: "Review your current fitness analysis.",
    },
    {
      id: "one_month_plan",
      title: "One-Month Plan",
      description: "Unlock your active monthly plan.",
    },
  ];
  const currentIndex = orderedSteps.findIndex((step) => step.id === nextStepId);

  return orderedSteps.map((step, index) => ({
    ...step,
    status:
      index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "current"
          : "upcoming",
  }));
}

function getPrimaryAction(nextStepId: HomeSetupStepId) {
  switch (nextStepId) {
    case "personal_profile":
      return {
        primaryActionLabel: "Complete Personal Profile",
        primaryActionHref: "/settings/profile",
      };
    case "measurements_goal":
      return {
        primaryActionLabel: "Complete Measurements & Goal",
        primaryActionHref: "/profile",
      };
    case "ai_assessment":
      return {
        primaryActionLabel: "Get AI Assessment",
        primaryActionHref: "/assessment",
      };
    default:
      return {
        primaryActionLabel: "Generate One-Month Plan",
        primaryActionHref: "/assessment",
      };
  }
}

function deriveFirstTimeSetupState(input: {
  profileStatus: HomeSetupStatusRow | null;
}): HomeFirstTimeSetupState {
  const hasProfile = isPersonalProfileComplete(input.profileStatus);

  if (!hasProfile) {
    const nextStepId: HomeSetupStepId = "personal_profile";

    return {
      kind: "first_time_setup",
      nextStepId,
      steps: buildSetupSteps(nextStepId),
      ...getPrimaryAction(nextStepId),
    };
  }

  const hasMeasurementsAndGoal = isMeasurementsAndGoalComplete(input.profileStatus);

  if (!hasMeasurementsAndGoal) {
    const nextStepId: HomeSetupStepId = "measurements_goal";

    return {
      kind: "first_time_setup",
      nextStepId,
      steps: buildSetupSteps(nextStepId),
      ...getPrimaryAction(nextStepId),
    };
  }

  const nextStepId: HomeSetupStepId = "ai_assessment";

  return {
    kind: "first_time_setup",
    nextStepId,
    steps: buildSetupSteps(nextStepId),
    ...getPrimaryAction(nextStepId),
  };
}

function buildDashboardNotice(input: {
  isAssessmentCurrent: boolean;
  isActivePlanCurrent: boolean;
}): HomeDashboardNotice | null {
  if (!input.isActivePlanCurrent) {
    return {
      message: "လက်ရှိ Plan သည် ယခင် Profile အချက်အလက်များအပေါ် အခြေခံထားပါသည်။",
      actionLabel: "Review Update",
      actionHref: "/assessment",
    };
  }

  if (!input.isAssessmentCurrent) {
    return {
      message:
        "Profile အချက်အလက် ပြောင်းလဲထားသောကြောင့် Assessment အသစ် ရယူနိုင်ပါသည်။",
      actionLabel: "Update Assessment",
      actionHref: "/assessment",
    };
  }

  return null;
}

function deriveHomeSetupState(input: {
  profileStatus: HomeSetupStatusRow | null;
  currentInputHash: string | null;
  latestAssessmentInputHash: string | null;
  activePlanSourceInputHash: string | null;
}): HomeSetupState {
  const hasAnyAssessment = Boolean(input.profileStatus?.has_any_assessment);
  const hasAnyGeneratedPlan = Boolean(input.profileStatus?.has_any_generated_plan);
  const hasArchivedPlan = Boolean(input.profileStatus?.has_archived_plan);
  const hasActivePlan = Boolean(input.activePlanSourceInputHash);

  if (!hasAnyAssessment && !hasAnyGeneratedPlan) {
    return deriveFirstTimeSetupState({
      profileStatus: input.profileStatus,
    });
  }

  const isAssessmentCurrent = Boolean(
    input.currentInputHash &&
      input.latestAssessmentInputHash &&
      input.currentInputHash === input.latestAssessmentInputHash,
  );
  const isActivePlanCurrent = Boolean(
    input.currentInputHash &&
      input.activePlanSourceInputHash &&
      input.currentInputHash === input.activePlanSourceInputHash,
  );

  if (hasActivePlan) {
    const activePlanState: HomeActivePlanState = {
      kind: "active_plan",
      isAssessmentCurrent,
      isActivePlanCurrent,
      dashboardNotice: buildDashboardNotice({
        isAssessmentCurrent,
        isActivePlanCurrent,
      }),
    };

    return activePlanState;
  }

  if (hasAnyAssessment && !hasArchivedPlan) {
    const returningAssessmentState: HomeReturningAssessmentState = {
      kind: "returning_assessment_only",
      title: isAssessmentCurrent ? "Assessment ready" : "Assessment available",
      description: isAssessmentCurrent
        ? "Your latest assessment is ready. Generate your one-month plan."
        : "Your profile has changed since the latest assessment. Review it and generate your next one-month plan.",
      primaryActionLabel: "Generate One-Month Plan",
      primaryActionHref: "/assessment",
    };

    return returningAssessmentState;
  }

  const returningNoActivePlanState: HomeReturningNoActivePlanState = {
    kind: "returning_no_active_plan",
    title: "No active plan is currently available.",
    description: "Create a new one-month plan or review your previous plan history.",
    primaryActionLabel: "Create New One-Month Plan",
    primaryActionHref: "/assessment",
    secondaryActionLabel: "View Plan History",
    secondaryActionHref: "/history",
  };

  return returningNoActivePlanState;
}

export async function getHomeSetupStateForUser(
  userId: string,
): Promise<HomeSetupState> {
  const setupStatusResult = await query<HomeSetupStatusRow>(
    `
      SELECT
        cp.id AS profile_id,
        cp.full_name,
        cp.date_of_birth::text,
        cp.age,
        cp.gender,
        cp.selected_body_goal_id,
        cp.onboarding_completed,
        latest_measurement.id AS latest_measurement_id,
        pref.user_id AS preferences_user_id,
        EXISTS (
          SELECT 1
          FROM ai_assessments AS aa
          WHERE aa.user_id = au.id
        ) AS has_any_assessment,
        EXISTS (
          SELECT 1
          FROM generated_plans AS gp
          WHERE gp.user_id = au.id
        ) AS has_any_generated_plan,
        EXISTS (
          SELECT 1
          FROM generated_plans AS gp
          WHERE gp.user_id = au.id
            AND gp.status = 'archived'
        ) AS has_archived_plan,
        active_plan.source_input_hash AS active_plan_source_input_hash
      FROM auth_users AS au
      LEFT JOIN client_profiles AS cp
        ON cp.user_id = au.id
      LEFT JOIN LATERAL (
        SELECT bm.id
        FROM body_measurements AS bm
        WHERE bm.user_id = au.id
        ORDER BY bm.measured_at DESC, bm.id DESC
        LIMIT 1
      ) AS latest_measurement
        ON TRUE
      LEFT JOIN client_preferences AS pref
        ON pref.user_id = au.id
      LEFT JOIN LATERAL (
        SELECT gp.source_input_hash
        FROM generated_plans AS gp
        WHERE gp.user_id = au.id
          AND gp.status = 'active'
        ORDER BY gp.created_at DESC, gp.id DESC
        LIMIT 1
      ) AS active_plan
        ON TRUE
      WHERE au.id = $1
      LIMIT 1
    `,
    [userId],
  );

  const profileStatus = setupStatusResult.rows[0] ?? null;

  const [assessmentInput, latestAssessment] = await Promise.all([
    getAssessmentInputForUser(userId),
    getLatestAiAssessmentForUser(userId),
  ]);

  const currentInputHash = assessmentInput
    ? createAssessmentInputHash(assessmentInput).inputHash
    : null;

  return deriveHomeSetupState({
    profileStatus,
    currentInputHash,
    latestAssessmentInputHash: latestAssessment?.inputHash ?? null,
    activePlanSourceInputHash: profileStatus?.active_plan_source_input_hash ?? null,
  });
}

export async function getHomeWorkoutPlanPreviewForUser(
  userId: string,
): Promise<HomeWorkoutPlanPreview | null> {
  const activePlanResult = await query<ActivePlanRow>(
    `
      SELECT
        gp.id AS plan_id,
        gp.start_date::text,
        gp.end_date::text,
        gp.source_input_hash
      FROM generated_plans AS gp
      WHERE gp.user_id = $1
        AND gp.status = 'active'
      ORDER BY gp.created_at DESC, gp.id DESC
      LIMIT 1
    `,
    [userId],
  );

  const activePlan = activePlanResult.rows[0] ?? null;

  if (!activePlan) {
    return null;
  }

  const [daysResult, exercisesResult] = await Promise.all([
    query<HomeDayRow>(
      `
        SELECT
          gpd.id AS plan_day_id,
          gpd.plan_date::text,
          gpd.day_type,
          gpd.focus_category,
          gpd.estimated_duration_minutes,
          COUNT(DISTINCT gpe.id)::int AS total_exercises,
          COUNT(DISTINCT wel.generated_plan_exercise_id)
            FILTER (WHERE wel.completed = true)::int AS completed_exercises,
          ws.status
        FROM generated_plan_days AS gpd
        LEFT JOIN generated_plan_exercises AS gpe
          ON gpe.plan_day_id = gpd.id
        LEFT JOIN workout_sessions AS ws
          ON ws.user_id = $1
         AND ws.plan_day_id = gpd.id
        LEFT JOIN workout_exercise_logs AS wel
          ON wel.workout_session_id = ws.id
         AND wel.generated_plan_exercise_id = gpe.id
        WHERE gpd.plan_id = $2
        GROUP BY gpd.id, ws.id
        ORDER BY gpd.plan_date ASC, gpd.id ASC
      `,
      [userId, activePlan.plan_id],
    ),
    query<HomeExerciseRow>(
      `
        WITH requirement_equipment AS (
          SELECT DISTINCT ON (eer.exercise_id, eer.equipment_type_id)
            eer.exercise_id,
            ge.name AS equipment_name
          FROM exercise_equipment_requirements AS eer
          INNER JOIN gym_equipment AS ge
            ON ge.equipment_type_id = eer.equipment_type_id
          WHERE ge.plan_selectable = true
            AND ge.availability = 'Available'
          ORDER BY eer.exercise_id, eer.equipment_type_id, ge.name ASC, ge.id ASC
        )
        SELECT
          gpd.plan_date::text,
          gpe.id AS generated_plan_exercise_id,
          gpe.sequence_number,
          e.name AS exercise_name,
          e.image_url,
          COALESCE(
            ARRAY_AGG(re.equipment_name ORDER BY re.equipment_name)
              FILTER (WHERE re.equipment_name IS NOT NULL),
            ARRAY[]::text[]
          ) AS required_equipment_names,
          gpe.sets,
          gpe.repetitions,
          gpe.duration_minutes,
          COALESCE(wel.completed, false) AS completed
        FROM generated_plan_days AS gpd
        INNER JOIN generated_plan_exercises AS gpe
          ON gpe.plan_day_id = gpd.id
        INNER JOIN exercises AS e
          ON e.id = gpe.exercise_id
        LEFT JOIN requirement_equipment AS re
          ON re.exercise_id = e.id
        LEFT JOIN workout_sessions AS ws
          ON ws.user_id = $1
         AND ws.plan_day_id = gpd.id
        LEFT JOIN workout_exercise_logs AS wel
          ON wel.workout_session_id = ws.id
         AND wel.generated_plan_exercise_id = gpe.id
        WHERE gpd.plan_id = $2
        GROUP BY
          gpd.plan_date,
          gpe.id,
          gpe.sequence_number,
          e.name,
          e.image_url,
          gpe.sets,
          gpe.repetitions,
          gpe.duration_minutes,
          wel.completed
        ORDER BY gpd.plan_date ASC, gpe.sequence_number ASC, gpe.id ASC
      `,
      [userId, activePlan.plan_id],
    ),
  ]);

  const exercisesByDate = new Map<string, HomeWorkoutExercisePreview[]>();

  for (const row of exercisesResult.rows) {
    const existing = exercisesByDate.get(row.plan_date) ?? [];
    existing.push(mapExerciseRow(row));
    exercisesByDate.set(row.plan_date, existing);
  }

  return {
    planId: activePlan.plan_id,
    startDate: activePlan.start_date,
    endDate: activePlan.end_date,
    sourceInputHash: activePlan.source_input_hash,
    days: daysResult.rows.map<HomeWorkoutDayPreview>((row) => ({
      planDayId: row.plan_day_id,
      planDate: row.plan_date,
      dayType: row.day_type,
      focusCategory: row.focus_category,
      estimatedDurationMinutes: row.estimated_duration_minutes,
      totalExercises: row.total_exercises ?? 0,
      completedExercises: row.completed_exercises ?? 0,
      completionPercent: calculateCompletionPercent(
        row.completed_exercises ?? 0,
        row.total_exercises ?? 0,
      ),
      status: mapWorkoutStatus(row.status),
      exercises: exercisesByDate.get(row.plan_date) ?? [],
    })),
  };
}

export const __testing__ = {
  buildSetupSteps,
  buildDashboardNotice,
  deriveHomeSetupState,
  deriveFirstTimeSetupState,
  getPrimaryAction,
  isMeasurementsAndGoalComplete,
  isPersonalProfileComplete,
};
