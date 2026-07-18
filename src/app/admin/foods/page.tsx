import { AdminDatabaseErrorState } from "@/components/admin/admin-database-error-state";
import { AdminFoodsScreen } from "@/components/admin/screens/admin-foods-screen";
import {
  listFoodAllergens,
  listFoods,
} from "@/lib/server/repositories/food-repository";

export const runtime = "nodejs";

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

interface AdminFoodsPageProps {
  searchParams: Promise<{
    q?: string | string[];
    mealCategory?: string | string[];
    allergen?: string | string[];
    status?: string | string[];
  }>;
}

export default async function AdminFoodsPage({
  searchParams,
}: AdminFoodsPageProps) {
  const params = await searchParams;
  const filters = {
    search: getSingleValue(params.q),
    mealCategory: getSingleValue(params.mealCategory) || "All",
    allergen: getSingleValue(params.allergen) || "All",
    status: getSingleValue(params.status) || "All",
  };

  const data = await Promise.all([
    listFoods({
      search: filters.search,
      mealCategory: filters.mealCategory as never,
      allergen: filters.allergen,
      status: filters.status as never,
    }),
    listFoodAllergens(),
  ]).catch(() => null);

  if (!data) {
    return (
      <AdminDatabaseErrorState
        title="Food data is unavailable"
        description="The foods page could not load database records right now. Check the PostgreSQL connection and try again."
      />
    );
  }

  const [foods, allergens] = data;

  return (
    <AdminFoodsScreen
      key={JSON.stringify(filters)}
      foods={foods}
      allergens={allergens}
      filters={filters}
    />
  );
}
