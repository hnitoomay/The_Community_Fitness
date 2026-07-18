export interface NutritionTemplateActionState {
  success: boolean;
  message: string;
  errors: Record<string, string>;
}

export const initialNutritionTemplateActionState: NutritionTemplateActionState =
  {
    success: false,
    message: "",
    errors: {},
  };
