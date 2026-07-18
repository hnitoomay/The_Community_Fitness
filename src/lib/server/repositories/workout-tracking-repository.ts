import "server-only";

import { query, withTransaction } from "@/lib/server/db";
import type {
  HomeWorkoutSummary,
  HomeWorkoutWeekDate,
  WorkoutExerciseTrackingDetail,
  WorkoutHistoryEntry,
  WorkoutSessionStatus,
  WorkoutSessionTrackingDetail,
} from "@/types/workout-tracking";

interface WorkoutDayContextRow {
  plan_id: number;
  plan_day_id: number;
  plan_date: string;
  day_type: string;
  focus_category: string | null;
  estimated_duration_minutes: number | null;
  total_exercises: number;
}

interface WorkoutSessionRow {
  id: number;
  status: Exclude<WorkoutSessionStatus, "not_started">;
  difficulty_rating: number | null;
  pain_reported: boolean;
  feedback_note: string | null;
  started_at: string | null;
  completed_at: string | null;
}

interface WorkoutExerciseLogRow {
  generated_plan_exercise_id: number;
  completed: boolean;
  completed_sets: number | null;
  actual_repetitions: string | null;
  note: string | null;
  completed_at: string | null;
}

interface HomeWorkoutSummaryRow {
  plan_date: string;
  focus_category: string | null;
  estimated_duration_minutes: number | null;
  total_exercises: number;
  completed_exercises: number;
  status: Exclude<WorkoutSessionStatus, "not_started"> | null;
  equipment_names: Array<string | null>;
}

interface HomeWorkoutWeekDateRow {
  plan_date: string;
}

interface WorkoutHistoryRow {
  session_id: number;
  plan_date: string;
  focus_category: string | null;
  day_type: string;
  status: Exclude<WorkoutSessionStatus, "not_started">;
  estimated_duration_minutes: number | null;
  difficulty_rating: number | null;
  pain_reported: boolean;
  completed_at: string | null;
  total_exercises: number;
  completed_exercises: number;
}

interface EnsureSessionRow {
  id: number;
  status: Exclude<WorkoutSessionStatus, "not_started">;
}

interface WorkoutCompletionCountsRow {
  total_exercises: number;
  completed_exercises: number;
}

function toIsoOrNull(value: string | null) {
  return value ?? null;
}

