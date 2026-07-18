export interface ExerciseActionState {
  success: boolean;
  message: string;
  errors: Record<string, string>;
}

export const initialExerciseActionState: ExerciseActionState = {
  success: false,
  message: "",
  errors: {},
};
