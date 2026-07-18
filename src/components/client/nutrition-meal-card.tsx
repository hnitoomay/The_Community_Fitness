import { ClientCard } from "@/components/client/client-card";
import { Badge } from "@/components/ui/badge";
import type { NutritionMeal } from "@/types/client-plan";

export function NutritionMealCard({ meal }: { meal: NutritionMeal }) {
  return (
    <ClientCard className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            {meal.mealType}
          </p>
          <h3 className="font-semibold text-[var(--color-text)]">{meal.mealName}</h3>
        </div>
        <Badge variant="outline">{meal.estimatedMealTime}</Badge>
      </div>
      <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
        {meal.foods.map((food) => (
          <li key={food}>• {food}</li>
        ))}
      </ul>
      {meal.portionDescription ? (
        <p className="text-sm text-[var(--color-text)]">{meal.portionDescription}</p>
      ) : null}
    </ClientCard>
  );
}
