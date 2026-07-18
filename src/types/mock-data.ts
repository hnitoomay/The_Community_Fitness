export type AvailabilityStatus = "Available" | "Limited" | "Inactive";

export interface ClientWorkoutSummary {
  title: string;
  duration: string;
  intensity: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  note: string;
}

export interface EquipmentUpdate {
  equipment: string;
  detail: string;
  updatedAt: string;
}

export interface ExerciseReviewItem {
  name: string;
  reason: string;
  equipment: string;
}

export interface EquipmentRow {
  id: number;
  sourceNo: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  planSelectable: boolean;
  availability: AvailabilityStatus;
}
