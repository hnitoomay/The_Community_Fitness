import { AdminDatabaseErrorState } from "@/components/admin/admin-database-error-state";
import { AdminWorkoutTemplatesScreen } from "@/components/admin/screens/admin-workout-templates-screen";
import { listActiveBodyGoalOptions } from "@/lib/server/repositories/body-goal-repository";
import { listWorkoutTemplates } from "@/lib/server/repositories/workout-template-repository";

export const runtime = "nodejs";

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

interface AdminWorkoutTemplatesPageProps {
  searchParams: Promise<{
    q?: string | string[];
    bodyGoalId?: string | string[];
    difficulty?: string | string[];
    status?: string | string[];
  }>;
}

export default async function AdminWorkoutTemplatesPage({
  searchParams,
}: AdminWorkoutTemplatesPageProps) {
  const params = await searchParams;
  const bodyGoalValue = getSingleValue(params.bodyGoalId);
  const filters = {
    search: getSingleValue(params.q),
    bodyGoalId: bodyGoalValue || "All",
    difficulty: getSingleValue(params.difficulty) || "All",
    status: getSingleValue(params.status) || "All",
  };

  const bodyGoalIdFilter =
    filters.bodyGoalId !== "All" && filters.bodyGoalId
      ? Number(filters.bodyGoalId)
      : "All";

  const data = await Promise.all([
    listWorkoutTemplates({
      search: filters.search,
      bodyGoalId:
        bodyGoalIdFilter !== "All" && Number.isInteger(bodyGoalIdFilter)
          ? bodyGoalIdFilter
          : "All",
      difficulty: filters.difficulty as never,
      status: filters.status as never,
    }),
    listActiveBodyGoalOptions(),
  ]).catch(() => null);

  if (!data) {
    return (
      <AdminDatabaseErrorState
        title="Workout template data is unavailable"
        description="The workout templates page could not load database records right now. Check the PostgreSQL connection and try again."
      />
    );
  }

  const [workoutTemplates, bodyGoals] = data;

  return (
    <AdminWorkoutTemplatesScreen
      key={JSON.stringify(filters)}
      workoutTemplates={workoutTemplates}
      bodyGoals={bodyGoals}
      filters={filters}
    />
  );
}