function toShortWeekday(dateOnly: string) {
  return new Date(`${dateOnly}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function toDayOfMonthLabel(dateOnly: string) {
  return String(new Date(`${dateOnly}T00:00:00`).getDate()).padStart(2, "0");
}

function mapWorkoutStatus(
  sessionStatus: Exclude<WorkoutSessionStatus, "not_started"> | null | undefined,
) {
  return sessionStatus ?? "not_started";
}

function calculateCompletionPercent(
  completedExercises: number,
  totalExercises: number,
) {
  if (totalExercises <= 0) {
    return 0;
  }

  return Math.round((completedExercises / totalExercises) * 100);
}

function deriveTrackingStatus(input: {
  sessionStatus: Exclude<WorkoutSessionStatus, "not_started"> | null | undefined;
  completedExercises: number;
  totalExercises: number;
}): WorkoutSessionStatus {
  if (input.sessionStatus === "skipped") {
    return "skipped";
  }

  if (input.completedExercises <= 0) {
    return "not_started";
  }

  if (
    input.totalExercises > 0 &&
    input.completedExercises === input.totalExercises
  ) {
    return "completed";
  }

  return "in_progress";
}

function buildWorkoutSessionTrackingDetail(input: {
  totalExercises: number;
  session: WorkoutSessionRow | null;
  logs: WorkoutExerciseLogRow[];
}): WorkoutSessionTrackingDetail {
  const completedExercises = input.logs.filter((log) => log.completed).length;

  return {
    sessionId: input.session?.id ?? null,
    status: deriveTrackingStatus({
      sessionStatus: input.session?.status,
      completedExercises,
      totalExercises: input.totalExercises,
    }),
    difficultyRating: input.session?.difficulty_rating ?? null,
    painReported: input.session?.pain_reported ?? false,
    feedbackNote: input.session?.feedback_note ?? null,
    startedAt: toIsoOrNull(input.session?.started_at ?? null),
    completedAt: toIsoOrNull(input.session?.completed_at ?? null),
    totalExercises: input.totalExercises,
    completedExercises,
    completionPercent: calculateCompletionPercent(
      completedExercises,
      input.totalExercises,
    ),
    exerciseLogs: input.logs.map<WorkoutExerciseTrackingDetail>((log) => ({
      generatedPlanExerciseId: log.generated_plan_exercise_id,
      completed: log.completed,
      completedSets: log.completed_sets,
      actualRepetitions: log.actual_repetitions,
      note: log.note,
      completedAt: toIsoOrNull(log.completed_at),
    })),
  };
}

async function getWorkoutDayContextForUser(
  userId: string,
  date: string,
  planId?: number,
) {
  const result = await query<WorkoutDayContextRow>(
    `
      SELECT
        gp.id AS plan_id,
        gpd.id AS plan_day_id,
        gpd.plan_date::text,
        gpd.day_type,
        gpd.focus_category,
        gpd.estimated_duration_minutes,
        COUNT(gpe.id)::int AS total_exercises
      FROM generated_plans AS gp
      INNER JOIN generated_plan_days AS gpd
        ON gpd.plan_id = gp.id
      LEFT JOIN generated_plan_exercises AS gpe
        ON gpe.plan_day_id = gpd.id
      WHERE gp.user_id = $1
        AND gpd.plan_date = $2::date
        AND (
          ($3::int IS NULL AND gp.status = 'active')
          OR gp.id = $3
        )
      GROUP BY gp.id, gpd.id
      ORDER BY gp.created_at DESC, gp.id DESC
      LIMIT 1
    `,
    [userId, date, planId ?? null],
  );

  return result.rows[0] ?? null;
}

async function getWorkoutSessionAndLogs(planDayId: number, userId: string) {
  const sessionResult = await query<WorkoutSessionRow>(
    `
      SELECT
        ws.id,
        ws.status,
        ws.difficulty_rating,
        ws.pain_reported,
        ws.feedback_note,
        ws.started_at::text,
        ws.completed_at::text
      FROM workout_sessions AS ws
      WHERE ws.user_id = $1
        AND ws.plan_day_id = $2
      LIMIT 1
    `,
    [userId, planDayId],
  );

  const session = sessionResult.rows[0] ?? null;

  if (!session) {
    return { session: null, logs: [] as WorkoutExerciseLogRow[] };
  }

  const logsResult = await query<WorkoutExerciseLogRow>(
    `
      SELECT
        wel.generated_plan_exercise_id,
        wel.completed,
        wel.completed_sets,
        wel.actual_repetitions,
        wel.note,
        wel.completed_at::text
      FROM workout_exercise_logs AS wel
      WHERE wel.workout_session_id = $1
      ORDER BY wel.generated_plan_exercise_id ASC
    `,
    [session.id],
  );

  return { session, logs: logsResult.rows };
}

async function getWorkoutCompletionCounts(
  client: {
    query: typeof query;
  },
  sessionId: number,
  planDayId: number,
) {
  const countsResult = await client.query<WorkoutCompletionCountsRow>(
    `
      SELECT
        COUNT(gpe.id)::int AS total_exercises,
        COUNT(wel.generated_plan_exercise_id)
          FILTER (WHERE wel.completed = true)::int AS completed_exercises
      FROM generated_plan_exercises AS gpe
      LEFT JOIN workout_exercise_logs AS wel
        ON wel.generated_plan_exercise_id = gpe.id
       AND wel.workout_session_id = $1
      WHERE gpe.plan_day_id = $2
    `,
    [sessionId, planDayId],
  );

  return countsResult.rows[0] ?? null;
}

async function syncWorkoutSessionStatus(
  client: {
    query: typeof query;
  },
  input: {
    sessionId: number;
    planDayId: number;
  },
) {
  const counts = await getWorkoutCompletionCounts(
    client,
    input.sessionId,
    input.planDayId,
  );

  if (!counts) {
    throw new Error("WORKOUT_SESSION_COUNTS_UNAVAILABLE");
  }

  if (counts.total_exercises <= 0) {
    throw new Error("WORKOUT_DAY_HAS_NO_EXERCISES");
  }

  await client.query(
    `
      UPDATE workout_sessions
      SET
        status = CASE
          WHEN $2::int = $3::int AND $3::int > 0 THEN 'completed'
          ELSE 'in_progress'
        END,
        completed_at = CASE
          WHEN $2::int = $3::int AND $3::int > 0 THEN CURRENT_TIMESTAMP
          ELSE NULL
        END,
        started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [input.sessionId, counts.completed_exercises, counts.total_exercises],
  );

  return counts;
}

