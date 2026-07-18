import type { OnboardingSessionState } from "@/types/client-journey";

export const profileDefaults: OnboardingSessionState = {
  signedIn: false,
  homePreviewMode: "incomplete",
  profile: {
    fullName: "",
    age: "",
    gender: "",
    measurements: {
      heightCm: "",
      weightKg: "",
      waistCm: "",
      chestCm: "",
      hipCm: "",
      armCm: "",
      thighCm: "",
      bodyFatPercentage: "",
    },
  },
  selectedBodyGoalId: "",
  preferences: {
    medicalConditionIds: [],
    otherHealthConditionText: "",
    exerciseDislikeChoice: "none",
    dislikedExercises: "",
    foodAllergyChoice: "none",
    foodAllergies: "",
    foodRestrictionChoice: "no",
    foodRestrictions: "",
    dislikedFoodChoice: "no",
    dislikedFoods: "",
  },
  generatedPlan: false,
  completedWorkoutDates: [],
  completedExerciseKeys: [],
};
