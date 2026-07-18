"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { clientBottomNavigation } from "@/data/client";
import {
  buildDailyPlanHref,
  getClientNavigationState,
} from "@/lib/client-navigation-state";
import { cn } from "@/lib/utils";

interface ClientBottomNavigationProps {
  currentPath?: string;
}

interface DailyPlanNavigationTargets {
  workoutHref: string;
  nutritionHref: string;
}

const calendarTargets: DailyPlanNavigationTargets = {
  workoutHref: "/calendar",
  nutritionHref: "/calendar",
};

export function ClientBottomNavigation({
  currentPath,
}: ClientBottomNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resolvedPath = currentPath ?? pathname;
  const navigationState = useMemo(
    () =>
      getClientNavigationState({
        pathname: resolvedPath,
        tab: searchParams.get("tab"),
      }),
    [resolvedPath, searchParams],
  );
  const [dailyPlanTargets, setDailyPlanTargets] =
    useState<DailyPlanNavigationTargets>(calendarTargets);
  const resolvedDailyPlanTargets = navigationState.workoutRouteDate
    ? {
        workoutHref: buildDailyPlanHref(
          navigationState.workoutRouteDate,
          "workout",
        ),
        nutritionHref: buildDailyPlanHref(
          navigationState.workoutRouteDate,
          "nutrition",
        ),
      }
    : dailyPlanTargets;

  useEffect(() => {
    if (navigationState.workoutRouteDate) {
      return;
    }

    let cancelled = false;

    fetch("/api/client-navigation/daily-plan-target", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("NAVIGATION_TARGET_REQUEST_FAILED");
        }

        return (await response.json()) as Partial<DailyPlanNavigationTargets>;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setDailyPlanTargets({
          workoutHref: payload.workoutHref ?? "/calendar",
          nutritionHref: payload.nutritionHref ?? "/calendar",
        });
      })
      .catch(() => {
        if (!cancelled) {
          setDailyPlanTargets(calendarTargets);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigationState.workoutRouteDate]);

  return (
    <nav className="safe-bottom sticky bottom-0 z-20 border-t border-[var(--color-border)] bg-white/95 px-3 pb-3 pt-2 backdrop-blur">
      <ul className="grid grid-cols-5 gap-1">
        {clientBottomNavigation.map((item) => {
          const href =
            item.id === "workout"
              ? resolvedDailyPlanTargets.workoutHref
              : item.id === "nutrition"
                ? resolvedDailyPlanTargets.nutritionHref
                : item.href;
          const active = navigationState.activeDestination === item.id;
          const Icon = item.icon;

          return (
            <li key={item.id}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition",
                  active
                    ? "bg-[rgba(214,31,44,0.12)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-zinc-100 hover:text-[var(--color-text)]",
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
