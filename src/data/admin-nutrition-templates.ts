import type { AdminNutritionTemplateItem } from "@/types/admin-data";

export const initialAdminNutritionTemplates: AdminNutritionTemplateItem[] = [
  {
    id: "nt-1",
    templateName: "Lean and Toned Nutrition",
    bodyGoalId: "goal-lean-toned",
    mealsPerDay: 4,
    minimumDailyCalories: 1600,
    maximumDailyCalories: 1900,
    mealStructure: ["Breakfast", "Lunch", "Dinner", "Snack"],
    notes: "Keeps snacks light and protein distribution steady.",
    status: "Active",
  },
  {
    id: "nt-2",
    templateName: "Strength Fuel 5 Meals",
    bodyGoalId: "goal-strength-focus",
    mealsPerDay: 5,
    minimumDailyCalories: 2300,
    maximumDailyCalories: 2800,
    mealStructure: ["Breakfast", "Lunch", "Dinner", "Snack", "Drink"],
    notes: "Supports higher training volume and intra-day energy stability.",
    status: "Inactive",
  },
  {
    id: "nt-3",
    templateName: "General Fitness 3 Meals",
    bodyGoalId: "goal-general-fitness",
    mealsPerDay: 3,
    minimumDailyCalories: 1700,
    maximumDailyCalories: 2100,
    mealStructure: ["Breakfast", "Lunch", "Dinner"],
    notes: "",
    status: "Active",
  },
];
