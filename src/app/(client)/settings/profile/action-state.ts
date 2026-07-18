export interface EditProfileActionState {
  success: boolean;
  didUpdate: boolean;
  message: string;
  errors: Record<string, string>;
}

export const initialEditProfileActionState: EditProfileActionState = {
  success: false,
  didUpdate: false,
  message: "",
  errors: {},
};