function assertTrackableWorkoutDay(
  context: WorkoutDayContextRow | null,
  options?: { requireExercises?: boolean },
) {
  if (!context) {
    throw new Error("WORKOUT_DAY_NOT_FOUND");
  }

  if (context.day_type === "rest") {
    throw new Error("REST_DAY_NOT_TRACKABLE");
  }

  if (options?.requireExercises && context.total_exercises <= 0) {
    throw new Error("WORKOUT_DAY_HAS_NO_EXERCISES");
  }
}

export async function getWorkoutSessionTrackingForUser(
  userId: string,
  date: string,
  planId?: number,
): Promise<WorkoutSessionTrackingDetail | null> {
  const context = await getWorkoutDayContextForUser(userId, date, planId);

  if (!context) {
    return null;
  }

  const { session, logs } = await getWorkoutSessionAndLogs(context.plan_day_id, userId);

  return buildWorkoutSessionTrackingDetail({
    totalExercises: context.total_exercises,
    session,
    logs,
  });
}

export async function getHomeWorkoutSummaryForUser(
  userId: string,
  date: string,
): Promise<HomeWorkoutSummary | null> {
  const context = await getWorkoutDayContextForUser(userId, date);

  if (!context) {
    return null;
  }

  const summaryResult = await query<HomeWorkoutSummaryRow>(
    `
      SELECT
        gpd.plan_date::text,
        gpd.focus_category,
        gpd.estimated_duration_minutes,
        COUNT(DISTINCT gpe.id)::int AS total_exercises,
        COUNT(DISTINCT wel.generated_plan_exercise_id)
          FILTER (WHERE wel.completed = true)::int AS completed_exercises,
        ws.status,
        COALESCE(
          ARRAY_AGG(DISTINCT ge.name ORDER BY ge.name)
            FILTER (WHERE ge.name IS NOT NULL),
          ARRAY[]::text[]
        ) AS equipment_names
      FROM generated_plans AS gp
      INNER JOIN generated_plan_days AS gpd
        ON gpd.plan_id = gp.id
      LEFT JOIN generated_plan_exercises AS gpe
        ON gpe.plan_day_id = gpd.id
      LEFT JOIN workout_sessions AS ws
        ON ws.user_id = gp.user_id
       AND ws.plan_day_id = gpd.id
      LEFT JOIN workout_exercise_logs AS wel
        ON wel.workout_session_id = ws.id
       AND wel.generated_plan_exercise_id = gpe.id
      LEFT JOIN exercise_equipment_requirements AS eer
        ON eer.exercise_id = gpe.exercise_id
      LEFT JOIN gym_equipment AS ge
        ON ge.equipment_type_id = eer.equipment_type_id
       AND ge.plan_selectable = true
       AND ge.availability = 'Available'
      WHERE gp.user_id = $1
        AND gp.id = $2
        AND gpd.id = $3
      GROUP BY gpd.id, ws.id
      LIMIT 1
    `,
    [userId, context.plan_id, context.plan_day_id],
  );

  const summaryRow = summaryResult.rows[0];

  if (!summaryRow) {
    return null;
  }

  const weekDatesResult = await query<HomeWorkoutWeekDateRow>(
    `
      SELECT gpd.plan_date::text
      FROM generated_plan_days AS gpd
      WHERE gpd.plan_id = $1
        AND gpd.week_number = (
          SELECT gpd_current.week_number
          FROM generated_plan_days AS gpd_current
          WHERE gpd_current.id = $2
        )
      ORDER BY gpd.plan_date ASC, gpd.id ASC
    `,
    [context.plan_id, context.plan_day_id],
  );

  const status = mapWorkoutStatus(summaryRow.status);
  const completedExercises = summaryRow.completed_exercises ?? 0;
  const totalExercises = summaryRow.total_exercises ?? 0;
  const visibleEquipment = summaryRow.equipment_names
    .filter((value): value is string => typeof value === "string")
    .slice(0, 2);

  return {
    planDate: summaryRow.plan_date,
    focus: summaryRow.focus_category ?? summaryRow.status ?? "Workout",
    estimatedDurationMinutes: summaryRow.estimated_duration_minutes,
    equipmentHeadline:
      visibleEquipment.length > 0
        ? visibleEquipment.join(", ")
        : totalExercises > 0
          ? "Bodyweight or unlisted equipment"
          : "No exercises scheduled",
    status,
    completedExercises,
    totalExercises,
    completionPercent: calculateCompletionPercent(completedExercises, totalExercises),
    weekDates: weekDatesResult.rows.map<HomeWorkoutWeekDate>((row) => ({
      shortDay: toShortWeekday(row.plan_date),
      dateLabel: toDayOfMonthLabel(row.plan_date),
      isToday: row.plan_date === date,
    })),
  };
}

