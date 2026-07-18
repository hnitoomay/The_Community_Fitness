import { AdminDatabaseErrorState } from "@/components/admin/admin-database-error-state";
import { AdminExercisesScreen } from "@/components/admin/screens/admin-exercises-screen";
import {
  listExercises,
  listSelectableExerciseEquipment,
} from "@/lib/server/repositories/exercise-repository";

export const runtime = "nodejs";

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

interface AdminExercisesPageProps {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    difficulty?: string | string[];
    status?: string | string[];
  }>;
}

export default async function AdminExercisesPage({
  searchParams,
}: AdminExercisesPageProps) {
  const params = await searchParams;
  const filters = {
    search: getSingleValue(params.q),
    category: getSingleValue(params.category) || "All",
    difficulty: getSingleValue(params.difficulty) || "All",
    status: getSingleValue(params.status) || "All",
  };

  const data = await Promise.all([
    listExercises({
      search: filters.search,
      category: filters.category as never,
      difficulty: filters.difficulty as never,
      status: filters.status as never,
    }),
    listSelectableExerciseEquipment(),
  ]).catch(() => null);

  if (!data) {
    return (
      <AdminDatabaseErrorState
        title="Exercise data is unavailable"
        description="The exercises page could not load database records right now. Check the PostgreSQL connection and try again."
      />
    );
  }

  const [exercises, selectableEquipment] = data;

  return (
    <AdminExercisesScreen
      key={JSON.stringify(filters)}
      exercises={exercises}
      selectableEquipment={selectableEquipment}
      filters={filters}
    />
  );
}
