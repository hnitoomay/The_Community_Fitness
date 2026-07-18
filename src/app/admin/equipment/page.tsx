import { AdminDatabaseErrorState } from "@/components/admin/admin-database-error-state";
import { AdminEquipmentScreen } from "@/components/admin/screens/admin-equipment-screen";
import { listEquipment } from "@/lib/server/repositories/equipment-repository";

export const runtime = "nodejs";

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

interface AdminEquipmentPageProps {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    availability?: string | string[];
    planSelectable?: string | string[];
  }>;
}

export default async function AdminEquipmentPage({
  searchParams,
}: AdminEquipmentPageProps) {
  const params = await searchParams;
  const filters = {
    search: getSingleValue(params.q),
    category: getSingleValue(params.category) || "All",
    availability: getSingleValue(params.availability) || "All",
    planSelectable: getSingleValue(params.planSelectable) || "All",
  };

  const equipment = await listEquipment({
    search: filters.search,
    category: filters.category as never,
    availability: filters.availability as never,
    planSelectable: filters.planSelectable as never,
  }).catch(() => null);

  if (!equipment) {
    return (
      <AdminDatabaseErrorState
        title="Equipment data is unavailable"
        description="The equipment page could not load database records right now. Check the PostgreSQL connection and try again."
      />
    );
  }

  return (
    <AdminEquipmentScreen
      key={JSON.stringify(filters)}
      equipment={equipment}
      filters={filters}
    />
  );
}
