import type { AdminWorkoutTemplateItem } from "@/types/admin-data";

export const initialAdminWorkoutTemplates: AdminWorkoutTemplateItem[] = [
  {
    id: "wt-1",
    templateName: "Beginner Lean and Toned",
    bodyGoalId: "goal-lean-toned",
    daysPerWeek: 4,
    difficulty: "Beginner",
    weeklyDayStructure: [
      { id: "wt-1-day-1", dayNumber: 1, dayType: "Workout", focusCategory: "Full Body", exerciseCount: 5 },
      { id: "wt-1-day-2", dayNumber: 2, dayType: "Cardio", focusCategory: "Cardio", exerciseCount: 3 },
      { id: "wt-1-day-3", dayNumber: 3, dayType: "Workout", focusCategory: "Legs", exerciseCount: 5 },
      { id: "wt-1-day-4", dayNumber: 4, dayType: "Stretching", focusCategory: "Stretching", exerciseCount: 3 },
    ],
    notes: "Low-friction starter split with one cardio and one mobility emphasis day.",
    status: "Active",
  },
  {
    id: "wt-2",
    templateName: "Strength Focus 5 Day",
    bodyGoalId: "goal-strength-focus",
    daysPerWeek: 5,
    difficulty: "Advanced",
    weeklyDayStructure: [
      { id: "wt-2-day-1", dayNumber: 1, dayType: "Workout", focusCategory: "Legs", exerciseCount: 6 },
      { id: "wt-2-day-2", dayNumber: 2, dayType: "Workout", focusCategory: "Chest", exerciseCount: 5 },
      { id: "wt-2-day-3", dayNumber: 3, dayType: "Rest", focusCategory: "Rest", exerciseCount: 0 },
      { id: "wt-2-day-4", dayNumber: 4, dayType: "Workout", focusCategory: "Back", exerciseCount: 5 },
      { id: "wt-2-day-5", dayNumber: 5, dayType: "Workout", focusCategory: "Shoulders", exerciseCount: 4 },
    ],
    notes: "Heavier emphasis on compound work and controlled recovery spacing.",
    status: "Inactive",
  },
  {
    id: "wt-3",
    templateName: "General Fitness 3 Day",
    bodyGoalId: "goal-general-fitness",
    daysPerWeek: 3,
    difficulty: "Beginner",
    weeklyDayStructure: [
      { id: "wt-3-day-1", dayNumber: 1, dayType: "Workout", focusCategory: "Full Body", exerciseCount: 5 },
      { id: "wt-3-day-2", dayNumber: 2, dayType: "Cardio", focusCategory: "Cardio", exerciseCount: 3 },
      { id: "wt-3-day-3", dayNumber: 3, dayType: "Stretching", focusCategory: "Stretching", exerciseCount: 3 },
    ],
    notes: "",
    status: "Active",
  },
];
