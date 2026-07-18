export type WorkoutSessionStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped";

export interface WorkoutExerciseTrackingDetail {
  generatedPlanExerciseId: number;
  completed: boolean;
  completedSets: number | null;
  actualRepetitions: string | null;
  note: string | null;
  completedAt: string | null;
}

export interface WorkoutSessionTrackingDetail {
  sessionId: number | null;
  status: WorkoutSessionStatus;
  difficultyRating: number | null;
  painReported: boolean;
  feedbackNote: string | null;
  startedAt: string | null;
  completedAt: string | null;
  totalExercises: number;
  completedExercises: number;
  completionPercent: number;
  exerciseLogs: WorkoutExerciseTrackingDetail[];
}

export interface HomeWorkoutWeekDate {
  shortDay: string;
  dateLabel: string;
  isToday: boolean;
}

export interface HomeWorkoutSummary {
  planDate: string;
  focus: string;
  estimatedDurationMinutes: number | null;
  equipmentHeadline: string;
  status: WorkoutSessionStatus;
  completedExercises: number;
  totalExercises: number;
  completionPercent: number;
  weekDates: HomeWorkoutWeekDate[];
}

export interface WorkoutHistoryEntry {
  sessionId: number;
  planDate: string;
  workoutFocusCategory: string;
  status: Exclude<WorkoutSessionStatus, "not_started">;
  completedExercises: number;
  totalExercises: number;
  estimatedDurationMinutes: number | null;
  difficultyRating: number | null;
  painReported: boolean;
  completedAt: string | null;
}
