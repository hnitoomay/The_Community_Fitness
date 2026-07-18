import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <LoadingState
      title="Loading body goals"
      description="Fetching body goals and linked templates."
    />
  );
}