export async function listWorkoutHistoryForUser(
  userId: string,
): Promise<WorkoutHistoryEntry[]> {
  const result = await query<WorkoutHistoryRow>(
    `
      SELECT
        ws.id AS session_id,
        gpd.plan_date::text,
        gpd.focus_category,
        gpd.day_type,
        ws.status,
        gpd.estimated_duration_minutes,
        ws.difficulty_rating,
        ws.pain_reported,
        ws.completed_at::text,
        COUNT(DISTINCT gpe.id)::int AS total_exercises,
        COUNT(DISTINCT wel.generated_plan_exercise_id)
          FILTER (WHERE wel.completed = true)::int AS completed_exercises
      FROM workout_sessions AS ws
      INNER JOIN generated_plan_days AS gpd
        ON gpd.id = ws.plan_day_id
      INNER JOIN generated_plans AS gp
        ON gp.id = ws.plan_id
      LEFT JOIN generated_plan_exercises AS gpe
        ON gpe.plan_day_id = gpd.id
      LEFT JOIN workout_exercise_logs AS wel
        ON wel.workout_session_id = ws.id
       AND wel.generated_plan_exercise_id = gpe.id
      WHERE ws.user_id = $1
      GROUP BY ws.id, gpd.id
      ORDER BY gpd.plan_date DESC, ws.created_at DESC, ws.id DESC
    `,
    [userId],
  );

  return result.rows.map<WorkoutHistoryEntry>((row) => ({
    sessionId: row.session_id,
    planDate: row.plan_date,
    workoutFocusCategory: row.focus_category ?? row.day_type,
    status: row.status,
    completedExercises: row.completed_exercises ?? 0,
    totalExercises: row.total_exercises ?? 0,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    difficultyRating: row.difficulty_rating,
    painReported: row.pain_reported,
    completedAt: toIsoOrNull(row.completed_at),
  }));
}

async function ensureEditableSessionForExerciseChange(
  client: {
    query: typeof query;
  },
  userId: string,
  date: string,
  generatedPlanExerciseId: number,
) {
  const contextResult = await client.query<WorkoutDayContextRow>(
    `
      SELECT
        gp.id AS plan_id,
        gpd.id AS plan_day_id,
        gpd.plan_date::text,
        gpd.day_type,
        gpd.focus_category,
        gpd.estimated_duration_minutes,
        COUNT(gpe.id)::int AS total_exercises
      FROM generated_plans AS gp
      INNER JOIN generated_plan_days AS gpd
        ON gpd.plan_id = gp.id
      LEFT JOIN generated_plan_exercises AS gpe
        ON gpe.plan_day_id = gpd.id
      WHERE gp.user_id = $1
        AND gp.status = 'active'
        AND gpd.plan_date = $2::date
      GROUP BY gp.id, gpd.id
      LIMIT 1
    `,
    [userId, date],
  );
  const context = contextResult.rows[0] ?? null;
  assertTrackableWorkoutDay(context, { requireExercises: true });

  const exerciseResult = await client.query<{ generated_plan_exercise_id: number }>(
    `
      SELECT gpe.id AS generated_plan_exercise_id
      FROM generated_plan_exercises AS gpe
      WHERE gpe.id = $1
        AND gpe.plan_day_id = $2
      LIMIT 1
    `,
    [generatedPlanExerciseId, context.plan_day_id],
  );

  if (!exerciseResult.rows[0]) {
    throw new Error("INVALID_GENERATED_PLAN_EXERCISE");
  }

  const sessionResult = await client.query<EnsureSessionRow>(
    `
      INSERT INTO workout_sessions (
        user_id,
        plan_id,
        plan_day_id,
        status,
        started_at
      )
      VALUES ($1, $2, $3, 'in_progress', CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, plan_day_id)
      DO UPDATE
      SET
        started_at = COALESCE(workout_sessions.started_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, status
    `,
    [userId, context.plan_id, context.plan_day_id],
  );

  const session = sessionResult.rows[0];

  if (session.status === "skipped") {
    throw new Error("WORKOUT_ALREADY_SKIPPED");
  }

  return {
    sessionId: session.id,
    planDayId: context.plan_day_id,
  };
}

