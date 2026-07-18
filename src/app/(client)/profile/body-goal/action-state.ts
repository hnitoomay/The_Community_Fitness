export interface ClientPreferencesActionState {
  success: boolean;
  message: string;
  errors: Record<string, string>;
}

export const initialClientPreferencesActionState: ClientPreferencesActionState = {
  success: false,
  message: "",
  errors: {},
};
