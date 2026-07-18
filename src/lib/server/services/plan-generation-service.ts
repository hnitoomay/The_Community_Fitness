import "server-only";

import { ZodError } from "zod";

import {
  buildNutritionPlanUserPrompt,
  buildWorkoutPlanUserPrompt,
  buildWorkoutRepairUserPrompt,
  nutritionPlanSystemPrompt,
  workoutPlanSystemPrompt,
} from "@/lib/server/ai/plan-prompts";
import {
  nutritionPlanJsonSchema,
  nutritionPlanSchema,
  type NutritionPlanResponse,
} from "@/lib/server/ai/nutrition-plan-schema";
import {
  createWorkoutBaseWeekJsonSchema,
  createWorkoutBaseWeekSchema,
  type WorkoutBaseWeekResponse,
  type WorkoutGenerationDaySpec,
} from "@/lib/server/ai/workout-plan-schema";
import { createAssessmentInputHash } from "@/lib/server/ai-assessment";
import {
  activateGeneratedPlan,
  findGeneratingPlanForUser,
  foodConflictsWithPreferences,
  getPlanGenerationContext,
  insertGeneratingPlan,
  listApprovedFoods,
  listEligibleWorkoutCandidates,
  markGeneratedPlanFailed,
  markStaleGeneratingPlansFailed,
  type NutritionPlanCandidateFood,
  type PlanGenerationContext,
  type WorkoutExerciseCandidate,
} from "@/lib/server/repositories/generated-plan-repository";
import type { GeneratedPlanMealType } from "@/types/generated-plan";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 45000;
const STALE_GENERATION_MINUTES = 15;

type GenerationStage =
  | "generation-start"
  | "profile-loaded"
  | "templates-loaded"
  | "exercise-candidates-loaded"
  | "food-candidates-loaded"
  | "workout-request-start"
  | "workout-response-received"
  | "workout-json-parsed"
  | "workout-zod-validated"
  | "workout-database-validated"
  | "nutrition-request-start"
  | "nutrition-response-received"
  | "nutrition-json-parsed"
  | "nutrition-zod-validated"
  | "nutrition-database-validated"
  | "database-transaction-start"
  | "plan-days-inserted"
  | "exercises-inserted"
  | "meal-items-inserted"
  | "database-transaction-committed"
  | "generation-failed";

type DiagnosticCode =
  | "INPUT_LOADING_FAILED"
  | "MISSING_WORKOUT_TEMPLATE"
  | "MISSING_NUTRITION_TEMPLATE"
  | "NO_EXERCISE_CANDIDATES"
  | "NO_FOOD_CANDIDATES"
  | "WORKOUT_PROVIDER_ERROR"
  | "WORKOUT_REQUEST_TIMEOUT"
  | "WORKOUT_EMPTY_RESPONSE"
  | "WORKOUT_INVALID_JSON"
  | "WORKOUT_SCHEMA_VALIDATION_FAILED"
  | "WORKOUT_ID_VALIDATION_FAILED"
  | "NUTRITION_PROVIDER_ERROR"
  | "NUTRITION_REQUEST_TIMEOUT"
  | "NUTRITION_EMPTY_RESPONSE"
  | "NUTRITION_INVALID_JSON"
  | "NUTRITION_SCHEMA_VALIDATION_FAILED"
  | "NUTRITION_ID_VALIDATION_FAILED"
  | "DATABASE_SAVE_FAILED";

type PlanFailureReason =
  | "missing-profile"
  | "missing-body-goal"
  | "missing-workout-template"
  | "missing-nutrition-template"
  | "invalid-workout-template"
  | "no-exercise-candidates"
  | "no-food-candidates"
  | "duplicate-generation"
  | "generation-failed";

interface StageLogEntry {
  stage: GenerationStage;
  elapsedMs: number;
  details?: Record<string, unknown>;
}

interface OpenRouterSuccessResult {
  modelName: string;
  finishReason: string | null;
  content: string;
  responseContentLength: number;
  generationId: string | null;
  httpStatus: number;
  retryAfter: string | null;
}

class GenerationDiagnosticError extends Error {
  diagnosticCode: DiagnosticCode;
  stage: GenerationStage;
  safeDetail: string;
  details?: Record<string, unknown>;

  constructor(input: {
    diagnosticCode: DiagnosticCode;
    stage: GenerationStage;
    safeDetail: string;
    details?: Record<string, unknown>;
  }) {
    super(input.safeDetail);
    this.name = "GenerationDiagnosticError";
    this.diagnosticCode = input.diagnosticCode;
    this.stage = input.stage;
    this.safeDetail = input.safeDetail;
    this.details = input.details;
  }
}

class OpenRouterRequestError extends GenerationDiagnosticError {
  constructor(input: {
    diagnosticCode:
      | "WORKOUT_PROVIDER_ERROR"
      | "WORKOUT_REQUEST_TIMEOUT"
      | "WORKOUT_EMPTY_RESPONSE"
      | "NUTRITION_PROVIDER_ERROR"
      | "NUTRITION_REQUEST_TIMEOUT"
      | "NUTRITION_EMPTY_RESPONSE";
    stage: GenerationStage;
    safeDetail: string;
    details?: Record<string, unknown>;
  }) {
    super(input);
    this.name = "OpenRouterRequestError";
  }
}

interface PersistedPlanDay {
  planDate: string;
  weekNumber: number;
  dayNumber: number;
  dayType: "workout" | "cardio" | "stretching" | "rest";
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
}

interface WorkoutSkeletonDay {
  dayNumber: number;
  dayType: "workout" | "cardio" | "stretching" | "rest";
  focusCategory: string;
  requiredExerciseCount: number;
  allowedExerciseIds: number[];
  candidateExercises: WorkoutExerciseCandidate[];
  trainerConsultationRequired: boolean;
}

interface WorkoutValidationIssue {
  dayNumber: number;
  issueType:
    | "exercise-count"
    | "invalid-exercise-id"
    | "duplicate-exercise-id"
    | "rest-day-has-exercises";
  message: string;
  invalidExerciseIds?: number[];
}

