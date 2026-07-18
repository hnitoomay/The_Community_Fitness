export interface ClientProfileActionState {
  success: boolean;
  didInsertMeasurement: boolean;
  message: string;
  errors: Record<string, string>;
}

export const initialClientProfileActionState: ClientProfileActionState = {
  success: false,
  didInsertMeasurement: false,
  message: "",
  errors: {},
};
