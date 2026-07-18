import type {
  DashboardStat,
  EquipmentRow,
  EquipmentUpdate,
  ExerciseReviewItem,
} from "@/types/mock-data";

export const adminDashboardStats: DashboardStat[] = [
  { label: "Total Equipment Types", value: "89", note: "Source catalog entries" },
  { label: "Available Equipment", value: "73", note: "Active and ready for plans" },
  { label: "Total Exercises", value: "146", note: "Curated movement library" },
  { label: "Workout Templates", value: "18", note: "Split by goal and training day" },
  { label: "Food Items", value: "212", note: "Curated meal ingredients" },
  { label: "Nutrition Templates", value: "14", note: "Structured daily meal patterns" },
];

export const recentEquipmentUpdates: EquipmentUpdate[] = [
  {
    equipment: "Smith Machine",
    detail: "Marked available for beginner and strength plan mapping.",
    updatedAt: "Today, 09:30",
  },
  {
    equipment: "Leg Press",
    detail: "Quantity confirmed after floor check.",
    updatedAt: "Yesterday, 16:10",
  },
  {
    equipment: "Body Fat Scale",
    detail: "Kept active in inventory but excluded from workout generation.",
    updatedAt: "Yesterday, 11:45",
  },
];

export const exercisesRequiringReview: ExerciseReviewItem[] = [
  {
    name: "Machine Leg Press",
    reason: "Equipment mapping pending final review.",
    equipment: "Leg Press",
  },
  {
    name: "Smith Machine Split Squat",
    reason: "Needs progression tags before publishing.",
    equipment: "Smith Machine",
  },
  {
    name: "Assault Bike Sprint",
    reason: "Cardio intensity label needs confirmation.",
    equipment: "Bike",
  },
];

export const equipmentRows: EquipmentRow[] = [
  {
    id: 1,
    sourceNo: 1,
    name: "Treadmill",
    category: "Cardio",
    quantity: 6,
    unit: "pcs",
    planSelectable: true,
    availability: "Available",
  },
  {
    id: 2,
    sourceNo: 4,
    name: "Bike",
    category: "Cardio",
    quantity: 5,
    unit: "pcs",
    planSelectable: true,
    availability: "Available",
  },
  {
    id: 3,
    sourceNo: 11,
    name: "Smith Machine",
    category: "Strength",
    quantity: 2,
    unit: "pcs",
    planSelectable: true,
    availability: "Available",
  },
  {
    id: 4,
    sourceNo: 14,
    name: "Leg Press",
    category: "Strength",
    quantity: 1,
    unit: "pcs",
    planSelectable: true,
    availability: "Limited",
  },
  {
    id: 5,
    sourceNo: 22,
    name: "Dumbbell 10kg",
    category: "Free Weight",
    quantity: 8,
    unit: "pairs",
    planSelectable: true,
    availability: "Available",
  },
  {
    id: 6,
    sourceNo: 23,
    name: "Dumbbell Rack",
    category: "Storage",
    quantity: 1,
    unit: "pcs",
    planSelectable: false,
    availability: "Available",
  },
  {
    id: 7,
    sourceNo: 31,
    name: "Body Fat Scale",
    category: "Assessment",
    quantity: 1,
    unit: "pcs",
    planSelectable: false,
    availability: "Inactive",
  },
];

export const equipmentCategories = [
  "All Categories",
  "Cardio",
  "Strength",
  "Free Weight",
  "Storage",
  "Assessment",
];

export const equipmentAvailabilityFilters = [
  "All Availability",
  "Available",
  "Limited",
  "Inactive",
];