interface ExpandedWorkoutDay {
  weekNumber: number;
  dayNumber: number;
  dayType: "workout" | "cardio" | "stretching" | "rest";
  focusCategory: string | null;
  estimatedDurationMinutes: number | null;
  workoutNotes: string | null;
  exercises: Array<{
    exerciseId: number;
    sets: number | null;
    repetitions: string | null;
    durationMinutes: number | null;
    restSeconds: number | null;
    instructions: string | null;
  }>;
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function isDevelopmentEnvironment() {
  return process.env.NODE_ENV === "development";
}

function getConfiguredModelId() {
  return getRequiredEnv("OPENROUTER_MODEL");
}

function truncateDetail(detail: string, maxLength = 160) {
  const normalized = detail.trim().replace(/\s+/g, " ");
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3)}...`
    : normalized;
}

function createStageLogger() {
  const startedAt = Date.now();
  const entries: StageLogEntry[] = [];

  return {
    log(stage: GenerationStage, details?: Record<string, unknown>) {
      const entry = {
        stage,
        elapsedMs: Date.now() - startedAt,
        details,
      } satisfies StageLogEntry;

      entries.push(entry);

      if (isDevelopmentEnvironment()) {
        const detailSuffix = details ? ` ${JSON.stringify(details)}` : "";
        console.info(`[plan-generation] ${stage} +${entry.elapsedMs}ms${detailSuffix}`);
      }
    },
    entries,
  };
}

function mapZodIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

function isAbortTimeoutError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" ||
      error.name === "AbortError" ||
      /aborted|timeout/i.test(error.message))
  );
}

function getOpenRouterErrorBodyMessage(payload: unknown) {
  if (typeof payload === "string") {
    return truncateDetail(payload);
  }

  if (payload && typeof payload === "object") {
    if (
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
    ) {
      return truncateDetail(payload.error.message);
    }

    if ("message" in payload && typeof payload.message === "string") {
      return truncateDetail(payload.message);
    }
  }

  return "provider request failed";
}

function buildStoredErrorMessage(code: DiagnosticCode, detail: string) {
  return `${code}: ${truncateDetail(detail, 120)}`;
}

function toGenerationDiagnosticError(
  error: unknown,
  fallback: {
    diagnosticCode: DiagnosticCode;
    stage: GenerationStage;
    safeDetail: string;
    details?: Record<string, unknown>;
  },
) {
  if (error instanceof GenerationDiagnosticError) {
    return error;
  }

  const message = error instanceof Error ? truncateDetail(error.message) : fallback.safeDetail;

  return new GenerationDiagnosticError({
    ...fallback,
    safeDetail: message || fallback.safeDetail,
    details:
      fallback.details ?? (error instanceof Error ? { errorName: error.name } : undefined),
  });
}

function formatPgErrorDetail(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const code =
    "code" in error && typeof error.code === "string" ? error.code : null;
  const constraint =
    "constraint" in error && typeof error.constraint === "string"
      ? error.constraint
      : null;

  if (!code && !constraint) {
    return null;
  }

  return {
    code,
    constraint,
  };
}

function resolveFallbackDiagnostic(input: {
  error: unknown;
  workoutModelName: string | null;
  nutritionModelName: string | null;
  pgDetail: ReturnType<typeof formatPgErrorDetail>;
}) {
  if (isAbortTimeoutError(input.error)) {
    if (input.nutritionModelName) {
      return {
        diagnosticCode: "NUTRITION_REQUEST_TIMEOUT" as const,
        safeDetail: "nutrition request timed out",
      };
    }

    if (input.workoutModelName) {
      return {
        diagnosticCode: "WORKOUT_REQUEST_TIMEOUT" as const,
        safeDetail: "workout request timed out",
      };
    }
  }

  return {
    diagnosticCode: "DATABASE_SAVE_FAILED" as const,
    safeDetail: input.pgDetail?.code
      ? `database save failed (${input.pgDetail.code}${input.pgDetail.constraint ? `, ${input.pgDetail.constraint}` : ""})`
      : "database save failed",
  };
}

function extractMessageContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          (part as { type?: string }).type === "text" &&
          "text" in part &&
          typeof (part as { text?: unknown }).text === "string"
        ) {
          return (part as { text: string }).text;
        }

        return "";
      })
      .join("");
  }

  return "";
}

async function callStructuredOpenRouter(input: {
  phase: "workout" | "nutrition";
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: unknown;
}): Promise<OpenRouterSuccessResult> {
  const apiKey = getRequiredEnv("OPENROUTER_API_KEY");
  const modelName = getConfiguredModelId();
  let response: Response;

  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        stream: false,
        temperature: 0.15,
        provider: {
          sort: "latency",
          require_parameters: true,
          allow_fallbacks: true,
        },
        response_format: {
          type: "json_schema",
          json_schema: input.jsonSchema,
        },
        messages: [
          {
            role: "system",
            content: input.systemPrompt,
          },
          {
            role: "user",
            content: input.userPrompt,
          },
        ],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (isAbortTimeoutError(error)) {
      throw new OpenRouterRequestError({
        diagnosticCode:
          input.phase === "workout"
            ? "WORKOUT_REQUEST_TIMEOUT"
            : "NUTRITION_REQUEST_TIMEOUT",
        stage:
          input.phase === "workout"
            ? "workout-request-start"
            : "nutrition-request-start",
        safeDetail: `${input.phase} request timed out`,
        details: {
          configuredModelId: modelName,
        },
      });
    }

    throw error;
  }

  const generationId = response.headers.get("X-Generation-Id");
  const retryAfter = response.headers.get("Retry-After");

  if (!response.ok) {
    let errorBody: unknown = null;

    try {
      errorBody = await response.json();
    } catch {
      try {
        errorBody = await response.text();
      } catch {
        errorBody = null;
      }
    }

    throw new OpenRouterRequestError({
      diagnosticCode:
        input.phase === "workout"
          ? "WORKOUT_PROVIDER_ERROR"
          : "NUTRITION_PROVIDER_ERROR",
      stage:
        input.phase === "workout"
          ? "workout-response-received"
          : "nutrition-response-received",
      safeDetail: `${input.phase} provider error`,
      details: {
        phase: input.phase,
        configuredModelId: modelName,
        httpStatus: response.status,
        retryAfter,
        generationId,
        errorBody: getOpenRouterErrorBodyMessage(errorBody),
      },
    });
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      finish_reason?: string | null;
      message?: {
        content?: unknown;
      };
    }>;
  };
  const content = extractMessageContent(payload.choices?.[0]?.message?.content);

  if (!content.trim()) {
    throw new OpenRouterRequestError({
      diagnosticCode:
        input.phase === "workout"
          ? "WORKOUT_EMPTY_RESPONSE"
          : "NUTRITION_EMPTY_RESPONSE",
      stage:
        input.phase === "workout"
          ? "workout-response-received"
          : "nutrition-response-received",
      safeDetail: `${input.phase} response content was empty`,
      details: {
        phase: input.phase,
        configuredModelId: modelName,
        httpStatus: response.status,
        retryAfter,
        generationId,
        responseContentLength: content.length,
        finishReason: payload.choices?.[0]?.finish_reason ?? null,
      },
    });
  }

  return {
    modelName,
    finishReason: payload.choices?.[0]?.finish_reason ?? null,
    content,
    responseContentLength: content.length,
    generationId,
    httpStatus: response.status,
    retryAfter,
  };
}

async function requestStructuredWithRetry<T>(input: {
  phase: "workout" | "nutrition";
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: unknown;
  parse: (value: unknown) => T;
  logger: ReturnType<typeof createStageLogger>;
}) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await callStructuredOpenRouter(input);
      input.logger.log(
        input.phase === "workout"
          ? "workout-response-received"
          : "nutrition-response-received",
        {
          configuredModelId: response.modelName,
          httpStatus: response.httpStatus,
          retryAfter: response.retryAfter,
          generationId: response.generationId,
          responseContentLength: response.responseContentLength,
          finishReason: response.finishReason,
        },
      );

      let parsedJson: unknown;

      try {
        parsedJson = JSON.parse(response.content);
      } catch (error) {
        throw new GenerationDiagnosticError({
          diagnosticCode:
            input.phase === "workout"
              ? "WORKOUT_INVALID_JSON"
              : "NUTRITION_INVALID_JSON",
          stage:
            input.phase === "workout"
              ? "workout-json-parsed"
              : "nutrition-json-parsed",
          safeDetail: `${input.phase} response was not valid JSON`,
          details: {
            configuredModelId: response.modelName,
            httpStatus: response.httpStatus,
            generationId: response.generationId,
            responseContentLength: response.responseContentLength,
            finishReason: response.finishReason,
            errorName: error instanceof Error ? error.name : "UnknownError",
          },
        });
      }

      input.logger.log(
        input.phase === "workout"
          ? "workout-json-parsed"
          : "nutrition-json-parsed",
        {
          returnedWeekCount:
            parsedJson && typeof parsedJson === "object" && "weeks" in parsedJson &&
            Array.isArray(parsedJson.weeks)
              ? parsedJson.weeks.length
              : null,
          returnedDayCount:
            parsedJson && typeof parsedJson === "object"
              ? "days" in parsedJson && Array.isArray(parsedJson.days)
                ? parsedJson.days.length
                : "weeks" in parsedJson &&
                    Array.isArray(parsedJson.weeks)
                  ? parsedJson.weeks.reduce((total, week) => {
                      if (
                        week &&
                        typeof week === "object" &&
                        "days" in week &&
                        Array.isArray(week.days)
                      ) {
                        return total + week.days.length;
                      }

                      return total;
                    }, 0)
                  : null
              : null,
        },
      );

      let output: T;

      try {
        output = input.parse(parsedJson);
      } catch (error) {
        if (error instanceof ZodError) {
          throw new GenerationDiagnosticError({
            diagnosticCode:
              input.phase === "workout"
                ? "WORKOUT_SCHEMA_VALIDATION_FAILED"
                : "NUTRITION_SCHEMA_VALIDATION_FAILED",
            stage:
              input.phase === "workout"
                ? "workout-zod-validated"
                : "nutrition-zod-validated",
            safeDetail: `${input.phase} schema validation failed`,
            details: {
              zodIssues: mapZodIssues(error),
            },
          });
        }

        throw error;
      }

      input.logger.log(
        input.phase === "workout"
          ? "workout-zod-validated"
          : "nutrition-zod-validated",
        {
          returnedWeekCount:
            input.phase === "workout" &&
            output &&
            typeof output === "object" &&
            "weeks" in output &&
            Array.isArray(output.weeks)
              ? output.weeks.length
              : null,
          returnedDayCount:
            output &&
            typeof output === "object"
              ? "days" in output && Array.isArray(output.days)
                ? output.days.length
                : "weeks" in output &&
                    Array.isArray(output.weeks)
                  ? output.weeks.reduce((total, week) => total + week.days.length, 0)
                  : null
              : null,
        },
      );

      return {
        modelName: response.modelName,
        output,
        finishReason: response.finishReason,
        responseContentLength: response.responseContentLength,
        generationId: response.generationId,
        httpStatus: response.httpStatus,
        retryAfter: response.retryAfter,
      };
    } catch (error) {
      lastError = error;

      if (
        error instanceof GenerationDiagnosticError &&
        ![
          "WORKOUT_PROVIDER_ERROR",
          "WORKOUT_REQUEST_TIMEOUT",
          "NUTRITION_PROVIDER_ERROR",
          "NUTRITION_REQUEST_TIMEOUT",
        ].includes(error.diagnosticCode)
      ) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("OPENROUTER_UNKNOWN_ERROR");
}

function getYangonTodayIso(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Yangon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function addDaysToIsoDate(isoDate: string, daysToAdd: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + daysToAdd);
  return base.toISOString().slice(0, 10);
}

function subtractMinutesIso(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export function resolveRelevantExerciseCategories(focusCategory: string) {
  switch (focusCategory) {
    case "Full Body":
      return ["Full Body", "Chest", "Back", "Shoulders", "Legs", "Core"];
    case "Cardio":
      return ["Cardio"];
    case "Stretching":
      return ["Stretching"];
    case "Rest":
      return [];
    default:
      return [focusCategory];
  }
}

function trimWorkoutInstruction(instructions: string) {
  const normalized = instructions.trim().replace(/\s+/g, " ");
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
}

function compareWorkoutCandidates(
  left: WorkoutExerciseCandidate,
  right: WorkoutExerciseCandidate,
) {
  if (left.broadDislikeMatch !== right.broadDislikeMatch) {
    return Number(left.broadDislikeMatch) - Number(right.broadDislikeMatch);
  }

  const difficultyRank = new Map([
    ["beginner", 0],
    ["intermediate", 1],
    ["advanced", 2],
  ]);
  const leftDifficulty = difficultyRank.get(left.difficulty.toLocaleLowerCase("en-US")) ?? 3;
  const rightDifficulty = difficultyRank.get(right.difficulty.toLocaleLowerCase("en-US")) ?? 3;

  if (leftDifficulty !== rightDifficulty) {
    return leftDifficulty - rightDifficulty;
  }

  if (left.requiredEquipmentNames.length !== right.requiredEquipmentNames.length) {
    return left.requiredEquipmentNames.length - right.requiredEquipmentNames.length;
  }

  return left.name.localeCompare(right.name, "en-US");
}

function selectWorkoutCandidatesForDay(
  day: {
    focusCategory: string;
    exerciseCount?: number;
  },
  candidates: WorkoutExerciseCandidate[],
) {
  const allowedCategories = new Set(resolveRelevantExerciseCategories(day.focusCategory));
  return candidates
    .filter((candidate) => allowedCategories.has(candidate.category))
    .sort(compareWorkoutCandidates);
}

function appendTrainerConsultationNote(note: string | null) {
  const suffix = "မသက်သာမှုရှိရင် gym trainer နဲ့ တိုင်ပင်ပါ။";
  const base = note?.trim();

  if (!base) {
    return suffix;
  }

  if (base.includes(suffix)) {
    return base;
  }

  return `${base} ${suffix}`;
}

function buildWorkoutSkeletonDays(
  context: PlanGenerationContext,
  candidates: WorkoutExerciseCandidate[],
  logger?: ReturnType<typeof createStageLogger>,
) {
  return context.workoutTemplate.days.map<WorkoutSkeletonDay>((day) => {
    if (day.planDayType === "rest") {
      return {
        dayNumber: day.dayNumber,
        dayType: day.planDayType,
        focusCategory: day.focusCategory,
        requiredExerciseCount: 0,
        allowedExerciseIds: [],
        candidateExercises: [],
        trainerConsultationRequired: false,
      };
    }

    const matchingCandidates = selectWorkoutCandidatesForDay(day, candidates);
    const exactDislikeRemoved = matchingCandidates.filter(
      (candidate) => candidate.exactDislikeMatch,
    );
    const preferredCandidates = matchingCandidates.filter(
      (candidate) => !candidate.exactDislikeMatch,
    );

    let trainerConsultationRequired = false;
    let finalCandidates = preferredCandidates;

    if (finalCandidates.length < day.exerciseCount) {
      const restoredCandidates = exactDislikeRemoved
        .slice()
        .sort(compareWorkoutCandidates)
        .slice(0, day.exerciseCount - finalCandidates.length);

      if (restoredCandidates.length > 0) {
        finalCandidates = [...finalCandidates, ...restoredCandidates];
        trainerConsultationRequired = true;
      }
    }

    const cappedCandidates = finalCandidates.slice(0, Math.min(15, finalCandidates.length));
    const dayCandidates = cappedCandidates.map((candidate) => ({
      ...candidate,
      instructions: trimWorkoutInstruction(candidate.instructions),
    }));

    if (isDevelopmentEnvironment()) {
      logger?.log("exercise-candidates-loaded", {
        dayNumber: day.dayNumber,
        focusCategory: day.focusCategory,
        candidatesBeforeDislikeFiltering: matchingCandidates.length,
        dislikedValues: context.assessmentInput.dislikedExercises,
        candidatesRemoved: exactDislikeRemoved.map((candidate) => candidate.name),
        finalCandidateCount: dayCandidates.length,
        requiredCount: day.exerciseCount,
      });
    }

    return {
      dayNumber: day.dayNumber,
      dayType: day.planDayType,
      focusCategory: day.focusCategory,
      requiredExerciseCount: day.exerciseCount,
      allowedExerciseIds: dayCandidates.map((candidate) => candidate.id),
      candidateExercises: dayCandidates,
      trainerConsultationRequired,
    };
  });
}

function buildWorkoutGenerationDaySpecs(days: WorkoutSkeletonDay[]): WorkoutGenerationDaySpec[] {
  return days.map((day) => ({
    dayNumber: day.dayNumber,
    requiredExerciseCount: day.requiredExerciseCount,
  }));
}

function validatePlanGenerationContext(context: PlanGenerationContext | null): {
  ok: true;
  context: PlanGenerationContext;
} | {
  ok: false;
  reason: PlanFailureReason;
} {
  if (!context) {
    return {
      ok: false,
      reason: "missing-profile",
    };
  }

  if (!context.bodyGoal.id) {
    return {
      ok: false,
      reason: "missing-body-goal",
    };
  }

  if (!context.workoutTemplate.id) {
    return {
      ok: false,
      reason: "missing-workout-template",
    };
  }

  if (!context.nutritionTemplate.id) {
    return {
      ok: false,
      reason: "missing-nutrition-template",
    };
  }

  const sortedDays = [...context.workoutTemplate.days].sort(
    (left, right) => left.dayNumber - right.dayNumber,
  );

  if (
    sortedDays.length !== 7 ||
    sortedDays.some((day, index) => day.dayNumber !== index + 1)
  ) {
    return {
      ok: false,
      reason: "invalid-workout-template",
    };
  }

  return {
    ok: true,
    context: {
      ...context,
      workoutTemplate: {
        ...context.workoutTemplate,
        days: sortedDays,
      },
    },
  };
}

function buildWorkoutSkeletonDayIndex(days: WorkoutSkeletonDay[]) {
  return new Map(days.map((day) => [day.dayNumber, day] as const));
}

function buildCandidateIndex(candidates: WorkoutExerciseCandidate[]) {
  return new Map(candidates.map((candidate) => [candidate.id, candidate]));
}

function buildFoodIndex(candidates: NutritionPlanCandidateFood[]) {
  return new Map(candidates.map((candidate) => [candidate.id, candidate]));
}

function collectWorkoutValidationIssues(input: {
  workoutWeek: WorkoutBaseWeekResponse;
  skeletonDays: WorkoutSkeletonDay[];
  candidateById: Map<number, WorkoutExerciseCandidate>;
}) {
  const skeletonDayIndex = buildWorkoutSkeletonDayIndex(input.skeletonDays);
  const issues: WorkoutValidationIssue[] = [];
  const seenDayNumbers = new Set<number>();

  if (input.workoutWeek.days.length !== input.skeletonDays.length) {
    throw new Error("INVALID_WORKOUT_DAY_NUMBER");
  }

  for (const day of input.workoutWeek.days) {
    const skeletonDay = skeletonDayIndex.get(day.dayNumber);

    if (!skeletonDay) {
      throw new Error("UNKNOWN_TEMPLATE_DAY");
    }

    if (seenDayNumbers.has(day.dayNumber)) {
      throw new Error("INVALID_WORKOUT_DAY_NUMBER");
    }

    seenDayNumbers.add(day.dayNumber);

    if (skeletonDay.requiredExerciseCount === 0 && day.exercises.length > 0) {
      issues.push({
        dayNumber: day.dayNumber,
        issueType: "rest-day-has-exercises",
        message: "REST_DAY_HAS_EXERCISES",
      });
      continue;
    }

    if (day.exercises.length !== skeletonDay.requiredExerciseCount) {
      issues.push({
        dayNumber: day.dayNumber,
        issueType: "exercise-count",
        message: "EXERCISE_COUNT_MISMATCH",
      });
    }

    const seenExerciseIds = new Set<number>();
    const allowedExerciseIds = new Set(skeletonDay.allowedExerciseIds);

    for (const exercise of day.exercises) {
      if (!allowedExerciseIds.has(exercise.exerciseId) || !input.candidateById.has(exercise.exerciseId)) {
        issues.push({
          dayNumber: day.dayNumber,
          issueType: "invalid-exercise-id",
          message: "UNKNOWN_WORKOUT_EXERCISE",
          invalidExerciseIds: [exercise.exerciseId],
        });
      }

      if (seenExerciseIds.has(exercise.exerciseId)) {
        issues.push({
          dayNumber: day.dayNumber,
          issueType: "duplicate-exercise-id",
          message: "DUPLICATE_WORKOUT_EXERCISE",
          invalidExerciseIds: [exercise.exerciseId],
        });
      }

      seenExerciseIds.add(exercise.exerciseId);
    }
  }

  return issues;
}

function isRepairableWorkoutIssue(issue: WorkoutValidationIssue) {
  return [
    "exercise-count",
    "invalid-exercise-id",
    "duplicate-exercise-id",
    "rest-day-has-exercises",
  ].includes(issue.issueType);
}

function assertWorkoutWeekValid(input: {
  workoutWeek: WorkoutBaseWeekResponse;
  skeletonDays: WorkoutSkeletonDay[];
  candidateById: Map<number, WorkoutExerciseCandidate>;
}) {
  const issues = collectWorkoutValidationIssues(input);

  if (issues.length === 0) {
    return;
  }

  const invalidExerciseIds = issues.flatMap((issue) => issue.invalidExerciseIds ?? []);
  const validationIssue = issues[0]?.message ?? "WORKOUT_VALIDATION_FAILED";

  throw new GenerationDiagnosticError({
    diagnosticCode: "WORKOUT_ID_VALIDATION_FAILED",
    stage: "workout-database-validated",
    safeDetail: validationIssue,
    details: {
      validationIssue,
      invalidExerciseIds: invalidExerciseIds.length > 0 ? invalidExerciseIds : undefined,
    },
  });
}

export function validateNutritionPlanResponse(input: {
  nutritionPlan: NutritionPlanResponse;
  context: PlanGenerationContext;
  foodById: Map<number, NutritionPlanCandidateFood>;
}) {
  const requiredMealTypes = [...input.context.nutritionTemplate.mealStructure];

  if (input.nutritionPlan.days.length !== 7) {
    throw new Error("INVALID_NUTRITION_TOTAL_DAYS");
  }

  const sortedDayNumbers = input.nutritionPlan.days
    .map((day) => day.dayNumber)
    .sort((left, right) => left - right);

  if (sortedDayNumbers.some((value, index) => value !== index + 1)) {
    throw new Error("INVALID_NUTRITION_DAY_NUMBER");
  }

  for (const day of input.nutritionPlan.days) {
    const mealTypes = day.meals.map((meal) => meal.mealType);

    if (mealTypes.length === 0) {
      throw new Error("EMPTY_MEAL_STRUCTURE");
    }

    if (mealTypes.join("|") !== requiredMealTypes.join("|")) {
      throw new Error("MEAL_STRUCTURE_MISMATCH");
    }

    for (const meal of day.meals) {
      if (meal.items.length === 0) {
        throw new Error("EMPTY_MEAL_ITEMS");
      }

      for (const item of meal.items) {
        const food = input.foodById.get(item.foodId);

        if (!food) {
          throw new GenerationDiagnosticError({
            diagnosticCode: "NUTRITION_ID_VALIDATION_FAILED",
            stage: "nutrition-database-validated",
            safeDetail: "nutrition plan referenced an invalid food ID",
            details: {
              invalidFoodIds: [item.foodId],
              dayNumber: day.dayNumber,
              mealType: meal.mealType,
            },
          });
        }

        if (
          foodConflictsWithPreferences(food, {
            foodAllergies: input.context.assessmentInput.foodAllergies,
            foodRestrictions: input.context.assessmentInput.foodRestrictions,
            dislikedFoods: input.context.assessmentInput.dislikedFoods,
          })
        ) {
          throw new Error("CONFLICTING_FOOD_SELECTED");
        }
      }
    }
  }
}

function combineWorkoutAndNutritionPlans(input: {
  startDate: string;
  workoutDays: ExpandedWorkoutDay[];
  nutritionPlan: NutritionPlanResponse;
}): PersistedPlanDay[] {
  const nutritionByDayNumber = new Map(
    input.nutritionPlan.days.map((day) => [day.dayNumber, day] as const),
  );
  const combined: PersistedPlanDay[] = [];

  for (const [index, day] of input.workoutDays.entries()) {
    const nutritionDay = nutritionByDayNumber.get(day.dayNumber);

    if (!nutritionDay) {
      throw new Error("MISSING_NUTRITION_ROTATION_DAY");
    }

    combined.push({
      planDate: addDaysToIsoDate(input.startDate, index),
      weekNumber: day.weekNumber,
      dayNumber: day.dayNumber,
      dayType: day.dayType,
      focusCategory: day.focusCategory,
      estimatedDurationMinutes: day.estimatedDurationMinutes,
      workoutNotes: day.workoutNotes,
      nutritionNotes: nutritionDay.nutritionNotes,
      exercises: day.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        sets: exercise.sets,
        repetitions: exercise.repetitions,
        durationMinutes: exercise.durationMinutes,
        restSeconds: exercise.restSeconds,
        instructions: exercise.instructions,
      })),
      meals: nutritionDay.meals.map((meal) => ({
        mealType: meal.mealType,
        items: meal.items.map((item) => ({
          foodId: item.foodId,
          servingDescription: item.servingDescription,
          notes: item.notes,
        })),
      })),
    });
  }

  return combined;
}

function mergeWorkoutDays(
  baseWeek: WorkoutBaseWeekResponse,
  repairedWeek: WorkoutBaseWeekResponse,
) {
  const repairedDayIndex = new Map(
    repairedWeek.days.map((day) => [day.dayNumber, day] as const),
  );

  return {
    days: baseWeek.days.map((day) => repairedDayIndex.get(day.dayNumber) ?? day),
  } satisfies WorkoutBaseWeekResponse;
}

function buildWorkoutRepairPayload(input: {
  skeletonDays: WorkoutSkeletonDay[];
  issues: WorkoutValidationIssue[];
}) {
  const invalidDayNumbers = [...new Set(input.issues.map((issue) => issue.dayNumber))].sort(
    (left, right) => left - right,
  );
  const invalidDayNumberSet = new Set(invalidDayNumbers);

  return {
    invalidDayNumbers,
    invalidDays: input.skeletonDays
      .filter((day) => invalidDayNumberSet.has(day.dayNumber))
      .map((day) => ({
        ...day,
        validationIssues: input.issues
          .filter((issue) => issue.dayNumber === day.dayNumber)
          .map((issue) => issue.message),
      })),
  };
}

function parseRepetitionRange(repetitions: string) {
  const match = repetitions.match(/^(\d+)(?:\s*-\s*(\d+))?$/);

  if (!match) {
    return null;
  }

  const minimum = Number(match[1]);
  const maximum = match[2] ? Number(match[2]) : null;

  return {
    minimum,
    maximum,
  };
}

function progressRepetitions(repetitions: string, amount: number) {
  const parsed = parseRepetitionRange(repetitions);

  if (!parsed) {
    return repetitions;
  }

  if (parsed.maximum === null) {
    return String(Math.max(1, parsed.minimum + amount));
  }

  return `${Math.max(1, parsed.minimum)}-${Math.max(1, parsed.maximum + amount)}`;
}

function createFallbackWorkoutNote(day: WorkoutSkeletonDay) {
  switch (day.dayType) {
    case "rest":
      return "အနားယူပြီး ခန္ဓာကိုယ်ပြန်လည်သက်သာအောင် နေပါ။";
    case "cardio":
      return `${day.focusCategory} ကို အလယ်အလတ်အရှိန်နဲ့ လုပ်ပါ။`;
    case "stretching":
      return `${day.focusCategory} ကို ဖြည်းဖြည်းနဲ့ ထိန်းပြီး လုပ်ပါ။`;
    default:
      return `${day.focusCategory} ကို ပုံစံမှန်အောင် ထိန်းပြီး လုပ်ပါ။`;
  }
}

function createFallbackWorkoutWeek(days: WorkoutSkeletonDay[]) {
  for (const day of days) {
    if (day.requiredExerciseCount > day.candidateExercises.length) {
      throw new GenerationDiagnosticError({
        diagnosticCode: "NO_EXERCISE_CANDIDATES",
        stage: "exercise-candidates-loaded",
        safeDetail: `not enough eligible exercises for day ${day.dayNumber}`,
      });
    }
  }

    return {
      days: days.map((day) => ({
        dayNumber: day.dayNumber,
      workoutNotes: day.trainerConsultationRequired
        ? appendTrainerConsultationNote(createFallbackWorkoutNote(day))
        : createFallbackWorkoutNote(day),
      estimatedDurationMinutes:
        day.dayType === "rest"
          ? null
          : day.dayType === "stretching"
            ? 20
            : day.dayType === "cardio"
              ? 30
              : Math.max(30, day.requiredExerciseCount * 10),
      exercises:
        day.dayType === "rest"
          ? []
          : day.candidateExercises.slice(0, day.requiredExerciseCount).map((candidate) => ({
              exerciseId: candidate.id,
              sets: candidate.defaultSets,
              repetitions:
                candidate.defaultSets === null
                  ? null
                  : candidate.defaultRepetitionsOrDuration,
              durationMinutes:
                candidate.defaultSets === null
                  ? Number.parseInt(candidate.defaultRepetitionsOrDuration, 10) || null
                  : null,
              restSeconds: candidate.defaultSets === null ? null : 60,
              instructions:
                candidate.instructions.trim() ||
                "ဖြည်းဖြည်းနဲ့ ပုံစံမှန်အောင် လုပ်ပါ။",
            })),
    })),
  } satisfies WorkoutBaseWeekResponse;
}

function applyExerciseProgression(
  exercise: ExpandedWorkoutDay["exercises"][number],
  weekNumber: number,
  exerciseIndex: number,
  difficulty: string,
) {
  const progressed = {
    ...exercise,
  };

  if (weekNumber === 1) {
    return progressed;
  }

  if (progressed.repetitions) {
    if (weekNumber >= 2 && exerciseIndex % 2 === 0) {
      progressed.repetitions = progressRepetitions(progressed.repetitions, 1);
    }
  }

  if (progressed.durationMinutes !== null) {
    if (weekNumber >= 2) {
      progressed.durationMinutes = Math.max(1, progressed.durationMinutes + 5);
    }

    if (weekNumber === 4 && /beginner/i.test(difficulty)) {
      progressed.durationMinutes = Math.max(1, progressed.durationMinutes - 5);
    }
  }

  if (weekNumber === 3 && progressed.sets !== null && exerciseIndex === 0) {
    progressed.sets += 1;
  }

  if (weekNumber === 4 && /beginner/i.test(difficulty) && progressed.sets !== null && exerciseIndex === 0) {
    progressed.sets = Math.max(1, progressed.sets - 1);
  }

  if (progressed.restSeconds !== null) {
    progressed.restSeconds = Math.max(0, progressed.restSeconds);
  }

  return progressed;
}

export function expandBaseWeekToFourWeeks(input: {
  baseWeek: WorkoutBaseWeekResponse;
  skeletonDays: WorkoutSkeletonDay[];
  difficulty: string;
}) {
  const skeletonDayIndex = buildWorkoutSkeletonDayIndex(input.skeletonDays);
  const expanded: ExpandedWorkoutDay[] = [];

  for (let weekNumber = 1; weekNumber <= 4; weekNumber += 1) {
    for (const baseDay of input.baseWeek.days) {
      const skeletonDay = skeletonDayIndex.get(baseDay.dayNumber);

      if (!skeletonDay) {
        throw new Error("UNKNOWN_TEMPLATE_DAY");
      }

      const estimatedDurationMinutes =
        skeletonDay.dayType === "rest"
          ? null
          : weekNumber === 2
            ? (baseDay.estimatedDurationMinutes ?? 0) + 5
            : weekNumber === 3
              ? (baseDay.estimatedDurationMinutes ?? 0) + 10
              : weekNumber === 4 && /beginner/i.test(input.difficulty)
                ? Math.max(0, (baseDay.estimatedDurationMinutes ?? 0) + 5)
                : weekNumber === 4
                  ? (baseDay.estimatedDurationMinutes ?? 0) + 10
                  : baseDay.estimatedDurationMinutes;

      expanded.push({
        weekNumber,
        dayNumber: baseDay.dayNumber,
        dayType: skeletonDay.dayType,
        focusCategory: skeletonDay.focusCategory,
        estimatedDurationMinutes,
        workoutNotes: skeletonDay.trainerConsultationRequired
          ? appendTrainerConsultationNote(baseDay.workoutNotes)
          : baseDay.workoutNotes,
        exercises:
          skeletonDay.dayType === "rest"
            ? []
            : baseDay.exercises.map((exercise, exerciseIndex) =>
                applyExerciseProgression(
                  exercise,
                  weekNumber,
                  exerciseIndex,
                  input.difficulty,
                ),
              ),
      });
    }
  }

  if (expanded.length !== 28) {
    throw new Error("INVALID_WORKOUT_TOTAL_DAYS");
  }

  for (const day of expanded) {
    const skeletonDay = skeletonDayIndex.get(day.dayNumber);

    if (!skeletonDay) {
      throw new Error("UNKNOWN_TEMPLATE_DAY");
    }

    if (skeletonDay.dayType === "rest" && day.exercises.length > 0) {
      throw new Error("REST_DAY_HAS_EXERCISES");
    }
  }

  return expanded;
}

async function generateWorkoutWeek(input: {
  context: PlanGenerationContext;
  skeletonDays: WorkoutSkeletonDay[];
  schemaName?: string;
  logger: ReturnType<typeof createStageLogger>;
}) {
  const daySpecs = buildWorkoutGenerationDaySpecs(input.skeletonDays);
  const workoutSchema = createWorkoutBaseWeekSchema(daySpecs);

  return requestStructuredWithRetry({
    phase: "workout",
    systemPrompt: workoutPlanSystemPrompt,
    userPrompt: buildWorkoutPlanUserPrompt({
      profile: input.context.profileSnapshot,
      latestAssessment: input.context.latestAssessment,
      workoutPlanSkeleton: input.skeletonDays,
    }),
    jsonSchema: createWorkoutBaseWeekJsonSchema(
      daySpecs,
      input.schemaName ?? "seven_day_workout_base_week",
    ),
    parse: (value) => workoutSchema.parse(value),
    logger: input.logger,
  });
}

async function repairWorkoutWeek(input: {
  context: PlanGenerationContext;
  invalidDays: Array<
    WorkoutSkeletonDay & {
      validationIssues: string[];
    }
  >;
  logger: ReturnType<typeof createStageLogger>;
}) {
  const daySpecs = buildWorkoutGenerationDaySpecs(input.invalidDays);
  const repairSchema = createWorkoutBaseWeekSchema(daySpecs);

  return requestStructuredWithRetry({
    phase: "workout",
    systemPrompt: workoutPlanSystemPrompt,
    userPrompt: buildWorkoutRepairUserPrompt({
      profile: input.context.profileSnapshot,
      latestAssessment: input.context.latestAssessment,
      invalidDays: input.invalidDays,
    }),
    jsonSchema: createWorkoutBaseWeekJsonSchema(
      daySpecs,
      "repair_workout_base_week_days",
    ),
    parse: (value) => repairSchema.parse(value),
    logger: input.logger,
  });
}

async function generateNutritionPlan(input: {
  context: PlanGenerationContext;
  approvedFoods: NutritionPlanCandidateFood[];
  logger: ReturnType<typeof createStageLogger>;
}) {
  return requestStructuredWithRetry({
    phase: "nutrition",
    systemPrompt: nutritionPlanSystemPrompt,
    userPrompt: buildNutritionPlanUserPrompt({
      profile: input.context.profileSnapshot,
      latestAssessment: input.context.latestAssessment,
      nutritionTemplate: input.context.nutritionTemplate,
      approvedFoods: input.approvedFoods,
    }),
    jsonSchema: nutritionPlanJsonSchema,
    parse: (value) => nutritionPlanSchema.parse(value),
    logger: input.logger,
  });
}

function mapFailureMessage(reason: PlanFailureReason) {
  switch (reason) {
    case "missing-profile":
      return "Profile အချက်အလက် မပြည့်စုံသေးပါ။";
    case "missing-body-goal":
      return "Body Goal မရွေးရသေးပါ။";
    case "missing-workout-template":
      return "Workout template မရှိသေးပါ။";
    case "missing-nutrition-template":
      return "Nutrition template မရှိသေးပါ။";
    case "invalid-workout-template":
      return "Workout template အချက်အလက် မပြည့်စုံပါ။";
    case "no-exercise-candidates":
      return "အသုံးပြုနိုင်သော exercise မရှိသေးပါ။";
    case "no-food-candidates":
      return "အသုံးပြုနိုင်သော food data မရှိသေးပါ။";
    case "duplicate-generation":
      return "Plan ပြုလုပ်နေဆဲ ဖြစ်ပါသည်။";
    default:
      return "တစ်လစာ Plan ကို ယခု မပြုလုပ်နိုင်သေးပါ။ ခဏအကြာတွင် ပြန်လည်ကြိုးစားပါ။";
  }
}

export async function generateFourWeekPlanForUser(userId: string) {
  const logger = createStageLogger();
  logger.log("generation-start", {
    configuredModelId: process.env.OPENROUTER_MODEL ?? null,
  });

  let planId: number | null = null;
  let workoutModelName: string | null = null;
  let nutritionModelName: string | null = null;

  try {
    const rawContext = await getPlanGenerationContext(userId);
    logger.log("profile-loaded");

    const contextCheck = validatePlanGenerationContext(rawContext);

    if (!contextCheck.ok) {
      const diagnosticCode: DiagnosticCode =
        contextCheck.reason === "missing-workout-template"
          ? "MISSING_WORKOUT_TEMPLATE"
          : contextCheck.reason === "missing-nutrition-template"
            ? "MISSING_NUTRITION_TEMPLATE"
            : "INPUT_LOADING_FAILED";

      throw new GenerationDiagnosticError({
        diagnosticCode,
        stage:
          diagnosticCode === "MISSING_WORKOUT_TEMPLATE" ||
          diagnosticCode === "MISSING_NUTRITION_TEMPLATE"
            ? "templates-loaded"
            : "profile-loaded",
        safeDetail: contextCheck.reason,
      });
    }

    const context = contextCheck.context;
    logger.log("templates-loaded");

    const { normalizedInput, inputHash } = createAssessmentInputHash(context.assessmentInput);
    const startDate = getYangonTodayIso();
    const endDate = addDaysToIsoDate(startDate, 27);

    await markStaleGeneratingPlansFailed(
      userId,
      subtractMinutesIso(STALE_GENERATION_MINUTES),
    );

    const existingGeneratingPlan = await findGeneratingPlanForUser(userId);

    if (existingGeneratingPlan) {
      return {
        ok: false as const,
        reason: "duplicate-generation" as const,
        message: mapFailureMessage("duplicate-generation"),
      };
    }

    const focusCategories = [...new Set(
      context.workoutTemplate.days.flatMap((day) =>
        resolveRelevantExerciseCategories(day.focusCategory),
      ),
    )];
    const allCandidates = await listEligibleWorkoutCandidates(
      focusCategories,
      context.assessmentInput.dislikedExercises,
    );
    const skeletonDays = buildWorkoutSkeletonDays(context, allCandidates, logger);
    logger.log("exercise-candidates-loaded", {
      exerciseCandidateCount: allCandidates.length,
    });

    const insufficientCandidateDays = skeletonDays.filter(
      (day) => day.requiredExerciseCount > day.candidateExercises.length,
    );

    if (insufficientCandidateDays.length > 0) {
      throw new GenerationDiagnosticError({
        diagnosticCode: "NO_EXERCISE_CANDIDATES",
        stage: "exercise-candidates-loaded",
        safeDetail: "no eligible exercises found for one or more template days",
        details: {
          exerciseCandidateCount: allCandidates.length,
          invalidDayNumbers: insufficientCandidateDays.map((day) => day.dayNumber),
        },
      });
    }

    const approvedFoods = await listApprovedFoods(context.assessmentInput);
    logger.log("food-candidates-loaded", {
      foodCandidateCount: approvedFoods.length,
    });

    if (approvedFoods.length === 0) {
      throw new GenerationDiagnosticError({
        diagnosticCode: "NO_FOOD_CANDIDATES",
        stage: "food-candidates-loaded",
        safeDetail: "no approved foods available after filtering",
        details: {
          foodCandidateCount: approvedFoods.length,
        },
      });
    }

    planId = await insertGeneratingPlan({
      userId,
      aiAssessmentId: context.latestAssessmentId,
      bodyGoalId: context.bodyGoal.id,
      workoutTemplateId: context.workoutTemplate.id,
      nutritionTemplateId: context.nutritionTemplate.id,
      sourceInputHash: inputHash,
      profileSnapshot: {
        ...normalizedInput,
        latestAssessment: context.latestAssessment,
      },
      startDate,
      endDate,
    });

    workoutModelName = getConfiguredModelId();
    const candidateById = buildCandidateIndex(allCandidates);
    let workoutWeek: WorkoutBaseWeekResponse;
    let workoutResult:
      | Awaited<ReturnType<typeof generateWorkoutWeek>>
      | null = null;

    logger.log("workout-request-start", {
      configuredModelId: workoutModelName,
    });

    try {
      workoutResult = await generateWorkoutWeek({
        context,
        skeletonDays,
        logger,
      });

      const baseIssues = collectWorkoutValidationIssues({
        workoutWeek: workoutResult.output,
        skeletonDays,
        candidateById,
      });

      if (baseIssues.length === 0) {
        workoutWeek = workoutResult.output;
      } else if (baseIssues.every(isRepairableWorkoutIssue)) {
        const repairPayload = buildWorkoutRepairPayload({
          skeletonDays,
          issues: baseIssues,
        });

        logger.log("workout-request-start", {
          configuredModelId: workoutModelName,
          requestType: "repair",
          invalidDayNumbers: repairPayload.invalidDayNumbers,
        });

        const repairResult = await repairWorkoutWeek({
          context,
          invalidDays: repairPayload.invalidDays,
          logger,
        });

        const mergedWorkoutWeek = mergeWorkoutDays(
          workoutResult.output,
          repairResult.output,
        );
        const repairedIssues = collectWorkoutValidationIssues({
          workoutWeek: mergedWorkoutWeek,
          skeletonDays,
          candidateById,
        });

        if (repairedIssues.length > 0) {
          throw new GenerationDiagnosticError({
            diagnosticCode: "WORKOUT_ID_VALIDATION_FAILED",
            stage: "workout-database-validated",
            safeDetail: repairedIssues[0]?.message ?? "WORKOUT_VALIDATION_FAILED",
            details: {
              validationIssue: repairedIssues[0]?.message ?? "WORKOUT_VALIDATION_FAILED",
              invalidDayNumbers: repairPayload.invalidDayNumbers,
            },
          });
        }

        workoutWeek = mergedWorkoutWeek;
      } else {
        throw new GenerationDiagnosticError({
          diagnosticCode: "WORKOUT_ID_VALIDATION_FAILED",
          stage: "workout-database-validated",
          safeDetail: baseIssues[0]?.message ?? "WORKOUT_VALIDATION_FAILED",
          details: {
            validationIssue: baseIssues[0]?.message ?? "WORKOUT_VALIDATION_FAILED",
          },
        });
      }
    } catch (error) {
      if (insufficientCandidateDays.length > 0) {
        throw error;
      }

      workoutWeek = createFallbackWorkoutWeek(skeletonDays);
      workoutModelName = "template-fallback";
      logger.log("workout-database-validated", {
        returnedWeekCount: 1,
        returnedDayCount: workoutWeek.days.length,
        fallbackUsed: true,
        fallbackReason: error instanceof Error ? error.message : "fallback",
      });
    }

    assertWorkoutWeekValid({
      workoutWeek,
      skeletonDays,
      candidateById,
    });

    if (workoutModelName !== "template-fallback") {
      logger.log("workout-database-validated", {
        returnedWeekCount: 1,
        returnedDayCount: workoutWeek.days.length,
        finishReason: workoutResult?.finishReason ?? null,
        generationId: workoutResult?.generationId ?? null,
        httpStatus: workoutResult?.httpStatus ?? null,
      });
    }

    nutritionModelName = getConfiguredModelId();
    logger.log("nutrition-request-start", {
      configuredModelId: nutritionModelName,
    });
    const nutritionResult = await generateNutritionPlan({
      context,
      approvedFoods,
      logger,
    });

    const foodById = buildFoodIndex(approvedFoods);

    try {
      validateNutritionPlanResponse({
        nutritionPlan: nutritionResult.output,
        context,
        foodById,
      });
    } catch (error) {
      if (error instanceof GenerationDiagnosticError) {
        throw error;
      }

      throw new GenerationDiagnosticError({
        diagnosticCode: "NUTRITION_ID_VALIDATION_FAILED",
        stage: "nutrition-database-validated",
        safeDetail: error instanceof Error ? error.message : "nutrition validation failed",
        details: {
          validationIssue: error instanceof Error ? error.message : "nutrition validation failed",
        },
      });
    }

    logger.log("nutrition-database-validated", {
      returnedDayCount: nutritionResult.output.days.length,
      finishReason: nutritionResult.finishReason,
      generationId: nutritionResult.generationId,
      httpStatus: nutritionResult.httpStatus,
    });

    const expandedWorkoutDays = expandBaseWeekToFourWeeks({
      baseWeek: workoutWeek,
      skeletonDays,
      difficulty: context.workoutTemplate.difficulty,
    });
    const persistedDays = combineWorkoutAndNutritionPlans({
      startDate,
      workoutDays: expandedWorkoutDays,
      nutritionPlan: nutritionResult.output,
    });

    logger.log("database-transaction-start");
    await activateGeneratedPlan({
      planId,
      userId,
      workoutModelName,
      nutritionModelName: nutritionResult.modelName,
      onPlanDaysInserted: ({ insertedRowCount }) => {
        logger.log("plan-days-inserted", {
          insertedRowCount,
        });
      },
      onExercisesInserted: ({ insertedRowCount }) => {
        logger.log("exercises-inserted", {
          insertedRowCount,
        });
      },
      onMealItemsInserted: ({ insertedRowCount }) => {
        logger.log("meal-items-inserted", {
          insertedRowCount,
        });
      },
      onCommitted: () => {
        logger.log("database-transaction-committed");
      },
      days: persistedDays,
    });

    return {
      ok: true as const,
      planId,
      startDate,
      endDate,
      diagnostics: logger.entries,
    };
  } catch (error) {
    const pgDetail = formatPgErrorDetail(error);
    const fallbackDiagnostic = resolveFallbackDiagnostic({
      error,
      workoutModelName,
      nutritionModelName,
      pgDetail,
    });
    const diagnosticError = toGenerationDiagnosticError(error, {
      diagnosticCode: fallbackDiagnostic.diagnosticCode,
      stage: "generation-failed",
      safeDetail: fallbackDiagnostic.safeDetail,
      details:
        pgDetail
          ? {
              postgresErrorCode: pgDetail.code,
              postgresConstraintName: pgDetail.constraint,
            }
          : undefined,
    });

    logger.log("generation-failed", {
      diagnosticCode: diagnosticError.diagnosticCode,
      errorStage: diagnosticError.stage,
      safeDetail: diagnosticError.safeDetail,
      ...diagnosticError.details,
      ...(pgDetail
        ? {
            postgresErrorCode: pgDetail.code,
            postgresConstraintName: pgDetail.constraint,
          }
        : {}),
    });

    if (planId !== null) {
      await markGeneratedPlanFailed({
        planId,
        errorMessage: buildStoredErrorMessage(
          diagnosticError.diagnosticCode,
          diagnosticError.safeDetail,
        ),
        workoutModelName,
        nutritionModelName,
      });
    }

    return {
      ok: false as const,
      reason: "generation-failed" as const,
      message: mapFailureMessage("generation-failed"),
      diagnosticCode: diagnosticError.diagnosticCode,
      diagnostics: logger.entries,
    };
  }
}

export const __testing__ = {
  buildWorkoutGenerationDaySpecs,
  buildWorkoutRepairPayload,
  buildWorkoutSkeletonDays,
  combineWorkoutAndNutritionPlans,
  collectWorkoutValidationIssues,
  createFallbackWorkoutWeek,
  expandBaseWeekToFourWeeks,
  foodConflictsWithPreferences,
  getYangonTodayIso,
  mergeWorkoutDays,
  resolveRelevantExerciseCategories,
  validatePlanGenerationContext,
  validateNutritionPlanResponse,
  assertWorkoutWeekValid,
};
