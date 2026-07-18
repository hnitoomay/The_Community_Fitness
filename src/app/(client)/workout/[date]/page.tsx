import { notFound } from "next/navigation";

import { WorkoutDayScreen } from "@/components/client/screens/workout-day-screen";
import { normalizeDailyPlanTab } from "@/lib/client-navigation-state";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  getActiveGeneratedPlanCalendarForUser,
  getGeneratedPlanDayDetailsForUser,
} from "@/lib/server/repositories/generated-plan-repository";
import { getWorkoutSessionTrackingForUser } from "@/lib/server/repositories/workout-tracking-repository";

export default async function WorkoutDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ tab?: string; planId?: string }>;
}) {
  const authUser = await requireAuthenticatedUser();
  const { date } = await params;
  const { tab, planId } = await searchParams;
  const parsedPlanId =
    planId && Number.isInteger(Number(planId)) && Number(planId) > 0
      ? Number(planId)
      : null;
  const [calendarData, dayDetails, tracking] = await Promise.all([
    getActiveGeneratedPlanCalendarForUser(authUser.userId, parsedPlanId ?? undefined),
    getGeneratedPlanDayDetailsForUser(authUser.userId, date, parsedPlanId ?? undefined),
    getWorkoutSessionTrackingForUser(authUser.userId, date, parsedPlanId ?? undefined),
  ]);

  if (!calendarData || !dayDetails) {
    notFound();
  }

  const normalizedTab = normalizeDailyPlanTab(tab);

  return (
    <WorkoutDayScreen
      dayDetails={dayDetails}
      calendarData={calendarData}
      initialTracking={tracking}
      initialTab={normalizedTab}
      isPlanReadOnly={dayDetails.plan.status !== "active"}
    />
  );
}