export async function toggleWorkoutExerciseCompletionForUser(input: {
  userId: string;
  date: string;
  generatedPlanExerciseId: number;
  completed: boolean;
}) {
  await withTransaction(async (client) => {
    const session = await ensureEditableSessionForExerciseChange(
      client,
      input.userId,
      input.date,
      input.generatedPlanExerciseId,
    );

    await client.query(
      `
        INSERT INTO workout_exercise_logs (
          workout_session_id,
          generated_plan_exercise_id,
          completed,
          completed_at
        )
        VALUES ($1, $2, $3, CASE WHEN $3 THEN CURRENT_TIMESTAMP ELSE NULL END)
        ON CONFLICT (workout_session_id, generated_plan_exercise_id)
        DO UPDATE
        SET
          completed = EXCLUDED.completed,
          completed_at = CASE
            WHEN EXCLUDED.completed THEN CURRENT_TIMESTAMP
            ELSE NULL
          END,
          updated_at = CURRENT_TIMESTAMP
      `,
      [session.sessionId, input.generatedPlanExerciseId, input.completed],
    );

    await syncWorkoutSessionStatus(client, {
      sessionId: session.sessionId,
      planDayId: session.planDayId,
    });
  });

  return getWorkoutSessionTrackingForUser(input.userId, input.date);
}

export async function updateWorkoutExercisePerformanceForUser(input: {
  userId: string;
  date: string;
  generatedPlanExerciseId: number;
  completedSets: number | null;
  actualRepetitions: string | null;
}) {
  await withTransaction(async (client) => {
    const session = await ensureEditableSessionForExerciseChange(
      client,
      input.userId,
      input.date,
      input.generatedPlanExerciseId,
    );

    await client.query(
      `
        INSERT INTO workout_exercise_logs (
          workout_session_id,
          generated_plan_exercise_id,
          completed,
          completed_sets,
          actual_repetitions
        )
        VALUES ($1, $2, false, $3, $4)
        ON CONFLICT (workout_session_id, generated_plan_exercise_id)
        DO UPDATE
        SET
          completed_sets = EXCLUDED.completed_sets,
          actual_repetitions = EXCLUDED.actual_repetitions,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        session.sessionId,
        input.generatedPlanExerciseId,
        input.completedSets,
        input.actualRepetitions,
      ],
    );
  });

  return getWorkoutSessionTrackingForUser(input.userId, input.date);
}

export async function completeWorkoutForUser(input: {
  userId: string;
  date: string;
}) {
  await withTransaction(async (client) => {
    const contextResult = await client.query<WorkoutDayContextRow>(
      `
        SELECT
          gp.id AS plan_id,
          gpd.id AS plan_day_id,
          gpd.plan_date::text,
          gpd.day_type,
          gpd.focus_category,
          gpd.estimated_duration_minutes,
          COUNT(gpe.id)::int AS total_exercises
        FROM generated_plans AS gp
        INNER JOIN generated_plan_days AS gpd
          ON gpd.plan_id = gp.id
        LEFT JOIN generated_plan_exercises AS gpe
          ON gpe.plan_day_id = gpd.id
        WHERE gp.user_id = $1
          AND gp.status = 'active'
          AND gpd.plan_date = $2::date
        GROUP BY gp.id, gpd.id
        LIMIT 1
      `,
      [input.userId, input.date],
    );
    const context = contextResult.rows[0] ?? null;
    assertTrackableWorkoutDay(context, { requireExercises: true });

    const sessionResult = await client.query<EnsureSessionRow>(
      `
        INSERT INTO workout_sessions (
          user_id,
          plan_id,
          plan_day_id,
          status,
          started_at
        )
        VALUES ($1, $2, $3, 'in_progress', CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, plan_day_id)
        DO UPDATE
        SET
          started_at = COALESCE(workout_sessions.started_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, status
      `,
      [input.userId, context.plan_id, context.plan_day_id],
    );
    const session = sessionResult.rows[0];

    if (session.status === "skipped") {
      throw new Error("WORKOUT_ALREADY_SKIPPED");
    }

    const countsResult = await client.query<{
      total_exercises: number;
      completed_exercises: number;
    }>(
      `
        SELECT
          COUNT(gpe.id)::int AS total_exercises,
          COUNT(wel.generated_plan_exercise_id)
            FILTER (WHERE wel.completed = true)::int AS completed_exercises
        FROM generated_plan_exercises AS gpe
        LEFT JOIN workout_exercise_logs AS wel
          ON wel.generated_plan_exercise_id = gpe.id
         AND wel.workout_session_id = $1
        WHERE gpe.plan_day_id = $2
      `,
      [session.id, context.plan_day_id],
    );

    const counts = countsResult.rows[0];

    if (!counts || counts.total_exercises <= 0) {
      throw new Error("WORKOUT_DAY_HAS_NO_EXERCISES");
    }

    if (counts.completed_exercises !== counts.total_exercises) {
      throw new Error("WORKOUT_HAS_INCOMPLETE_EXERCISES");
    }

    await client.query(
      `
        UPDATE workout_sessions
        SET
          status = 'completed',
          completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP),
          started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [session.id],
    );
  });

  return getWorkoutSessionTrackingForUser(input.userId, input.date);
}

