"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { initialAdminBodyGoals } from "@/data/admin-body-goals";
import { initialAdminEquipment } from "@/data/admin-equipment";
import { initialAdminExercises } from "@/data/admin-exercises";
import { initialAdminFoods } from "@/data/admin-foods";
import { initialAdminNutritionTemplates } from "@/data/admin-nutrition-templates";
import { initialAdminWorkoutTemplates } from "@/data/admin-workout-templates";
import type {
  AdminBodyGoalItem,
  AdminEquipmentItem,
  AdminExerciseItem,
  AdminFoodItem,
  AdminNutritionTemplateItem,
  AdminWorkoutTemplateItem,
} from "@/types/admin-data";

interface AdminDataContextValue {
  equipment: AdminEquipmentItem[];
  setEquipment: Dispatch<SetStateAction<AdminEquipmentItem[]>>;
  exercises: AdminExerciseItem[];
  setExercises: Dispatch<SetStateAction<AdminExerciseItem[]>>;
  workoutTemplates: AdminWorkoutTemplateItem[];
  setWorkoutTemplates: Dispatch<SetStateAction<AdminWorkoutTemplateItem[]>>;
  foods: AdminFoodItem[];
  setFoods: Dispatch<SetStateAction<AdminFoodItem[]>>;
  nutritionTemplates: AdminNutritionTemplateItem[];
  setNutritionTemplates: Dispatch<SetStateAction<AdminNutritionTemplateItem[]>>;
  bodyGoals: AdminBodyGoalItem[];
  setBodyGoals: Dispatch<SetStateAction<AdminBodyGoalItem[]>>;
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [equipment, setEquipment] = useState(initialAdminEquipment);
  const [exercises, setExercises] = useState(initialAdminExercises);
  const [workoutTemplates, setWorkoutTemplates] = useState(initialAdminWorkoutTemplates);
  const [foods, setFoods] = useState(initialAdminFoods);
  const [nutritionTemplates, setNutritionTemplates] = useState(
    initialAdminNutritionTemplates,
  );
  const [bodyGoals, setBodyGoals] = useState(initialAdminBodyGoals);

  const value = useMemo(
    () => ({
      equipment,
      setEquipment,
      exercises,
      setExercises,
      workoutTemplates,
      setWorkoutTemplates,
      foods,
      setFoods,
      nutritionTemplates,
      setNutritionTemplates,
      bodyGoals,
      setBodyGoals,
    }),
    [bodyGoals, equipment, exercises, foods, nutritionTemplates, workoutTemplates],
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const context = useContext(AdminDataContext);

  if (!context) {
    throw new Error("useAdminData must be used within AdminDataProvider");
  }

  return context;
}
