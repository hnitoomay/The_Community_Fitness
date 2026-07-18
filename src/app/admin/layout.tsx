import { AdminDataProvider } from "@/components/admin/admin-data-provider";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authUser = await requireAdminUser();

  return (
    <AdminDataProvider>
      <AdminShell userName={authUser.session.user.name}>
        {children}
      </AdminShell>
    </AdminDataProvider>
  );
}
