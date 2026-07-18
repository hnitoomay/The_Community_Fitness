export interface MeasurementUpdateActionState {
  success: boolean;
  didInsertMeasurement: boolean;
  message: string;
  errors: Record<string, string>;
}

export const initialMeasurementUpdateActionState: MeasurementUpdateActionState = {
  success: false,
  didInsertMeasurement: false,
  message: "",
  errors: {},
};
