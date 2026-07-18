export type GenderValue = "" | "male" | "female" | "other";
export type HomePreviewMode = "incomplete" | "active";
export type YesNoChoice = "yes" | "no";
export type YesNoneChoice = "yes" | "none";
export type BodyGoalGenderGroup = "all" | "male" | "female";

export interface BodyMeasurementsDraft {
  heightCm: string;
  weightKg: string;
  waistCm: string;
  chestCm: string;
  hipCm: string;
  armCm: string;
  thighCm: string;
  bodyFatPercentage: string;
}

export interface ClientProfileDraft {
  fullName: string;
  age: string;
  gender: GenderValue;
  measurements: BodyMeasurementsDraft;
}

export interface ClientPreferencesDraft {
  medicalConditionIds: string[];
  otherHealthConditionText: string;
  exerciseDislikeChoice: YesNoneChoice;
  dislikedExercises: string;
  foodAllergyChoice: YesNoneChoice;
  foodAllergies: string;
  foodRestrictionChoice: YesNoChoice;
  foodRestrictions: string;
  dislikedFoodChoice: YesNoChoice;
  dislikedFoods: string;
}

export interface OnboardingSessionState {
  signedIn: boolean;
  homePreviewMode: HomePreviewMode;
  profile: ClientProfileDraft;
  selectedBodyGoalId: string;
  preferences: ClientPreferencesDraft;
  generatedPlan: boolean;
  completedWorkoutDates: string[];
  completedExerciseKeys: string[];
}

export interface ChoiceOption {
  label: string;
  value: string;
}

export interface HealthConditionOption {
  id: string;
  label: string;
}

export interface BodyGoalRecord {
  id: string;
  label: string;
  description: string;
  genderGroup: BodyGoalGenderGroup;
  imagePlaceholder: string;
}

export interface WeekDatePreview {
  shortDay: string;
  dateLabel: string;
  isToday: boolean;
}

export interface ActivePlanPreview {
  title: string;
  focus: string;
  duration: string;
  equipmentHeadline: string;
  progressLabel: string;
  completionPercent: number;
  workoutActionLabel: string;
  nutritionActionLabel: string;
  weekDates: WeekDatePreview[];
}

export interface HomeExerciseSummary {
  id: string;
  exerciseName: string;
  equipmentLabel: string;
  setsReps: string;
  thumbnailLabel: string;
  completed: boolean;
}
