import type { BodyMeasurementsDraft, GenderValue } from "@/types/client-journey";

export interface EditableProfileDraft {
  fullName: string;
  email: string;
  dateOfBirth: string;
  gender: GenderValue;
}

export interface EditableProfilePageData {
  profile: EditableProfileDraft;
  avatarUrl: string | null;
  providerImageUrl: string | null;
  currentAge: number | null;
  hasCredentialAccount: boolean;
  latestMeasurementRecordedAt: string | null;
  uploadStorageConfigured: boolean;
}

export interface MeasurementSnapshotPageData {
  measurements: BodyMeasurementsDraft;
  latestMeasuredAt: string | null;
}
