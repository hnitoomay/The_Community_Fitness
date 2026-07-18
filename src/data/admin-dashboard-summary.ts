import type { AdminDashboardCardDefinition, AdminQuickAction } from "@/types/admin-data";

export const adminDashboardCardDefinitions: AdminDashboardCardDefinition[] = [
  { key: "equipmentItems", label: "Equipment Items", note: "Actual gym inventory records" },
  { key: "availableEquipment", label: "Available Equipment", note: "Ready for workout generation" },
  { key: "exercises", label: "Exercises", note: "Client-facing movement library" },
  { key: "workoutTemplates", label: "Workout Templates", note: "Weekly structures for AI personalization" },
  { key: "foodItems", label: "Food Items", note: "Approved food records" },
  { key: "nutritionTemplates", label: "Nutrition Templates", note: "Meal frameworks for later plan filling" },
  { key: "bodyGoals", label: "Body Goals", note: "Client goal cards and mapping records" },
];

export const adminQuickActions: AdminQuickAction[] = [
  {
    href: "/admin/equipment",
    label: "Add Equipment",
    description: "Create or adjust real gym inventory items.",
  },
  {
    href: "/admin/exercises",
    label: "Add Exercise",
    description: "Add an exercise and map the required equipment.",
  },
  {
    href: "/admin/foods",
    label: "Add Food",
    description: "Expand the approved nutrition options.",
  },
  {
    href: "/admin/workout-templates",
    label: "Add Workout Template",
    description: "Create a weekly workout structure for a goal.",
  },
];
