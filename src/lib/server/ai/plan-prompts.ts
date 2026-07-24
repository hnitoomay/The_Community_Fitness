import "server-only";

import type {
  NutritionPlanCandidateFood,
  PlanGenerationInputSnapshot,
  WorkoutExerciseCandidate,
} from "@/lib/server/repositories/generated-plan-repository";

function stringifyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function simplifyWorkoutCandidate(candidate: WorkoutExerciseCandidate) {
  return {
    exerciseId: candidate.id,
    name: candidate.name,
    category: candidate.category,
    difficulty: candidate.difficulty,
    defaultSets: candidate.defaultSets,
    defaultRepetitionsOrDuration: candidate.defaultRepetitionsOrDuration,
    equipment: candidate.requiredEquipmentNames,
    broadDislikeMatch: candidate.broadDislikeMatch,
  };
}

function simplifyFoodCandidate(candidate: NutritionPlanCandidateFood) {
  return {
    foodId: candidate.id,
    name: candidate.name,
    mealCategory: candidate.mealCategory,
    servingDescription: candidate.servingDescription,
    calories: candidate.calories,
    proteinGrams: candidate.proteinGrams,
    allergen: candidate.allergen,
  };
}

interface WorkoutGenerationSkeletonDay {
  dayNumber: number;
  dayType: "workout" | "cardio" | "stretching" | "rest";
  focusCategory: string;
  requiredExerciseCount: number;
  allowedExerciseIds: number[];
  candidateExercises: WorkoutExerciseCandidate[];
}

export const workoutPlanSystemPrompt = `
You are a careful Myanmar gym coach for The Community Fitness.

Create only a structured seven-day workout base week in natural Burmese Unicode.
Return JSON only. Do not return Markdown.
Use only the supplied JSON data.
Do not infer missing medical or fitness facts.
Do not mention full name, email, auth IDs, or session data.
Do not promise results.
Do not diagnose diseases.
Do not prescribe treatment or medicine.
Do not invent exercise names.
Do not rename exercises.
Only select exerciseId values from the supplied candidate list.
Only select exercises that clearly use sets and repetitions.
Return exactly the supplied day numbers.
Rest days must contain no exercises.
Non-rest days must contain exactly the requiredExerciseCount.
Keep workoutNotes short, practical, and in natural Burmese.
Do not return duration, minutes, seconds, time-based cardio targets, or rest timers for exercises.
Do not return exercise instruction sentences.
Do not repeat exercise names in Burmese.
Do not return sentences ending with "လုပ်ပါ။".
When the client is a beginner, use gradual beginner-friendly progression.
Respect medical conditions, injuries, and disliked exercises.
Use only allowedExerciseIds for each day.
Do not change rest days, focus categories, day types, or exercise counts.
`.trim();

export const nutritionPlanSystemPrompt = `
You are a careful Myanmar gym coach for The Community Fitness.

Create only a structured seven-day nutrition rotation in natural Burmese Unicode.
Return JSON only. Do not return Markdown.
Use only the supplied JSON data.
Do not infer missing medical or nutrition facts.
Do not mention full name, email, auth IDs, or session data.
Do not create a medical diet.
Do not prescribe treatment or medicine.
Do not promise results.
Do not invent foods.
Only select foodId values from the supplied approved food list.
Exclude allergies, restrictions, and disliked foods.
Follow the supplied nutrition template meal structure exactly.
Set nutritionNotes to exactly "သင့်ရည်မှန်းချက်နှင့် ကိုက်ညီသော အစားအသောက်အစီအစဉ်။"
Do not add generic food descriptions or item notes.
State food direction according to the body goal without claiming medical precision.
`.trim();

export function buildWorkoutPlanUserPrompt(input: {
  profile: PlanGenerationInputSnapshot;
  latestAssessment: {
    workoutAdvice: string;
    nutritionAdvice: string;
    healthAdvice: string;
  } | null;
  workoutPlanSkeleton: WorkoutGenerationSkeletonDay[];
}) {
  const payload = {
    instruction:
      "Use only this JSON. Build exactly 7 days. Each day must keep its supplied dayNumber and use only its allowedExerciseIds. Every non-rest day must return exactly requiredExerciseCount exercises. Rest days must return an empty exercises array. For each exercise return only exerciseId, sets, and repetitions.",
    profile: input.profile,
    latestAssessment: input.latestAssessment,
    workoutPlanSkeleton: input.workoutPlanSkeleton.map((day) => ({
      dayNumber: day.dayNumber,
      dayType: day.dayType,
      focusCategory: day.focusCategory,
      requiredExerciseCount: day.requiredExerciseCount,
      allowedExerciseIds: day.allowedExerciseIds,
      candidateExercises: day.candidateExercises.map(simplifyWorkoutCandidate),
    })),
  };

  return stringifyJson(payload);
}

export function buildWorkoutRepairUserPrompt(input: {
  profile: PlanGenerationInputSnapshot;
  latestAssessment: {
    workoutAdvice: string;
    nutritionAdvice: string;
    healthAdvice: string;
  } | null;
  invalidDays: Array<
    WorkoutGenerationSkeletonDay & {
      validationIssues: string[];
    }
  >;
}) {
  const payload = {
    instruction:
      "Repair only these invalid days. Return only the listed day numbers. Keep every day's exact requiredExerciseCount and use only that day's allowedExerciseIds. For each exercise return only exerciseId, sets, and repetitions.",
    profile: input.profile,
    latestAssessment: input.latestAssessment,
    invalidDays: input.invalidDays.map((day) => ({
      dayNumber: day.dayNumber,
      dayType: day.dayType,
      focusCategory: day.focusCategory,
      requiredExerciseCount: day.requiredExerciseCount,
      allowedExerciseIds: day.allowedExerciseIds,
      validationIssues: day.validationIssues,
      candidateExercises: day.candidateExercises.map(simplifyWorkoutCandidate),
    })),
  };

  return stringifyJson(payload);
}

export function buildNutritionPlanUserPrompt(input: {
  profile: PlanGenerationInputSnapshot;
  nutritionTemplate: {
    id: number;
    name: string;
    mealsPerDay: number;
    minimumCalories: number;
    maximumCalories: number;
    mealStructure: string[];
    notes: string | null;
  };
  latestAssessment: {
    workoutAdvice: string;
    nutritionAdvice: string;
    healthAdvice: string;
  } | null;
  approvedFoods: NutritionPlanCandidateFood[];
}) {
  const payload = {
    instruction:
      "Use only this JSON. Build exactly 7 days. Every day must follow the supplied mealStructure. Use only supplied foodId values. Set nutritionNotes to the exact supplied sentence and keep meal items limited to foodId and servingDescription.",
    profile: input.profile,
    latestAssessment: input.latestAssessment,
    nutritionTemplate: input.nutritionTemplate,
    approvedFoods: input.approvedFoods.map(simplifyFoodCandidate),
  };

  return stringifyJson(payload);
}
