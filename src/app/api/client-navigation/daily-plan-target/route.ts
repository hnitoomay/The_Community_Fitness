import { NextResponse } from "next/server";

import { getTodayDateOnly } from "@/lib/date-only";
import { buildDailyPlanHref } from "@/lib/client-navigation-state";
import { getCurrentServerAuthUser } from "@/lib/server/auth";
import { getActiveGeneratedPlanCalendarForUser } from "@/lib/server/repositories/generated-plan-repository";

export const runtime = "nodejs";

function buildCalendarTargets() {
  return {
    workoutHref: "/calendar",
    nutritionHref: "/calendar",
    planDate: null,
  };
}

export async function GET() {
  const authUser = await getCurrentServerAuthUser();

  if (!authUser) {
    return NextResponse.json(buildCalendarTargets());
  }

  const planData = await getActiveGeneratedPlanCalendarForUser(authUser.userId);

  if (!planData || planData.days.length === 0) {
    return NextResponse.json(buildCalendarTargets());
  }

  const todayDate = getTodayDateOnly("Asia/Rangoon");
  const targetDate =
    planData.days.find((day) => day.planDate === todayDate)?.planDate ??
    planData.days[0].planDate;

  return NextResponse.json({
    workoutHref: buildDailyPlanHref(targetDate, "workout"),
    nutritionHref: buildDailyPlanHref(targetDate, "nutrition"),
    planDate: targetDate,
  });
}
