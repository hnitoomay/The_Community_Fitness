import "server-only";

import { isCurrentAssessmentContent } from "@/lib/assessment-profile-summary";
import { resolveCurrentAge } from "@/lib/date-of-birth";
import { query, withTransaction } from "@/lib/server/db";
import type {
  CurrentAiAssessmentContent,
  ClientAssessmentInput,
} from "@/types/client-onboarding";
import type {
  ActiveGeneratedPlanCalendarData,
  ActiveGeneratedPlanCalendarDay,
  ActiveGeneratedPlanSummary,
  GeneratedPlanDayDetails,
  GeneratedPlanExerciseDetail,
  GeneratedPlanMealItemDetail,
  GeneratedPlanMealType,
} from "@/types/generated-plan";

interface PlanContextRow {
  date_of_birth: string | null;
  age: number | null;
  gender: string | null;
  selected_body_goal_id: number | null;
  goal_label: string | null;
  goal_description: string | null;
  workout_template_id: number | null;
  workout_template_name: string | null;
  workout_template_difficulty: string | null;
  workout_template_days_per_week: number | null;
  workout_template_notes: string | null;
  workout_template_status: string | null;
  nutrition_template_id: number | null;
  nutrition_template_name: string | null;
  nutrition_template_meals_per_day: number | null;
  nutrition_template_minimum_calories: number | null;
  nutrition_template_maximum_calories: number | null;
  nutrition_template_meal_structure: GeneratedPlanMealType[] | null;
  nutrition_template_notes: string | null;
  nutrition_template_status: string | null;
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

interface WorkoutTemplateDayRow {
  day_number: number;
  day_type: "Workout" | "Cardio" | "Stretching" | "Rest";
  focus_category: string;
  exercise_count: number;
}

interface WorkoutExerciseCandidateRow {
  id: number;
  name: string;
  category: string;
  difficulty: string;
  default_sets: number | null;
  default_reps_or_duration: string;
  instructions: string;
  required_equipment_names: Array<string | null>;
}

interface FoodCandidateRow {
  id: number;
  name: string;
  meal_category: GeneratedPlanMealType;
  serving_description: string;
  calories: number;
  protein_grams: string | number | null;
  allergen: string | null;
}

interface LatestAssessmentRow {
  id: number;
  input_hash: string;
  assessment: unknown;
}

interface GeneratingPlanRow {
  id: number;
}

interface InsertedPlanRow {
  id: number;
}

interface FailedPlanUpdateInput {
  planId: number;
  errorMessage: string;
  workoutModelName?: string | null;
  nutritionModelName?: string | null;
}

interface ActivePlanSummaryRow {
  id: number;
  start_date: string;
  end_date: string;
  created_at: string;
  status: "active" | "archived" | "failed" | "generating";
  source_input_hash: string;
  body_goal_label: string;
  workout_template_name: string;
  nutrition_template_name: string;
  workout_model_name: string | null;
  nutrition_model_name: string | null;
}

interface ActivePlanDayRow {
  id: number;
  plan_date: string;
  week_number: number;
  day_number: number;
  day_type: ActiveGeneratedPlanCalendarDay["dayType"];
  focus_category: string | null;
  estimated_duration_minutes: number | null;
  workout_notes: string | null;
  nutrition_notes: string | null;
  exercise_count: number;
  meal_item_count: number;
  meal_types: Array<GeneratedPlanMealType | null>;
}

interface ExerciseDetailRow {
  id: number;
  sequence_number: number;
  exercise_id: number;
  exercise_name: string;
  category: string;
  image_url: string | null;
  default_instructions: string;
  required_equipment_names: Array<string | null>;
  sets: number | null;
  repetitions: string | null;
  duration_minutes: number | null;
  rest_seconds: number | null;
  instructions: string | null;
}

interface MealDetailRow {
  id: number;
  meal_type: GeneratedPlanMealType;
  sequence_number: number;
  food_id: number;
  food_name: string;
  serving_description: string | null;
  notes: string | null;
}

interface ReminderRow {
  food_allergies: string[] | null;
  food_restrictions: string[] | null;
  disliked_foods: string[] | null;
}

function stringifyNumber(value: string | number | null) {
  return value === null ? null : String(value);
}

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeList(values: string[] | null | undefined) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function lowerCaseList(values: string[]) {
  return values.map((value) => value.toLocaleLowerCase("en-US"));
}

function mapPlanSummaryRow(row: ActivePlanSummaryRow): ActiveGeneratedPlanSummary {
  return {
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    status: row.status,
    sourceInputHash: row.source_input_hash,
    bodyGoalLabel: row.body_goal_label,
    workoutTemplateName: row.workout_template_name,
    nutritionTemplateName: row.nutrition_template_name,
    workoutModelName: row.workout_model_name,
    nutritionModelName: row.nutrition_model_name,
  };
}

function mapPlanDayRow(row: ActivePlanDayRow): ActiveGeneratedPlanCalendarDay {
  return {
    id: row.id,
    planDate: row.plan_date,
    weekNumber: row.week_number,
    dayNumber: row.day_number,
    dayType: row.day_type,
    focusCategory: row.focus_category,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    workoutNotes: row.workout_notes,
    nutritionNotes: row.nutrition_notes,
    exerciseCount: row.exercise_count,
    mealItemCount: row.meal_item_count,
    mealTypes: row.meal_types.filter(
      (value): value is GeneratedPlanMealType => typeof value === "string",
    ),
  };
}

function mapExerciseDetailRow(row: ExerciseDetailRow): GeneratedPlanExerciseDetail {
  return {
    id: row.id,
    sequenceNumber: row.sequence_number,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    category: row.category,
    imageUrl: row.image_url,
    defaultInstructions: row.default_instructions,
    requiredEquipmentNames: row.required_equipment_names.filter(
      (value): value is string => typeof value === "string",
    ),
    sets: row.sets,
    repetitions: row.repetitions,
    durationMinutes: row.duration_minutes,
    restSeconds: row.rest_seconds,
    instructions: row.instructions,
  };
}

function mapMealDetailRow(row: MealDetailRow): GeneratedPlanMealItemDetail {
  return {
    id: row.id,
    mealType: row.meal_type,
    sequenceNumber: row.sequence_number,
    foodId: row.food_id,
    foodName: row.food_name,
    servingDescription: row.serving_description,
    notes: row.notes,
  };
}

function mapAssessmentInputRow(row: PlanContextRow): ClientAssessmentInput {
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

export interface WorkoutTemplateDayDefinition {
  dayNumber: number;
  templateDayType: "Workout" | "Cardio" | "Stretching" | "Rest";
  planDayType: ActiveGeneratedPlanCalendarDay["dayType"];
  focusCategory: string;
  exerciseCount: number;
}

export interface WorkoutExerciseCandidate {
  id: number;
  name: string;
  category: string;
  difficulty: string;
  defaultSets: number | null;
  defaultRepetitionsOrDuration: string;
  instructions: string;
  requiredEquipmentNames: string[];
  exactDislikeMatch: boolean;
  broadDislikeMatch: boolean;
}

export interface NutritionPlanCandidateFood {
  id: number;
  name: string;
  mealCategory: GeneratedPlanMealType;
  servingDescription: string;
  calories: number;
  proteinGrams: number | null;
  allergen: string | null;
}

export interface PlanGenerationInputSnapshot extends ClientAssessmentInput {
  latestAssessment:
    | {
        workoutAdvice: string;
        nutritionAdvice: string;
        healthAdvice: string;
      }
    | null;
}

export interface PlanGenerationContext {
  userId: string;
  assessmentInput: ClientAssessmentInput;
  latestAssessmentId: number | null;
  latestAssessmentInputHash: string | null;
  bodyGoal: {
    id: number;
    label: string;
    description: string;
  };
  workoutTemplate: {
    id: number;
    name: string;
    difficulty: string;
    daysPerWeek: number;
    notes: string | null;
    days: WorkoutTemplateDayDefinition[];
  };
  nutritionTemplate: {
    id: number;
    name: string;
    mealsPerDay: number;
    minimumCalories: number;
    maximumCalories: number;
    mealStructure: GeneratedPlanMealType[];
    notes: string | null;
  };
  latestAssessment: CurrentAiAssessmentContent | null;
  profileSnapshot: PlanGenerationInputSnapshot;
}

function mapTemplateDayType(
  value: WorkoutTemplateDayRow["day_type"],
): ActiveGeneratedPlanCalendarDay["dayType"] {
  switch (value) {
    case "Workout":
      return "workout";
    case "Cardio":
      return "cardio";
    case "Stretching":
      return "stretching";
    default:
      return "rest";
  }
}

function normalizeExerciseDislikeValue(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeExerciseToken(value: string) {
  const normalized = normalizeExerciseDislikeValue(value);

  if (normalized.endsWith("ies")) {
    return `${normalized.slice(0, -3)}y`;
  }

  if (normalized.endsWith("s")) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

const broadDislikeTerms = new Set([
  "shoulder",
  "leg",
  "back",
  "cardio",
  "chest",
  "core",
]);

function classifyExerciseDislike(
  candidate: Pick<WorkoutExerciseCandidate, "name" | "category">,
  dislikes: string[],
) {
  const normalizedName = normalizeExerciseDislikeValue(candidate.name);
  const normalizedCategory = normalizeExerciseToken(candidate.category);
  const normalizedDislikes = dislikes
    .map(normalizeExerciseDislikeValue)
    .filter(Boolean);

  const exactDislikeMatch = normalizedDislikes.some(
    (dislike) => dislike === normalizedName,
  );
  const broadDislikeMatch = normalizedDislikes.some((dislike) => {
    const normalizedDislikeToken = normalizeExerciseToken(dislike);

    if (!broadDislikeTerms.has(normalizedDislikeToken)) {
      return false;
    }

    return normalizedDislikeToken === normalizedCategory;
  });

  return {
    exactDislikeMatch,
    broadDislikeMatch,
  };
}

export function foodConflictsWithPreferences(
  candidate: Pick<NutritionPlanCandidateFood, "name" | "allergen">,
  input: Pick<
    ClientAssessmentInput,
    "foodAllergies" | "foodRestrictions" | "dislikedFoods"
  >,
) {
  const tokens = lowerCaseList([
    ...normalizeList(input.foodAllergies),
    ...normalizeList(input.foodRestrictions),
    ...normalizeList(input.dislikedFoods),
  ]);

  if (tokens.length === 0) {
    return false;
  }

  const name = candidate.name.toLocaleLowerCase("en-US");
  const allergen = candidate.allergen?.toLocaleLowerCase("en-US") ?? "";

  return tokens.some(
    (token) =>
      token.length > 0 &&
      (name.includes(token) || allergen.includes(token) || token.includes(name)),
  );
}

export async function getPlanGenerationContext(
  userId: string,
): Promise<PlanGenerationContext | null> {
  const planContextResult = await query<PlanContextRow>(
    `
      SELECT
        cp.date_of_birth::text,
        cp.age,
        cp.gender,
        cp.selected_body_goal_id,
        bg.label AS goal_label,
        bg.description AS goal_description,
        wt.id AS workout_template_id,
        wt.name AS workout_template_name,
        wt.difficulty AS workout_template_difficulty,
        wt.days_per_week AS workout_template_days_per_week,
        wt.notes AS workout_template_notes,
        wt.status AS workout_template_status,
        nt.id AS nutrition_template_id,
        nt.name AS nutrition_template_name,
        nt.meals_per_day AS nutrition_template_meals_per_day,
        nt.minimum_calories AS nutrition_template_minimum_calories,
        nt.maximum_calories AS nutrition_template_maximum_calories,
        nt.meal_structure AS nutrition_template_meal_structure,
        nt.notes AS nutrition_template_notes,
        nt.status AS nutrition_template_status,
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
      LEFT JOIN workout_templates AS wt
        ON wt.id = bg.workout_template_id
       AND wt.status = 'Active'
      LEFT JOIN nutrition_templates AS nt
        ON nt.id = bg.nutrition_template_id
       AND nt.status = 'Active'
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

  const row = planContextResult.rows[0];

  if (!row) {
    return null;
  }

  if (
    row.selected_body_goal_id === null ||
    !row.goal_label ||
    !row.goal_description ||
    row.workout_template_id === null ||
    !row.workout_template_name ||
    !row.workout_template_difficulty ||
    row.workout_template_days_per_week === null ||
    row.nutrition_template_id === null ||
    !row.nutrition_template_name ||
    row.nutrition_template_meals_per_day === null ||
    row.nutrition_template_minimum_calories === null ||
    row.nutrition_template_maximum_calories === null ||
    !row.nutrition_template_meal_structure?.length
  ) {
    return {
      userId,
      assessmentInput: mapAssessmentInputRow(row),
      bodyGoal: {
        id: row.selected_body_goal_id ?? 0,
        label: row.goal_label ?? "",
        description: row.goal_description ?? "",
      },
      workoutTemplate: {
        id: row.workout_template_id ?? 0,
        name: row.workout_template_name ?? "",
        difficulty: row.workout_template_difficulty ?? "",
        daysPerWeek: row.workout_template_days_per_week ?? 0,
        notes: row.workout_template_notes,
        days: [],
      },
      nutritionTemplate: {
        id: row.nutrition_template_id ?? 0,
        name: row.nutrition_template_name ?? "",
        mealsPerDay: row.nutrition_template_meals_per_day ?? 0,
        minimumCalories: row.nutrition_template_minimum_calories ?? 0,
        maximumCalories: row.nutrition_template_maximum_calories ?? 0,
        mealStructure: row.nutrition_template_meal_structure ?? [],
        notes: row.nutrition_template_notes,
      },
      latestAssessment: null,
      latestAssessmentId: null,
      latestAssessmentInputHash: null,
      profileSnapshot: {
        ...mapAssessmentInputRow(row),
        latestAssessment: null,
      },
    };
  }

  const [templateDaysResult, latestAssessmentResult] = await Promise.all([
    query<WorkoutTemplateDayRow>(
      `
        SELECT day_number, day_type, focus_category, exercise_count
        FROM workout_template_days
        WHERE workout_template_id = $1
        ORDER BY day_number ASC, id ASC
      `,
      [row.workout_template_id],
    ),
    query<LatestAssessmentRow>(
      `
        SELECT id, input_hash, assessment
        FROM ai_assessments
        WHERE user_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `,
      [userId],
    ),
  ]);

  const latestAssessmentValue = latestAssessmentResult.rows[0]?.assessment;
  const latestAssessment = isCurrentAssessmentContent(
    latestAssessmentValue as CurrentAiAssessmentContent | null | undefined,
  )
    ? (latestAssessmentValue as CurrentAiAssessmentContent)
    : null;
  const assessmentInput = mapAssessmentInputRow(row);

  return {
    userId,
    assessmentInput,
    latestAssessmentId: latestAssessmentResult.rows[0]?.id ?? null,
    latestAssessmentInputHash: latestAssessmentResult.rows[0]?.input_hash ?? null,
    bodyGoal: {
      id: row.selected_body_goal_id,
      label: row.goal_label,
      description: row.goal_description,
    },
    workoutTemplate: {
      id: row.workout_template_id,
      name: row.workout_template_name,
      difficulty: row.workout_template_difficulty,
      daysPerWeek: row.workout_template_days_per_week,
      notes: row.workout_template_notes,
      days: templateDaysResult.rows.map((day) => ({
        dayNumber: day.day_number,
        templateDayType: day.day_type,
        planDayType: mapTemplateDayType(day.day_type),
        focusCategory: day.focus_category,
        exerciseCount: day.exercise_count,
      })),
    },
    nutritionTemplate: {
      id: row.nutrition_template_id,
      name: row.nutrition_template_name,
      mealsPerDay: row.nutrition_template_meals_per_day,
      minimumCalories: row.nutrition_template_minimum_calories,
      maximumCalories: row.nutrition_template_maximum_calories,
      mealStructure: row.nutrition_template_meal_structure,
      notes: row.nutrition_template_notes,
    },
    latestAssessment,
    profileSnapshot: {
      ...assessmentInput,
      latestAssessment,
    },
  };
}

export async function listEligibleWorkoutCandidates(
  focusCategories: string[],
  dislikedExercises: string[],
) {
  const result = await query<WorkoutExerciseCandidateRow>(
    `
      WITH eligible_exercises AS (
        SELECT e.*
        FROM exercises AS e
        WHERE e.status = 'Active'
          AND e.category = ANY($1::text[])
          AND NOT EXISTS (
            SELECT 1
            FROM exercise_equipment_requirements AS eer
            WHERE eer.exercise_id = e.id
              AND COALESCE(eer.required, true) = true
              AND NOT EXISTS (
                SELECT 1
                FROM gym_equipment AS ge
                WHERE ge.equipment_type_id = eer.equipment_type_id
                  AND ge.plan_selectable = true
                  AND ge.availability = 'Available'
              )
          )
      )
      SELECT
        e.id,
        e.name,
        e.category,
        e.difficulty,
        e.default_sets,
        e.default_reps_or_duration,
        e.instructions,
        COALESCE(
          ARRAY_AGG(DISTINCT et.name ORDER BY et.name)
            FILTER (WHERE et.name IS NOT NULL),
          ARRAY[]::text[]
        ) AS required_equipment_names
      FROM eligible_exercises AS e
      LEFT JOIN exercise_equipment_requirements AS eer
        ON eer.exercise_id = e.id
      LEFT JOIN equipment_types AS et
        ON et.id = eer.equipment_type_id
      GROUP BY
        e.id,
        e.name,
        e.category,
        e.difficulty,
        e.default_sets,
        e.default_reps_or_duration,
        e.instructions
      ORDER BY e.category ASC, e.name ASC, e.id ASC
    `,
    [focusCategories],
  );

  const normalizedDislikes = lowerCaseList(dislikedExercises);

  return result.rows.map<WorkoutExerciseCandidate>((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    difficulty: row.difficulty,
    defaultSets: row.default_sets,
    defaultRepetitionsOrDuration: row.default_reps_or_duration,
    instructions: row.instructions,
    requiredEquipmentNames: row.required_equipment_names.filter(
      (value): value is string => typeof value === "string",
    ),
    ...classifyExerciseDislike(
      {
        name: row.name,
        category: row.category,
      },
      normalizedDislikes,
    ),
  }));
}

export async function listApprovedFoods(input: ClientAssessmentInput) {
  const result = await query<FoodCandidateRow>(
    `
      SELECT
        id,
        name,
        meal_category,
        serving_description,
        calories,
        protein_grams,
        allergen
      FROM foods
      WHERE status = 'Active'
      ORDER BY meal_category ASC, name ASC, id ASC
    `,
  );

  return result.rows
    .map<NutritionPlanCandidateFood>((row) => ({
      id: row.id,
      name: row.name,
      mealCategory: row.meal_category,
      servingDescription: row.serving_description,
      calories: row.calories,
      proteinGrams:
        row.protein_grams === null ? null : Number(row.protein_grams),
      allergen: normalizeText(row.allergen),
    }))
    .filter((food) => !foodConflictsWithPreferences(food, input));
}

export async function markStaleGeneratingPlansFailed(
  userId: string,
  staleBeforeIso: string,
) {
  await query(
    `
      UPDATE generated_plans
      SET
        status = 'failed',
        error_message = 'Generation timed out.'
      WHERE user_id = $1
        AND status = 'generating'
        AND updated_at < $2::timestamptz
    `,
    [userId, staleBeforeIso],
  );
}

export async function findGeneratingPlanForUser(userId: string) {
  const result = await query<GeneratingPlanRow>(
    `
      SELECT id
      FROM generated_plans
      WHERE user_id = $1
        AND status = 'generating'
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function insertGeneratingPlan(input: {
  userId: string;
  aiAssessmentId: number | null;
  bodyGoalId: number;
  workoutTemplateId: number;
  nutritionTemplateId: number;
  sourceInputHash: string;
  profileSnapshot: PlanGenerationInputSnapshot;
  startDate: string;
  endDate: string;
}) {
  const result = await query<InsertedPlanRow>(
    `
      INSERT INTO generated_plans (
        user_id,
        ai_assessment_id,
        body_goal_id,
        workout_template_id,
        nutrition_template_id,
        source_input_hash,
        profile_snapshot,
        start_date,
        end_date,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, 'generating')
      RETURNING id
    `,
    [
      input.userId,
      input.aiAssessmentId,
      input.bodyGoalId,
      input.workoutTemplateId,
      input.nutritionTemplateId,
      input.sourceInputHash,
      JSON.stringify(input.profileSnapshot),
      input.startDate,
      input.endDate,
    ],
  );

  return result.rows[0].id;
}

export async function markGeneratedPlanFailed(input: FailedPlanUpdateInput) {
  await query(
    `
      UPDATE generated_plans
      SET
        status = 'failed',
        error_message = $2,
        workout_model_name = COALESCE($3, workout_model_name),
        nutrition_model_name = COALESCE($4, nutrition_model_name)
      WHERE id = $1
        AND status = 'generating'
    `,
    [
      input.planId,
      input.errorMessage,
      input.workoutModelName ?? null,
      input.nutritionModelName ?? null,
    ],
  );
}

export async function activateGeneratedPlan(input: {
  planId: number;
  userId: string;
  workoutModelName: string;
  nutritionModelName: string;
  onPlanDaysInserted?: (details: { insertedRowCount: number }) => void;
  onExercisesInserted?: (details: { insertedRowCount: number }) => void;
  onMealItemsInserted?: (details: { insertedRowCount: number }) => void;
  onCommitted?: () => void;
  days: Array<{
    planDate: string;
    weekNumber: number;
    dayNumber: number;
    dayType: ActiveGeneratedPlanCalendarDay["dayType"];
    focusCategory: string | null;
    estimatedDurationMinutes: number | null;
    workoutNotes: string | null;
    nutritionNotes: string | null;
    exercises: Array<{
      exerciseId: number;
      sets: number | null;
      repetitions: string | null;
      durationMinutes: number | null;
      restSeconds: number | null;
      instructions: string | null;
    }>;
    meals: Array<{
      mealType: GeneratedPlanMealType;
      items: Array<{
        foodId: number;
        servingDescription: string | null;
        notes: string | null;
      }>;
    }>;
  }>;
}) {
  return withTransaction(async (client) => {
    const planDayIdsByDate = new Map<string, number>();
    let insertedPlanDayCount = 0;
    let insertedExerciseCount = 0;
    let insertedMealItemCount = 0;

    if (input.days.length !== 28) {
      throw new Error("INVALID_PLAN_DAY_INSERT_COUNT");
    }

    for (const day of input.days) {
      const insertedDay = await client.query<{ id: number }>(
        `
          INSERT INTO generated_plan_days (
            plan_id,
            plan_date,
            week_number,
            day_number,
            day_type,
            focus_category,
            estimated_duration_minutes,
            workout_notes,
            nutrition_notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `,
        [
          input.planId,
          day.planDate,
          day.weekNumber,
          day.dayNumber,
          day.dayType,
          day.focusCategory,
          day.estimatedDurationMinutes,
          day.workoutNotes,
          day.nutritionNotes,
        ],
      );

      const planDayId = insertedDay.rows[0].id;
      planDayIdsByDate.set(day.planDate, planDayId);
      insertedPlanDayCount += 1;

      for (const [index, exercise] of day.exercises.entries()) {
        await client.query(
          `
            INSERT INTO generated_plan_exercises (
              plan_day_id,
              exercise_id,
              sequence_number,
              sets,
              repetitions,
              duration_minutes,
              rest_seconds,
              instructions
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
          [
            planDayId,
            exercise.exerciseId,
            index + 1,
            exercise.sets,
            exercise.repetitions,
            exercise.durationMinutes,
            exercise.restSeconds,
            exercise.instructions,
          ],
        );
        insertedExerciseCount += 1;
      }

      for (const meal of day.meals) {
        for (const [index, item] of meal.items.entries()) {
          await client.query(
            `
              INSERT INTO generated_plan_meal_items (
                plan_day_id,
                meal_type,
                food_id,
                sequence_number,
                serving_description,
                notes
              )
              VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [
              planDayId,
              meal.mealType,
              item.foodId,
              index + 1,
              item.servingDescription,
              item.notes,
            ],
          );
          insertedMealItemCount += 1;
        }
      }
    }

    void planDayIdsByDate;

    if (insertedPlanDayCount !== 28) {
      throw new Error("INVALID_PLAN_DAY_INSERT_COUNT");
    }

    input.onPlanDaysInserted?.({ insertedRowCount: insertedPlanDayCount });
    input.onExercisesInserted?.({ insertedRowCount: insertedExerciseCount });
    input.onMealItemsInserted?.({ insertedRowCount: insertedMealItemCount });

    await client.query(
      `
        UPDATE generated_plans
        SET status = 'archived'
        WHERE user_id = $1
          AND status = 'active'
          AND id <> $2
      `,
      [input.userId, input.planId],
    );

    await client.query(
      `
        UPDATE generated_plans
        SET
          status = 'active',
          workout_model_name = $2,
          nutrition_model_name = $3,
          error_message = NULL
        WHERE id = $1
      `,
      [input.planId, input.workoutModelName, input.nutritionModelName],
    );

    input.onCommitted?.();
  });
}

export async function getActiveGeneratedPlanCalendarForUser(
  userId: string,
  planId?: number,
): Promise<ActiveGeneratedPlanCalendarData | null> {
  const summaryResult = await query<ActivePlanSummaryRow>(
    `
      SELECT
        gp.id,
        gp.start_date::text,
        gp.end_date::text,
        gp.created_at::text,
        gp.status,
        gp.source_input_hash,
        bg.label AS body_goal_label,
        wt.name AS workout_template_name,
        nt.name AS nutrition_template_name,
        gp.workout_model_name,
        gp.nutrition_model_name
      FROM generated_plans AS gp
      INNER JOIN body_goals AS bg
        ON bg.id = gp.body_goal_id
      INNER JOIN workout_templates AS wt
        ON wt.id = gp.workout_template_id
      INNER JOIN nutrition_templates AS nt
        ON nt.id = gp.nutrition_template_id
      WHERE gp.user_id = $1
        AND (
          ($2::int IS NULL AND gp.status = 'active')
          OR gp.id = $2
        )
      ORDER BY gp.created_at DESC, gp.id DESC
      LIMIT 1
    `,
    [userId, planId ?? null],
  );

  const summaryRow = summaryResult.rows[0];

  if (!summaryRow) {
    return null;
  }

  const daysResult = await query<ActivePlanDayRow>(
    `
      SELECT
        gpd.id,
        gpd.plan_date::text,
        gpd.week_number,
        gpd.day_number,
        gpd.day_type,
        gpd.focus_category,
        gpd.estimated_duration_minutes,
        gpd.workout_notes,
        gpd.nutrition_notes,
        COUNT(DISTINCT gpe.id)::int AS exercise_count,
        COUNT(DISTINCT gpmi.id)::int AS meal_item_count,
        COALESCE(
          ARRAY_AGG(DISTINCT gpmi.meal_type ORDER BY gpmi.meal_type)
            FILTER (WHERE gpmi.meal_type IS NOT NULL),
          ARRAY[]::text[]
        ) AS meal_types
      FROM generated_plan_days AS gpd
      LEFT JOIN generated_plan_exercises AS gpe
        ON gpe.plan_day_id = gpd.id
      LEFT JOIN generated_plan_meal_items AS gpmi
        ON gpmi.plan_day_id = gpd.id
      WHERE gpd.plan_id = $1
      GROUP BY gpd.id
      ORDER BY gpd.plan_date ASC, gpd.id ASC
    `,
    [summaryRow.id],
  );

  return {
    plan: mapPlanSummaryRow(summaryRow),
    days: daysResult.rows.map(mapPlanDayRow),
  };
}

export async function getGeneratedPlanDayDetailsForUser(
  userId: string,
  date: string,
  planId?: number,
): Promise<GeneratedPlanDayDetails | null> {
  const summaryResult = await query<
    ActivePlanSummaryRow &
      Omit<ActivePlanDayRow, "id"> & {
        plan_day_id: number;
      }
  >(
    `
      SELECT
        gp.id,
        gp.start_date::text,
        gp.end_date::text,
        gp.created_at::text,
        gp.status,
        gp.source_input_hash,
        bg.label AS body_goal_label,
        wt.name AS workout_template_name,
        nt.name AS nutrition_template_name,
        gp.workout_model_name,
        gp.nutrition_model_name,
        gpd.id AS plan_day_id,
        gpd.plan_date::text,
        gpd.week_number,
        gpd.day_number,
        gpd.day_type,
        gpd.focus_category,
        gpd.estimated_duration_minutes,
        gpd.workout_notes,
        gpd.nutrition_notes,
        COALESCE(exercise_counts.exercise_count, 0) AS exercise_count,
        COALESCE(meal_counts.meal_item_count, 0) AS meal_item_count,
        COALESCE(meal_counts.meal_types, ARRAY[]::text[]) AS meal_types
      FROM generated_plans AS gp
      INNER JOIN body_goals AS bg
        ON bg.id = gp.body_goal_id
      INNER JOIN workout_templates AS wt
        ON wt.id = gp.workout_template_id
      INNER JOIN nutrition_templates AS nt
        ON nt.id = gp.nutrition_template_id
      INNER JOIN generated_plan_days AS gpd
        ON gpd.plan_id = gp.id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS exercise_count
        FROM generated_plan_exercises AS gpe
        WHERE gpe.plan_day_id = gpd.id
      ) AS exercise_counts
        ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS meal_item_count,
          COALESCE(
            ARRAY_AGG(DISTINCT meal_type ORDER BY meal_type),
            ARRAY[]::text[]
          ) AS meal_types
        FROM generated_plan_meal_items AS gpmi
        WHERE gpmi.plan_day_id = gpd.id
      ) AS meal_counts
        ON TRUE
      WHERE gp.user_id = $1
        AND (
          ($3::int IS NULL AND gp.status = 'active')
          OR gp.id = $3
        )
        AND gpd.plan_date = $2::date
      ORDER BY gp.created_at DESC, gp.id DESC
      LIMIT 1
    `,
    [userId, date, planId ?? null],
  );

  const summaryRow = summaryResult.rows[0];

  if (!summaryRow) {
    return null;
  }

  const [exerciseResult, mealResult, reminderResult] = await Promise.all([
    query<ExerciseDetailRow>(
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
          gpe.id,
          gpe.sequence_number,
          e.id AS exercise_id,
          e.name AS exercise_name,
          e.category,
          e.image_url,
          e.instructions AS default_instructions,
          COALESCE(
            ARRAY_AGG(re.equipment_name ORDER BY re.equipment_name)
              FILTER (WHERE re.equipment_name IS NOT NULL),
            ARRAY[]::text[]
          ) AS required_equipment_names,
          gpe.sets,
          gpe.repetitions,
          gpe.duration_minutes,
          gpe.rest_seconds,
          gpe.instructions
        FROM generated_plan_exercises AS gpe
        INNER JOIN exercises AS e
          ON e.id = gpe.exercise_id
        LEFT JOIN requirement_equipment AS re
          ON re.exercise_id = e.id
        WHERE gpe.plan_day_id = $1
        GROUP BY
          gpe.id,
          gpe.sequence_number,
          e.id,
          e.name,
          e.category,
          e.image_url,
          e.instructions,
          gpe.sets,
          gpe.repetitions,
          gpe.duration_minutes,
          gpe.rest_seconds,
          gpe.instructions
        ORDER BY gpe.sequence_number ASC, gpe.id ASC
      `,
      [summaryRow.plan_day_id],
    ),
    query<MealDetailRow>(
      `
        SELECT
          gpmi.id,
          gpmi.meal_type,
          gpmi.sequence_number,
          f.id AS food_id,
          f.name AS food_name,
          gpmi.serving_description,
          gpmi.notes
        FROM generated_plan_meal_items AS gpmi
        INNER JOIN foods AS f
          ON f.id = gpmi.food_id
        WHERE gpmi.plan_day_id = $1
        ORDER BY gpmi.meal_type ASC, gpmi.sequence_number ASC, gpmi.id ASC
      `,
      [summaryRow.plan_day_id],
    ),
    query<ReminderRow>(
      `
        SELECT
          food_allergies,
          food_restrictions,
          disliked_foods
        FROM client_preferences
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    ),
  ]);

  const reminderRow = reminderResult.rows[0];
  const reminderParts = [
    ...normalizeList(reminderRow?.food_allergies),
    ...normalizeList(reminderRow?.food_restrictions),
    ...normalizeList(reminderRow?.disliked_foods),
  ];

  return {
    plan: mapPlanSummaryRow(summaryRow),
    day: mapPlanDayRow({
      id: summaryRow.plan_day_id,
      plan_date: summaryRow.plan_date,
      week_number: summaryRow.week_number,
      day_number: summaryRow.day_number,
      day_type: summaryRow.day_type,
      focus_category: summaryRow.focus_category,
      estimated_duration_minutes: summaryRow.estimated_duration_minutes,
      workout_notes: summaryRow.workout_notes,
      nutrition_notes: summaryRow.nutrition_notes,
      exercise_count: summaryRow.exercise_count,
      meal_item_count: summaryRow.meal_item_count,
      meal_types: summaryRow.meal_types,
    }),
    exercises: exerciseResult.rows.map(mapExerciseDetailRow),
    meals: mealResult.rows.map(mapMealDetailRow),
    allergyRestrictionReminder:
      reminderParts.length > 0 ? reminderParts.join("၊ ") : null,
  };
}
