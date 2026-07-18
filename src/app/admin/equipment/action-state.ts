export interface EquipmentActionState {
  success: boolean;
  message: string;
  errors: Record<string, string>;
}

export const initialEquipmentActionState: EquipmentActionState = {
  success: false,
  message: "",
  errors: {},
};
