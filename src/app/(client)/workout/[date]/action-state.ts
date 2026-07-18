import type { WorkoutSessionTrackingDetail } from "@/types/workout-tracking";

export interface WorkoutTrackingActionState {
  success: boolean;
  message: string;
  tracking: WorkoutSessionTrackingDetail | null;
}
