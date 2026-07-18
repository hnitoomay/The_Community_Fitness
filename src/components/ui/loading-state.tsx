import { LoaderCircle } from "lucide-react";

interface LoadingStateProps {
  title?: string;
  description?: string;
}

export function LoadingState({
  title = "Loading",
  description = "Preparing the next section.",
}: LoadingStateProps) {
  return (
    <div className="surface-card flex flex-col items-center justify-center gap-3 p-8 text-center">
      <LoaderCircle className="size-7 animate-spin text-[var(--color-primary)]" />
      <div className="space-y-1">
        <p className="font-semibold text-[var(--color-text)]">{title}</p>
        <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
      </div>
    </div>
  );
}
