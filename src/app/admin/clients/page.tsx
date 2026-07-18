import { AdminClientsScreen } from "@/components/admin/screens/admin-clients-screen";
import { requireAdminUser } from "@/lib/server/auth";
import { getAdminClientList } from "@/lib/server/repositories/admin-client-repository";

interface AdminClientsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminClientsPage(props: AdminClientsPageProps) {
  await requireAdminUser();
  const searchParams = await props.searchParams;
  let data = null;
  let error: string | null = null;

  try {
    data = await getAdminClientList(searchParams);
  } catch {
    error = "The client directory could not be loaded from PostgreSQL.";
  }

  return <AdminClientsScreen data={data} error={error} />;
}
