export type AdminClientOnboardingStatus = "Complete" | "Incomplete";
export type AdminClientAssessmentStatus = "Current" | "Outdated" | "Not Generated";
export type AdminClientPlanStatus = "Active" | "Outdated" | "No Plan";

export interface AdminClientStatusSummary {
  onboarding: AdminClientOnboardingStatus;
  assessment: AdminClientAssessmentStatus;
  plan: AdminClientPlanStatus;
}

export interface AdminClientListFilters {
  query: string;
  onboarding: "all" | "complete" | "incomplete";
  bodyGoalId: string;
  assessment: "all" | "current" | "outdated" | "not_generated";
  plan: "all" | "active" | "outdated" | "no_plan";
  page: number;
  pageSize: number;
}

export interface AdminClientListItem {
  userId: string;
  fullName: string;
  email: string;
  gender: string | null;
  age: number | null;
  bodyGoal: string | null;
  statuses: AdminClientStatusSummary;
  latestMeasurementAt: string | null;
  joinedAt: string;
  profileImageUrl: string | null;
}

export interface AdminClientListResult {
  items: AdminClientListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  availableBodyGoals: Array<{ id: string; label: string }>;
  filters: AdminClientListFilters;
}

export interface AdminClientMeasurementHistoryItem {
  measuredAt: string;
  weightKg: string;
  waistCm: string;
  bodyFatPercent: string | null;
}

export interface AdminClientDetailData {
  userId: string;
  fullName: string;
  email: string;
  gender: string | null;
  age: number | null;
  joinedAt: string;
  profileImageUrl: string | null;
  bodyGoal: string | null;
  onboardingCompleted: boolean;
  latestMeasurementAt: string | null;
  latestMeasurements: {
    heightCm: string | null;
    weightKg: string | null;
    waistCm: string | null;
    chestCm: string | null;
    hipCm: string | null;
    armCm: string | null;
    thighCm: string | null;
    bodyFatPercent: string | null;
  };
  preferences: {
    medicalConditions: string[];
    otherHealthCondition: string | null;
    dislikedExercises: string[];
    foodAllergies: string[];
    foodRestrictions: string[];
    dislikedFoods: string[];
  };
  aiAssessment: {
    status: AdminClientAssessmentStatus;
    generatedAt: string | null;
  };
  currentPlan: {
    status: AdminClientPlanStatus;
    startDate: string | null;
    endDate: string | null;
    planId: number | null;
  };
  workoutProgress: {
    completed: number;
    skipped: number;
    inProgress: number;
    completionPercentage: number | null;
  };
  measurementHistory: AdminClientMeasurementHistoryItem[];
}

export interface AdminClientPlanViewData {
  clientUserId: string;
  planId: number;
  status: string;
  bodyGoal: string;
  workoutTemplate: string;
  nutritionTemplate: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  sourceInputHash: string;
  days: Array<{
    planDate: string;
    weekNumber: number;
    dayNumber: number;
    dayType: string;
    focusCategory: string | null;
    estimatedDurationMinutes: number | null;
    exerciseCount: number;
    mealItemCount: number;
  }>;
  workoutProgress: {
    completed: number;
    skipped: number;
    inProgress: number;
  };
}

export interface AdminDashboardMetric {
  label: string;
  value: string;
  note: string;
  href?: string;
}

export interface AdminRecentClientItem {
  userId: string;
  fullName: string;
  email: string;
  bodyGoal: string | null;
  onboardingStatus: AdminClientOnboardingStatus;
  activePlanStatus: AdminClientPlanStatus;
  joinedAt: string;
}

export interface AdminDashboardActivityItem {
  label: string;
  value: string;
  tone: "default" | "success" | "warning" | "error";
}

export interface AdminDashboardReferenceItem {
  label: string;
  count: number;
  href: string;
}

export interface AdminDashboardData {
  metrics: AdminDashboardMetric[];
  recentClients: AdminRecentClientItem[];
  activity: AdminDashboardActivityItem[];
  referenceReadiness: AdminDashboardReferenceItem[];
}
