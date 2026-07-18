import type { WorkoutSessionStatus } from "@/types/workout-tracking";

export type HomeSetupStepId =
  | "personal_profile"
  | "measurements_goal"
  | "ai_assessment"
  | "one_month_plan";

export interface HomeWorkoutExercisePreview {
  generatedPlanExerciseId: number;
  sequenceNumber: number;
  exerciseName: string;
  imageUrl: string | null;
  equipmentLabel: string;
  sets: number | null;
  repetitions: string | null;
  durationMinutes: number | null;
  completed: boolean;
}

export interface HomeWorkoutDayPreview {
  planDayId: number;
  planDate: string;
  dayType: "workout" | "cardio" | "stretching" | "rest";
  focusCategory: string | null;
  estimatedDurationMinutes: number | null;
  totalExercises: number;
  completedExercises: number;
  completionPercent: number;
  status: WorkoutSessionStatus;
  exercises: HomeWorkoutExercisePreview[];
}

export interface HomeWorkoutPlanPreview {
  planId: number;
  startDate: string;
  endDate: string;
  sourceInputHash: string;
  days: HomeWorkoutDayPreview[];
}

export interface HomeSetupStepState {
  id: HomeSetupStepId;
  title: string;
  description: string;
  status: "complete" | "current" | "upcoming";
}

export interface HomeDashboardNotice {
  message: string;
  actionLabel: string;
  actionHref: string;
}

export interface HomeFirstTimeSetupState {
  kind: "first_time_setup";
  nextStepId: HomeSetupStepId;
  steps: HomeSetupStepState[];
  primaryActionLabel: string;
  primaryActionHref: string;
}

export interface HomeReturningAssessmentState {
  kind: "returning_assessment_only";
  title: string;
  description: string;
  primaryActionLabel: string;
  primaryActionHref: string;
}

export interface HomeReturningNoActivePlanState {
  kind: "returning_no_active_plan";
  title: string;
  description: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
}

export interface HomeActivePlanState {
  kind: "active_plan";
  isAssessmentCurrent: boolean;
  isActivePlanCurrent: boolean;
  dashboardNotice: HomeDashboardNotice | null;
}

export type HomeSetupState =
  | HomeFirstTimeSetupState
  | HomeReturningAssessmentState
  | HomeReturningNoActivePlanState
  | HomeActivePlanState;
