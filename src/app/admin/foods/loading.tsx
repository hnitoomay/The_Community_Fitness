import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <LoadingState
      title="Loading foods"
      description="Fetching approved foods from PostgreSQL."
    />
  );
}
