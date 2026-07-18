import { parseDateOnly } from "@/lib/date-only";
import type { ClientNavigationId } from "@/types/navigation";

export type DailyPlanTab = "workout" | "nutrition";

export function normalizeDailyPlanTab(
  value: string | null | undefined,
): DailyPlanTab {
  return value === "nutrition" ? "nutrition" : "workout";
}

export function extractWorkoutRouteDate(pathname: string) {
  const match = /^\/workout\/(\d{4}-\d{2}-\d{2})$/.exec(pathname);

  if (!match) {
    return null;
  }

  try {
    parseDateOnly(match[1]);
    return match[1];
  } catch {
    return null;
  }
}

export function buildDailyPlanHref(
  date: string,
  tab: DailyPlanTab,
  planId?: number | null,
) {
  const params = new URLSearchParams({ tab });

  if (planId) {
    params.set("planId", String(planId));
  }

  return `/workout/${date}?${params.toString()}`;
}

export function getClientNavigationState(input: {
  pathname: string;
  tab: string | null | undefined;
}) {
  const normalizedTab = normalizeDailyPlanTab(input.tab);
  const workoutRouteDate = extractWorkoutRouteDate(input.pathname);
  let activeDestination: ClientNavigationId | null = null;

  if (input.pathname === "/home") {
    activeDestination = "home";
  } else if (input.pathname === "/calendar") {
    activeDestination = "workout";
  } else if (workoutRouteDate) {
    activeDestination =
      normalizedTab === "nutrition" ? "nutrition" : "workout";
  } else if (input.pathname.startsWith("/history")) {
    activeDestination = "history";
  } else if (
    input.pathname.startsWith("/settings") ||
    input.pathname.startsWith("/profile")
  ) {
    activeDestination = "account";
  }

  return {
    activeDestination,
    normalizedTab,
    workoutRouteDate,
  };
}

export const __testing__ = {
  buildDailyPlanHref,
  extractWorkoutRouteDate,
  getClientNavigationState,
  normalizeDailyPlanTab,
};
