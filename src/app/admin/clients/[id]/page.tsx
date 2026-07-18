import { AdminClientDetailScreen } from "@/components/admin/screens/admin-client-detail-screen";
import { requireAdminUser } from "@/lib/server/auth";
import { getAdminClientDetail } from "@/lib/server/repositories/admin-client-repository";

interface AdminClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminClientDetailPage(props: AdminClientDetailPageProps) {
  await requireAdminUser();
  const { id } = await props.params;
  const data = await getAdminClientDetail(id);

  return <AdminClientDetailScreen data={data} />;
}
