export interface BodyGoalActionState {
  success: boolean;
  message: string;
  errors: Record<string, string>;
}

export const initialBodyGoalActionState: BodyGoalActionState = {
  success: false,
  message: "",
  errors: {},
};
