import { DatabaseZap } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface AdminEmptyStateProps {
  title: string;
  description: string;
}

export function AdminEmptyState({
  title,
  description,
}: AdminEmptyStateProps) {
  return <EmptyState icon={DatabaseZap} title={title} description={description} />;
}
