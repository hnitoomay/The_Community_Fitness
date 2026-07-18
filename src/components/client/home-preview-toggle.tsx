"use client";

import { homePreviewModes } from "@/data/preference-options";
import { cn } from "@/lib/utils";
import { useClientSession } from "@/components/client/client-session-provider";

export function HomePreviewToggle() {
  const {
    state: { homePreviewMode },
    setHomePreviewMode,
  } = useClientSession();

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-1">
      <div className="grid grid-cols-2 gap-1">
        {homePreviewModes.map((option) => {
          const active = homePreviewMode === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setHomePreviewMode(option.value as "incomplete" | "active")}
              className={cn(
                "rounded-[1rem] px-3 py-2 text-xs font-semibold transition",
                active
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-zinc-100",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