export async function skipWorkoutForUser(input: {
  userId: string;
  date: string;
}) {
  await withTransaction(async (client) => {
    const contextResult = await client.query<WorkoutDayContextRow>(
      `
        SELECT
          gp.id AS plan_id,
          gpd.id AS plan_day_id,
          gpd.plan_date::text,
          gpd.day_type,
          gpd.focus_category,
          gpd.estimated_duration_minutes,
          COUNT(gpe.id)::int AS total_exercises
        FROM generated_plans AS gp
        INNER JOIN generated_plan_days AS gpd
          ON gpd.plan_id = gp.id
        LEFT JOIN generated_plan_exercises AS gpe
          ON gpe.plan_day_id = gpd.id
        WHERE gp.user_id = $1
          AND gp.status = 'active'
          AND gpd.plan_date = $2::date
        GROUP BY gp.id, gpd.id
        LIMIT 1
      `,
      [input.userId, input.date],
    );
    const context = contextResult.rows[0] ?? null;
    assertTrackableWorkoutDay(context);

    const existingSessionResult = await client.query<EnsureSessionRow>(
      `
        SELECT ws.id, ws.status
        FROM workout_sessions AS ws
        WHERE ws.user_id = $1
          AND ws.plan_day_id = $2
        LIMIT 1
      `,
      [input.userId, context.plan_day_id],
    );
    const existingSession = existingSessionResult.rows[0] ?? null;

    if (existingSession?.status === "completed") {
      throw new Error("WORKOUT_ALREADY_COMPLETED");
    }

    const sessionResult = await client.query<EnsureSessionRow>(
      `
        INSERT INTO workout_sessions (
          user_id,
          plan_id,
          plan_day_id,
          status
        )
        VALUES ($1, $2, $3, 'skipped')
        ON CONFLICT (user_id, plan_day_id)
        DO UPDATE
        SET
          status = 'skipped',
          completed_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, status
      `,
      [input.userId, context.plan_id, context.plan_day_id],
    );

    if (!sessionResult.rows[0]) {
      throw new Error("WORKOUT_SESSION_CREATE_FAILED");
    }
  });

  return getWorkoutSessionTrackingForUser(input.userId, input.date);
}

