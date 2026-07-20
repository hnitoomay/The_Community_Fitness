export type AdminRecordStatus = "Active" | "Inactive";
export type EquipmentAvailability = "Available" | "Unavailable";
export type ExerciseDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type EquipmentCategory =
  | "Cardio Machine"
  | "Strength Machine"
  | "Free Weight"
  | "Bench"
  | "Functional Training"
  | "Boxing"
  | "Stretching and Recovery"
  | "Supporting Accessory"
  | "Storage"
  | "Measurement";
export type EquipmentUnit = "Unit" | "Set" | "Piece";
export type ExerciseCategory =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Legs"
  | "Core"
  | "Cardio"
  | "Stretching"
  | "Full Body"
  | "Boxing";
export type FoodMealCategory = "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Drink";
export type TemplateDayType = "Workout" | "Cardio" | "Stretching" | "Rest";
export type FocusCategory =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Legs"
  | "Core"
  | "Full Body"
  | "Cardio"
  | "Stretching"
  | "Rest";
export type BodyGoalImageGender = "male" | "female" | "unisex";

export interface AdminEquipmentItem {
  id: string;
  sourceNo?: number;
  equipmentName: string;
  imageUrl: string;
  category: EquipmentCategory;
  quantity: number;
  unit: EquipmentUnit;
  planSelectable: boolean;
  availability: EquipmentAvailability;
  notes: string;
  updatedDate: string;
}

export interface AdminExerciseItem {
  id: string;
  exerciseName: string;
  imageUrl: string;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  requiredEquipmentIds: string[];
  defaultSets?: number;
  defaultRepetitionsOrDuration: string;
  shortInstructions: string;
  status: AdminRecordStatus;
}

export interface WorkoutTemplateDayRow {
  id: string;
  dayNumber: number;
  dayType: TemplateDayType;
  focusCategory: FocusCategory;
  exerciseCount: number;
}

export interface AdminWorkoutTemplateItem {
  id: string;
  templateName: string;
  bodyGoalId: string;
  daysPerWeek: 3 | 4 | 5 | 6;
  difficulty: ExerciseDifficulty;
  weeklyDayStructure: WorkoutTemplateDayRow[];
  notes: string;
  status: AdminRecordStatus;
}

export interface AdminFoodItem {
  id: string;
  foodName: string;
  mealCategory: FoodMealCategory;
  servingDescription: string;
  calories: number;
  proteinGrams?: number;
  allergen: string;
  status: AdminRecordStatus;
}

export interface AdminNutritionTemplateItem {
  id: string;
  templateName: string;
  bodyGoalId: string;
  mealsPerDay: 3 | 4 | 5;
  minimumDailyCalories: number;
  maximumDailyCalories: number;
  mealStructure: FoodMealCategory[];
  notes: string;
  status: AdminRecordStatus;
}

export interface AdminBodyGoalItem {
  id: string;
  goalLabel: string;
  shortDescription: string;
  maleImageUrl: string;
  femaleImageUrl: string;
  unisexImageUrl: string;
  workoutTemplateId?: string;
  nutritionTemplateId?: string;
  status: AdminRecordStatus;
}

export interface AdminDashboardCardDefinition {
  key:
    | "equipmentItems"
    | "availableEquipment"
    | "exercises"
    | "workoutTemplates"
    | "foodItems"
    | "nutritionTemplates"
    | "bodyGoals";
  label: string;
  note: string;
}

export interface AdminQuickAction {
  href: string;
  label: string;
  description: string;
}

export interface AdminRecentEquipmentUpdate {
  equipmentName: string;
  availability: EquipmentAvailability;
  updatedDate: string;
}

export interface AdminAttentionItem {
  label: string;
  detail: string;
  statusText: string;
}

export const equipmentCategoryOptions: EquipmentCategory[] = [
  "Cardio Machine",
  "Strength Machine",
  "Free Weight",
  "Bench",
  "Functional Training",
  "Boxing",
  "Stretching and Recovery",
  "Supporting Accessory",
  "Storage",
  "Measurement",
];

export const equipmentUnitOptions: EquipmentUnit[] = ["Unit", "Set", "Piece"];
export const equipmentAvailabilityOptions: EquipmentAvailability[] = [
  "Available",
  "Unavailable",
];
export const exerciseCategoryOptions: ExerciseCategory[] = [
  "Chest",
  "Back",
  "Shoulders",
  "Legs",
  "Core",
  "Cardio",
  "Stretching",
  "Full Body",
  "Boxing",
];
export const difficultyOptions: ExerciseDifficulty[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
];
export const workoutTemplateDaysPerWeekOptions: Array<3 | 4 | 5 | 6> = [3, 4, 5, 6];
export const templateDayTypeOptions: TemplateDayType[] = [
  "Workout",
  "Cardio",
  "Stretching",
  "Rest",
];
export const focusCategoryOptions: FocusCategory[] = [
  "Chest",
  "Back",
  "Shoulders",
  "Legs",
  "Core",
  "Full Body",
  "Cardio",
  "Stretching",
  "Rest",
];
export const mealCategoryOptions: FoodMealCategory[] = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Drink",
];
export const mealsPerDayOptions: Array<3 | 4 | 5> = [3, 4, 5];
export const statusOptions: AdminRecordStatus[] = ["Active", "Inactive"];

