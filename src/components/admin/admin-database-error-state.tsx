import { ServerCrash } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface AdminDatabaseErrorStateProps {
  title: string;
  description: string;
}

export function AdminDatabaseErrorState({
  title,
  description,
}: AdminDatabaseErrorStateProps) {
  return <EmptyState icon={ServerCrash} title={title} description={description} />;
}
