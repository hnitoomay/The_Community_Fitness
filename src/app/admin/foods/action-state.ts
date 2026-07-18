export interface FoodActionState {
  success: boolean;
  message: string;
  errors: Record<string, string>;
}

export const initialFoodActionState: FoodActionState = {
  success: false,
  message: "",
  errors: {},
};