export async function undoSkipWorkoutForUser(input: {
  userId: string;
  date: string;
}) {
  await withTransaction(async (client) => {
    const contextResult = await client.query<WorkoutDayContextRow>(
      `
        SELECT
          gp.id AS plan_id,
          gpd.id AS plan_day_id,
          gpd.plan_date::text,
          gpd.day_type,
          gpd.focus_category,
          gpd.estimated_duration_minutes,
          COUNT(gpe.id)::int AS total_exercises
        FROM generated_plans AS gp
        INNER JOIN generated_plan_days AS gpd
          ON gpd.plan_id = gp.id
        LEFT JOIN generated_plan_exercises AS gpe
          ON gpe.plan_day_id = gpd.id
        WHERE gp.user_id = $1
          AND gp.status = 'active'
          AND gpd.plan_date = $2::date
        GROUP BY gp.id, gpd.id
        LIMIT 1
      `,
      [input.userId, input.date],
    );
    const context = contextResult.rows[0] ?? null;
    assertTrackableWorkoutDay(context);

    const sessionResult = await client.query<EnsureSessionRow>(
      `
        SELECT ws.id, ws.status
        FROM workout_sessions AS ws
        WHERE ws.user_id = $1
          AND ws.plan_day_id = $2
        LIMIT 1
      `,
      [input.userId, context.plan_day_id],
    );
    const session = sessionResult.rows[0] ?? null;

    if (!session || session.status !== "skipped") {
      throw new Error("WORKOUT_DAY_NOT_SKIPPED");
    }

    const counts = await getWorkoutCompletionCounts(
      client,
      session.id,
      context.plan_day_id,
    );

    if (!counts) {
      throw new Error("WORKOUT_SESSION_COUNTS_UNAVAILABLE");
    }

    if (counts.total_exercises <= 0) {
      throw new Error("WORKOUT_DAY_HAS_NO_EXERCISES");
    }

    await client.query(
      `
        UPDATE workout_sessions
        SET
          status = CASE
            WHEN $2::int = $3::int AND $3::int > 0 THEN 'completed'
            ELSE 'in_progress'
          END,
          completed_at = CASE
            WHEN $2::int = $3::int AND $3::int > 0 THEN CURRENT_TIMESTAMP
            ELSE NULL
          END,
          started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [session.id, counts.completed_exercises, counts.total_exercises],
    );
  });

  return getWorkoutSessionTrackingForUser(input.userId, input.date);
}

export async function saveWorkoutFeedbackForUser(input: {
  userId: string;
  date: string;
  difficultyRating: number | null;
  painReported: boolean;
  feedbackNote: string | null;
}) {
  await withTransaction(async (client) => {
    const contextResult = await client.query<WorkoutDayContextRow>(
      `
        SELECT
          gp.id AS plan_id,
          gpd.id AS plan_day_id,
          gpd.plan_date::text,
          gpd.day_type,
          gpd.focus_category,
          gpd.estimated_duration_minutes,
          COUNT(gpe.id)::int AS total_exercises
        FROM generated_plans AS gp
        INNER JOIN generated_plan_days AS gpd
          ON gpd.plan_id = gp.id
        LEFT JOIN generated_plan_exercises AS gpe
          ON gpe.plan_day_id = gpd.id
        WHERE gp.user_id = $1
          AND gp.status = 'active'
          AND gpd.plan_date = $2::date
        GROUP BY gp.id, gpd.id
        LIMIT 1
      `,
      [input.userId, input.date],
    );
    const context = contextResult.rows[0] ?? null;
    assertTrackableWorkoutDay(context);

    await client.query(
      `
        INSERT INTO workout_sessions (
          user_id,
          plan_id,
          plan_day_id,
          status,
          started_at,
          difficulty_rating,
          pain_reported,
          feedback_note
        )
        VALUES ($1, $2, $3, 'in_progress', CURRENT_TIMESTAMP, $4, $5, $6)
        ON CONFLICT (user_id, plan_day_id)
        DO UPDATE
        SET
          difficulty_rating = EXCLUDED.difficulty_rating,
          pain_reported = EXCLUDED.pain_reported,
          feedback_note = EXCLUDED.feedback_note,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        input.userId,
        context.plan_id,
        context.plan_day_id,
        input.difficultyRating,
        input.painReported,
        input.feedbackNote,
      ],
    );
  });

  return getWorkoutSessionTrackingForUser(input.userId, input.date);
}

export const __testing__ = {
  deriveTrackingStatus,
  buildWorkoutSessionTrackingDetail,
  calculateCompletionPercent,
  mapWorkoutStatus,
};
