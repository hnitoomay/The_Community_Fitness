import type { HomeExerciseSummary } from "@/types/client-journey";

export const homeExerciseSummaries: HomeExerciseSummary[] = [
  {
    id: "goblet-squat",
    exerciseName: "Goblet Squat",
    equipmentLabel: "Dumbbell",
    setsReps: "4 sets x 12 reps",
    thumbnailLabel: "Squat",
    completed: true,
  },
  {
    id: "leg-press",
    exerciseName: "Leg Press",
    equipmentLabel: "Leg Press",
    setsReps: "4 sets x 10 reps",
    thumbnailLabel: "Press",
    completed: true,
  },
  {
    id: "walking-lunge",
    exerciseName: "Walking Lunge",
    equipmentLabel: "No equipment",
    setsReps: "3 sets x 14 steps",
    thumbnailLabel: "Lunge",
    completed: false,
  },
  {
    id: "calf-raise",
    exerciseName: "Standing Calf Raise",
    equipmentLabel: "Smith Machine",
    setsReps: "3 sets x 20 reps",
    thumbnailLabel: "Calf",
    completed: false,
  },
];
