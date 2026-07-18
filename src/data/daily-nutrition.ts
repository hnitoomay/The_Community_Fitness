import type { DailyNutritionPlan } from "@/types/client-plan";

export const dailyNutritionPlans: Record<string, DailyNutritionPlan> = {
  "2026-07-04": {
    date: "2026-07-04",
    dailySummary: "Recovery-friendly meals with simple protein coverage and lighter overall volume.",
    meals: [
      {
        mealType: "Breakfast",
        mealName: "Yogurt Fruit Bowl",
        foods: ["Greek yogurt", "Banana", "Berries", "Chia seeds"],
        portionDescription: "1 bowl",
        estimatedMealTime: "8:00 AM",
      },
      {
        mealType: "Lunch",
        mealName: "Chicken Rice Plate",
        foods: ["Grilled chicken", "Brown rice", "Mixed vegetables"],
        portionDescription: "Medium plate",
        estimatedMealTime: "12:30 PM",
      },
      {
        mealType: "Dinner",
        mealName: "Salmon and Greens",
        foods: ["Salmon", "Sweet potato", "Steamed greens"],
        estimatedMealTime: "7:00 PM",
      },
      {
        mealType: "Snack",
        mealName: "Hydration Snack",
        foods: ["Apple", "Handful of nuts"],
        estimatedMealTime: "4:00 PM",
      },
    ],
    waterRecommendation: "Aim for 2.4L water across the day.",
  },
  "2026-07-05": {
    date: "2026-07-05",
    dailySummary: "Moderate protein support with a controlled pre-workout carb window.",
    meals: [
      {
        mealType: "Breakfast",
        mealName: "Egg Wrap",
        foods: ["Eggs", "Whole-wheat wrap", "Spinach"],
        estimatedMealTime: "7:30 AM",
      },
      {
        mealType: "Lunch",
        mealName: "Beef Rice Bowl",
        foods: ["Lean beef", "Jasmine rice", "Carrots", "Broccoli"],
        estimatedMealTime: "1:00 PM",
      },
      {
        mealType: "Dinner",
        mealName: "Chicken Noodle Soup",
        foods: ["Chicken breast", "Light noodles", "Vegetable broth"],
        estimatedMealTime: "7:30 PM",
      },
      {
        mealType: "Snack",
        mealName: "Pre-workout Banana",
        foods: ["Banana", "Peanut butter"],
        estimatedMealTime: "5:00 PM",
      },
    ],
    waterRecommendation: "Aim for 2.6L water and one extra glass near training.",
  },
  "2026-07-06": {
    date: "2026-07-06",
    dailySummary: "Higher-energy leg day meals with protein spread evenly across the day.",
    meals: [
      {
        mealType: "Breakfast",
        mealName: "Oats and Eggs",
        foods: ["Oats", "Eggs", "Banana"],
        portionDescription: "1 bowl + 2 eggs",
        estimatedMealTime: "7:00 AM",
      },
      {
        mealType: "Lunch",
        mealName: "Chicken Potato Plate",
        foods: ["Chicken thigh", "Roasted potatoes", "Green beans"],
        estimatedMealTime: "12:30 PM",
      },
      {
        mealType: "Dinner",
        mealName: "Beef Rice Dinner",
        foods: ["Lean beef", "Rice", "Sauteed vegetables"],
        estimatedMealTime: "7:00 PM",
      },
      {
        mealType: "Snack",
        mealName: "Recovery Yogurt Cup",
        foods: ["Greek yogurt", "Honey", "Granola"],
        estimatedMealTime: "4:30 PM",
      },
    ],
    waterRecommendation: "Aim for 2.8L water and add one bottle during training.",
  },
  "2026-07-07": {
    date: "2026-07-07",
    dailySummary: "Back day nutrition emphasizes protein, hydration, and a moderate carb distribution.",
    meals: [
      {
        mealType: "Breakfast",
        mealName: "Protein Toast Set",
        foods: ["Toast", "Eggs", "Avocado"],
        estimatedMealTime: "8:00 AM",
      },
      {
        mealType: "Lunch",
        mealName: "Turkey Rice Box",
        foods: ["Turkey", "Rice", "Cucumber salad"],
        estimatedMealTime: "1:00 PM",
      },
      {
        mealType: "Dinner",
        mealName: "Fish and Vegetables",
        foods: ["White fish", "Mashed potato", "Mixed greens"],
        estimatedMealTime: "7:15 PM",
      },
      {
        mealType: "Snack",
        mealName: "Fruit and Nuts",
        foods: ["Orange", "Mixed nuts"],
        estimatedMealTime: "4:00 PM",
      },
    ],
    waterRecommendation: "Aim for 2.5L water with steady intake across the afternoon.",
  },
};
