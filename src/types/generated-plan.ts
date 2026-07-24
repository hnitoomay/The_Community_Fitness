export type GeneratedPlanDayType = "workout" | "cardio" | "stretching" | "rest";

export type GeneratedPlanMealType =
  | "Breakfast"
  | "Lunch"
  | "Dinner"
  | "Snack"
  | "Drink";

export interface ActiveGeneratedPlanSummary {
  id: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  status: "active" | "archived" | "failed" | "generating";
  sourceInputHash: string;
  bodyGoalLabel: string;
  workoutTemplateName: string;
  nutritionTemplateName: string;
  workoutModelName: string | null;
  nutritionModelName: string | null;
}

export interface ActiveGeneratedPlanCalendarDay {
  id: number;
  planDate: string;
  weekNumber: number;
  dayNumber: number;
  dayType: GeneratedPlanDayType;
  focusCategory: string | null;
  estimatedDurationMinutes: number | null;
  workoutNotes: string | null;
  nutritionNotes: string | null;
  exerciseCount: number;
  mealItemCount: number;
  mealTypes: GeneratedPlanMealType[];
}

export interface ActiveGeneratedPlanCalendarData {
  plan: ActiveGeneratedPlanSummary;
  days: ActiveGeneratedPlanCalendarDay[];
}

export interface GeneratedPlanExerciseDetail {
  id: number;
  sequenceNumber: number;
  exerciseId: number;
  exerciseName: string;
  category: string;
  imageUrl: string | null;
  defaultSets: number | null;
  defaultRepetitionsOrDuration: string | null;
  defaultInstructions: string;
  requiredEquipmentNames: string[];
  sets: number | null;
  repetitions: string | null;
  durationMinutes: number | null;
  restSeconds: number | null;
  instructions: string | null;
}

export interface GeneratedPlanMealItemDetail {
  id: number;
  mealType: GeneratedPlanMealType;
  sequenceNumber: number;
  foodId: number;
  foodName: string;
  servingDescription: string | null;
  notes: string | null;
}

export interface GeneratedPlanDayDetails {
  plan: ActiveGeneratedPlanSummary;
  day: ActiveGeneratedPlanCalendarDay;
  exercises: GeneratedPlanExerciseDetail[];
  meals: GeneratedPlanMealItemDetail[];
  allergyRestrictionReminder: string | null;
}
