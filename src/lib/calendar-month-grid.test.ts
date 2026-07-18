import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { buildCalendarMonthGrid } from "./calendar-month-grid";
import {
  addDaysDateOnly,
  formatDateOnly,
  getMonthGrid,
  sameDateOnly,
  shiftMonth,
} from "./date-only";
import type {
  ActiveGeneratedPlanCalendarData,
  ActiveGeneratedPlanCalendarDay,
} from "@/types/generated-plan";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function createPlanDay(
  planDate: string,
  dayNumber: number,
  dayType: ActiveGeneratedPlanCalendarDay["dayType"],
  focusCategory: string | null,
): ActiveGeneratedPlanCalendarDay {
  return {
    id: dayNumber,
    planDate,
    weekNumber: Math.ceil(dayNumber / 7),
    dayNumber,
    dayType,
    focusCategory,
    estimatedDurationMinutes: dayType === "rest" ? null : 45,
    workoutNotes: null,
    nutritionNotes: null,
    exerciseCount: dayType === "rest" ? 0 : 4,
    mealItemCount: 3,
    mealTypes: ["Breakfast", "Lunch", "Dinner"],
  };
}

function createCalendarPlanFixture(): ActiveGeneratedPlanCalendarData {
  const startDate = "2026-07-11";
  const planDays: ActiveGeneratedPlanCalendarDay[] = [];
  const dayTypes = [
    { dayType: "workout", focusCategory: "Legs" },
    { dayType: "workout", focusCategory: "Back" },
    { dayType: "rest", focusCategory: null },
    { dayType: "workout", focusCategory: "Core" },
    { dayType: "cardio", focusCategory: "Cardio" },
    { dayType: "stretching", focusCategory: "Stretching" },
    { dayType: "workout", focusCategory: "Shoulders" },
  ] as const;

  for (let index = 0; index < 28; index += 1) {
    const isoDate = addDaysDateOnly(startDate, index);
    const templateDay = dayTypes[index % dayTypes.length];

    planDays.push(
      createPlanDay(
        isoDate,
        index + 1,
        templateDay.dayType,
        templateDay.focusCategory,
      ),
    );
  }

  return {
    plan: {
      id: 1,
      startDate: "2026-07-11",
      endDate: "2026-08-07",
      createdAt: "2026-07-11T08:00:00.000Z",
      bodyGoalLabel: "Lean",
      workoutTemplateName: "Starter Split",
      nutritionTemplateName: "Balanced Rotation",
      workoutModelName: "openrouter/model",
      nutritionModelName: "openrouter/model",
    },
    days: planDays,
  };
}

test("July 1, 2026 is Wednesday and July 11, 2026 is Saturday", () => {
  const julyGrid = getMonthGrid(2026, 6);

  assert.equal(julyGrid.firstWeekday, 3);
  assert.equal(julyGrid.cells[3]?.date, "2026-07-01");
  assert.equal(julyGrid.cells[13]?.date, "2026-07-11");
});

test("July 2026 contains 31 rendered dates with no duplicates or missing values", () => {
  const julyGrid = getMonthGrid(2026, 6);
  const julyDates = julyGrid.cells
    .filter((cell) => cell.isCurrentMonth && cell.date)
    .map((cell) => cell.date);

  assert.equal(julyDates.length, 31);
  assert.equal(new Set(julyDates).size, 31);
  assert.deepEqual(
    julyDates,
    Array.from({ length: 31 }, (_, index) => formatDateOnly(2026, 6, index + 1)),
  );
});

test("plan-date lookup does not shift days and keeps 2026-07-11 exact", () => {
  const planData = createCalendarPlanFixture();
  const julyGrid = buildCalendarMonthGrid({
    displayedYear: 2026,
    displayedMonthIndex: 6,
    planData,
    selectedDate: "2026-07-11",
    todayIso: "2026-07-11",
  });

  assert.equal(julyGrid.find((day) => day.date === "2026-07-10")?.hasPlan, false);
  assert.equal(julyGrid.find((day) => day.date === "2026-07-11")?.hasPlan, true);
  assert.equal(julyGrid.find((day) => day.date === "2026-07-11")?.isSelected, true);
  assert.equal(sameDateOnly("2026-07-11", "2026-07-11"), true);
});

test("dates outside the plan range stay muted but visible while plan dates show indicators", () => {
  const planData = createCalendarPlanFixture();
  const julyGrid = buildCalendarMonthGrid({
    displayedYear: 2026,
    displayedMonthIndex: 6,
    planData,
    selectedDate: "2026-07-15",
    todayIso: "2026-07-11",
  });
  const mutedDay = julyGrid.find((day) => day.date === "2026-07-05");
  const plannedWorkoutDay = julyGrid.find((day) => day.date === "2026-07-12");
  const plannedRestDay = julyGrid.find((day) => day.date === "2026-07-13");

  assert.equal(mutedDay?.dayOfMonth, 5);
  assert.equal(mutedDay?.isMuted, true);
  assert.equal(mutedDay?.isCurrentMonth, true);
  assert.equal(plannedWorkoutDay?.hasPlan, true);
  assert.equal(plannedWorkoutDay?.hasWorkout, true);
  assert.equal(plannedWorkoutDay?.hasNutrition, true);
  assert.equal(plannedRestDay?.hasPlan, true);
  assert.equal(plannedRestDay?.hasWorkout, false);
  assert.equal(plannedRestDay?.workoutCategory, "Rest Day");
});

test("Previous and Next month navigation handle July, August, and year rollover", () => {
  assert.deepEqual(shiftMonth(2026, 6, -1), { year: 2026, monthIndex: 5 });
  assert.deepEqual(shiftMonth(2026, 6, 1), { year: 2026, monthIndex: 7 });
  assert.deepEqual(shiftMonth(2026, 11, 1), { year: 2027, monthIndex: 0 });
});

test("selecting a date keeps the exact date-only value", () => {
  assert.equal(addDaysDateOnly("2026-07-10", 1), "2026-07-11");
  assert.equal(sameDateOnly("2026-07-11", "2026-07-11"), true);
});

test("day numbers are visible without hover and the compact visual structure is restored", () => {
  const gridSource = readProjectFile("src/components/client/calendar-grid.tsx");
  const screenSource = readProjectFile("src/components/client/screens/calendar-screen.tsx");

  assert.doesNotMatch(gridSource, /opacity-0/);
  assert.doesNotMatch(gridSource, /invisible/);
  assert.doesNotMatch(gridSource, /text-transparent/);
  assert.doesNotMatch(gridSource, /group-hover:/);
  assert.match(gridSource, /grid-cols-7/);
  assert.match(gridSource, /aspect-square/);
  assert.match(gridSource, /rounded-xl/);
  assert.doesNotMatch(gridSource, /No plan/);
  assert.match(screenSource, /overflow-x-hidden/);
  assert.match(screenSource, /setSelectedDate\(date\)/);
  assert.doesNotMatch(screenSource, /setDisplayMonth/);
  assert.match(screenSource, /No plan for this date\./);
});
