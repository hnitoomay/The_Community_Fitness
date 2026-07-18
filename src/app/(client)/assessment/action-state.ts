export interface GenerateAssessmentActionState {
  success: boolean;
  message: string;
}

export const initialGenerateAssessmentActionState: GenerateAssessmentActionState = {
  success: false,
  message: "",
};

export interface GeneratePlanActionState {
  success: boolean;
  message: string;
}

export const initialGeneratePlanActionState: GeneratePlanActionState = {
  success: false,
  message: "",
};
