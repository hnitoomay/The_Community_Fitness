import { AdminDatabaseErrorState } from "@/components/admin/admin-database-error-state";
import { AdminNutritionTemplatesScreen } from "@/components/admin/screens/admin-nutrition-templates-screen";
import { listActiveBodyGoalOptions } from "@/lib/server/repositories/body-goal-repository";
import { listNutritionTemplates } from "@/lib/server/repositories/nutrition-template-repository";

export const runtime = "nodejs";

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

interface AdminNutritionTemplatesPageProps {
  searchParams: Promise<{
    q?: string | string[];
    bodyGoalId?: string | string[];
    status?: string | string[];
  }>;
}

export default async function AdminNutritionTemplatesPage({
  searchParams,
}: AdminNutritionTemplatesPageProps) {
  const params = await searchParams;
  const bodyGoalValue = getSingleValue(params.bodyGoalId);
  const filters = {
    search: getSingleValue(params.q),
    bodyGoalId: bodyGoalValue || "All",
    status: getSingleValue(params.status) || "All",
  };

  const bodyGoalIdFilter =
    filters.bodyGoalId !== "All" && filters.bodyGoalId
      ? Number(filters.bodyGoalId)
      : "All";

  const data = await Promise.all([
    listNutritionTemplates({
      search: filters.search,
      bodyGoalId:
        bodyGoalIdFilter !== "All" && Number.isInteger(bodyGoalIdFilter)
          ? bodyGoalIdFilter
          : "All",
      status: filters.status as never,
    }),
    listActiveBodyGoalOptions(),
  ]).catch(() => null);

  if (!data) {
    return (
      <AdminDatabaseErrorState
        title="Nutrition template data is unavailable"
        description="The nutrition templates page could not load database records right now. Check the PostgreSQL connection and try again."
      />
    );
  }

  const [nutritionTemplates, bodyGoals] = data;

  return (
    <AdminNutritionTemplatesScreen
      key={JSON.stringify(filters)}
      nutritionTemplates={nutritionTemplates}
      bodyGoals={bodyGoals}
      filters={filters}
    />
  );
}
