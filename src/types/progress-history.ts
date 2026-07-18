export interface MeasurementHistoryEntry {
  id: number;
  measuredAt: string;
  weightKg: number;
  waistCm: number;
  chestCm: number;
  hipCm: number;
  armCm: number;
  thighCm: number;
  bodyFatPercentage: number | null;
  weightChangeKg: number | null;
  waistChangeCm: number | null;
  bodyFatChangePercent: number | null;
}

export interface MeasurementProgressSummary {
  firstWeightKg: number;
  latestWeightKg: number;
  totalWeightChangeKg: number;
  firstWaistCm: number;
  latestWaistCm: number;
  totalWaistChangeCm: number;
  firstBodyFatPercentage: number | null;
  latestBodyFatPercentage: number | null;
  totalBodyFatChangePercent: number | null;
  measurementCount: number;
}

export type GeneratedPlanHistoryStatus = "active" | "archived" | "failed";

export interface GeneratedPlanHistoryEntry {
  planId: number;
  startDate: string;
  endDate: string;
  bodyGoalLabel: string;
  status: GeneratedPlanHistoryStatus;
  createdAt: string;
  completedWorkoutCount: number;
  totalScheduledWorkoutCount: number;
}
