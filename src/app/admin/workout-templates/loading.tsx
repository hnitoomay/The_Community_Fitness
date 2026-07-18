import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <LoadingState
      title="Loading workout templates"
      description="Fetching weekly structures and linked body goals from PostgreSQL."
    />
  );
}
