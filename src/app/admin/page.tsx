import { AdminDashboardScreen } from "@/components/admin/screens/admin-dashboard-screen";
import { requireAdminUser } from "@/lib/server/auth";
import { getAdminDashboardData } from "@/lib/server/repositories/admin-dashboard-repository";

export default async function AdminDashboardPage() {
  await requireAdminUser();
  const data = await getAdminDashboardData();

  return <AdminDashboardScreen data={data} />;
}
