import { AdminDatabaseErrorState } from "@/components/admin/admin-database-error-state";
import { AdminBodyGoalsScreen } from "@/components/admin/screens/admin-body-goals-screen";
import {
  listActiveNutritionTemplateOptions,
  listActiveWorkoutTemplateOptions,
  listBodyGoals,
} from "@/lib/server/repositories/body-goal-repository";

export const runtime = "nodejs";

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

interface AdminBodyGoalsPageProps {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
}

export default async function AdminBodyGoalsPage({
  searchParams,
}: AdminBodyGoalsPageProps) {
  const params = await searchParams;
  const filters = {
    search: getSingleValue(params.q),
    status: getSingleValue(params.status) || "All",
  };

  const data = await Promise.all([
    listBodyGoals({
      search: filters.search,
      status: filters.status as never,
    }),
    listActiveWorkoutTemplateOptions(),
    listActiveNutritionTemplateOptions(),
  ]).catch(() => null);

  if (!data) {
    return (
      <AdminDatabaseErrorState
        title="Body goal data is unavailable"
        description="The body goals page could not load database records right now. Check the PostgreSQL connection and try again."
      />
    );
  }

  const [bodyGoals, workoutTemplates, nutritionTemplates] = data;

  return (
    <AdminBodyGoalsScreen
      key={JSON.stringify(filters)}
      bodyGoals={bodyGoals}
      workoutTemplates={workoutTemplates}
      nutritionTemplates={nutritionTemplates}
      filters={filters}
    />
  );
}
