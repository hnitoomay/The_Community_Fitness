import { Badge } from "@/components/ui/badge";
import type { AdminRecordStatus, EquipmentAvailability } from "@/types/admin-data";

interface AdminStatusBadgeProps {
  status: AdminRecordStatus | EquipmentAvailability | "Yes" | "No";
}

export function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
  if (status === "Active" || status === "Available" || status === "Yes") {
    return <Badge variant="success">{status}</Badge>;
  }

  if (status === "Inactive" || status === "Unavailable") {
    return <Badge variant="error">{status}</Badge>;
  }

  return <Badge variant="warning">{status}</Badge>;
}
