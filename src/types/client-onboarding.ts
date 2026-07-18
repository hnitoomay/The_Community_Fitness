import type {
  BodyGoalRecord,
  BodyMeasurementsDraft,
  ClientPreferencesDraft,
  ClientProfileDraft,
  GenderValue,
} from "@/types/client-journey";

export interface ClientSelectedBodyGoal {
  id: string;
  label: string;
  description: string;
}

export interface ClientOnboardingSnapshot {
  profile: ClientProfileDraft;
  selectedBodyGoalId: string;
  selectedBodyGoal: ClientSelectedBodyGoal | null;
  preferences: ClientPreferencesDraft;
  onboardingCompleted: boolean;
  preferredLanguage: string;
}

export interface ClientAssessmentInput {
  age: number | null;
  gender: string | null;
  experienceLevel?: string | null;
  measurements: {
    heightCm: string | null;
    weightKg: string | null;
    waistCm: string | null;
    chestCm: string | null;
    hipCm: string | null;
    armCm: string | null;
    thighCm: string | null;
    bodyFatPercent: string | null;
  };
  bodyGoal: {
    id: number | null;
    label: string | null;
    description: string | null;
  };
  medicalConditions: string[];
  otherHealthCondition: string | null;
  dislikedExercises: string[];
  foodAllergies: string[];
  foodRestrictions: string[];
  dislikedFoods: string[];
}

export interface CurrentAiAssessmentContent {
  workoutAdvice: string;
  nutritionAdvice: string;
  healthAdvice: string;
}

export interface LegacyAiAssessmentContent {
  coachingAdvice: string;
}

export type AiAssessmentContent =
  | CurrentAiAssessmentContent
  | LegacyAiAssessmentContent;

export interface AiAssessmentRecord {
  id: number;
  userId: string;
  bodyGoalId: number | null;
  profileSnapshot: ClientAssessmentInput;
  inputHash: string;
  assessment: AiAssessmentContent;
  language: string;
  modelName: string;
  createdAt: string;
}

export interface ClientOnboardingPageData {
  snapshot: ClientOnboardingSnapshot;
  availableGoals: BodyGoalRecord[];
}

export interface ClientProfileSummary {
  fullName: string;
  gender: GenderValue;
  dateOfBirth: string;
  currentAge: number | null;
  usesLegacyAgeFallback: boolean;
}

export interface ClientProfilePageData {
  basicProfile: ClientProfileSummary;
  measurements: BodyMeasurementsDraft;
}

export interface SaveClientProfileInput {
  fullName: string;
  age: string;
  gender: GenderValue;
  measurements: ClientProfileDraft["measurements"];
}

export interface SaveClientPreferencesInput {
  selectedBodyGoalId: string;
  preferences: ClientPreferencesDraft;
}
