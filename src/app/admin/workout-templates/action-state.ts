export interface WorkoutTemplateActionState {
  success: boolean;
  message: string;
  errors: Record<string, string>;
}

export const initialWorkoutTemplateActionState: WorkoutTemplateActionState = {
  success: false,
  message: "",
  errors: {},
};
