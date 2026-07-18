import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <LoadingState
      title="Loading equipment"
      description="Fetching the latest gym equipment inventory."
    />
  );
}
