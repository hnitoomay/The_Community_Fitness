export type WorkoutCategory =
  | "Leg Day"
  | "Chest Day"
  | "Back Day"
  | "Shoulder Day"
  | "Cardio"
  | "Stretching"
  | "Rest Day";

export type WorkoutDifficulty = "Beginner" | "Moderate" | "Challenging";
export type ExercisePhase = "Warm-up" | "Main Workout" | "Cooldown";
export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export interface AiAssessmentSectionTemplate {
  title: string;
  body: string;
}

export interface AssessmentGoalGuidance {
  workoutFocus: string;
  trainingDirection: string;
  nutritionDirection: string;
}

export interface PlanDayRecord {
  date: string;
  weekdayLabel: string;
  dayOfMonth: number;
  workoutCategory: WorkoutCategory;
  estimatedDurationMinutes: number;
  exerciseCount: number;
  equipmentTypeCount: number;
  nutritionSummary: string;
  hasWorkout: boolean;
  hasNutrition: boolean;
  isToday?: boolean;
}

export interface MonthlyPlanSummary {
  workoutDays: number;
  restDays: number;
  cardioDays: number;
  strengthDays: number;
}

export interface ExerciseRecord {
  id: string;
  phase: ExercisePhase;
  exerciseName: string;
  requiredEquipmentName: string;
  targetMuscle: string;
  sets: string;
  repetitionsOrDuration: string;
  restTime: string;
  imagePlaceholder: string;
  instructions: string;
}

export interface DailyWorkoutPlan {
  date: string;
  workoutFocus: WorkoutCategory;
  estimatedDuration: string;
  difficulty: WorkoutDifficulty;
  exercises: ExerciseRecord[];
}

export interface NutritionMeal {
  mealType: MealType;
  mealName: string;
  foods: string[];
  portionDescription?: string;
  estimatedMealTime: string;
}

export interface DailyNutritionPlan {
  date: string;
  dailySummary: string;
  meals: NutritionMeal[];
  waterRecommendation: string;
}

export interface WorkoutHistoryRecord {
  date: string;
  workoutCategory: WorkoutCategory;
  status: "Completed" | "Missed";
  duration: string;
}

export interface PlanHistoryRecord {
  dateRange: string;
  selectedBodyGoal: string;
  status: "Active" | "Previous";
}

export interface MeasurementHistoryRecord {
  measurementDate: string;
  weightKg: string;
  waistCm: string;
  bodyFatPercentage?: string;
  changeFromPrevious: string;
}
