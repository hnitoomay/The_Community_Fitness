import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <LoadingState
      title="Loading nutrition templates"
      description="Fetching calorie structures and linked body goals from PostgreSQL."
    />
  );
}
