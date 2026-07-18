import type { ActivePlanPreview } from "@/types/client-journey";

export const activePlanHomePreview: ActivePlanPreview = {
  title: "Today Workout Plan",
  focus: "Leg Day",
  duration: "60 mins",
  equipmentHeadline: "Gym-ready equipment matched preview",
  progressLabel: "2 of 4 exercises marked complete",
  completionPercent: 50,
  workoutActionLabel: "Start Workout",
  nutritionActionLabel: "View Nutrition",
  weekDates: [
    { shortDay: "Mon", dateLabel: "01", isToday: false },
    { shortDay: "Tue", dateLabel: "02", isToday: false },
    { shortDay: "Wed", dateLabel: "03", isToday: false },
    { shortDay: "Thu", dateLabel: "04", isToday: true },
    { shortDay: "Fri", dateLabel: "05", isToday: false },
    { shortDay: "Sat", dateLabel: "06", isToday: false },
    { shortDay: "Sun", dateLabel: "07", isToday: false },
  ],
};
