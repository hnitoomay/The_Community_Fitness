import {
  formatMonthLabel,
  getMonthGrid,
  sameDateOnly,
} from "@/lib/date-only";
import type { ActiveGeneratedPlanCalendarData } from "@/types/generated-plan";

export interface CalendarGridDay {
  date: string;
  dayOfMonth: number;
  workoutCategory: string | null;
  hasWorkout: boolean;
  hasNutrition: boolean;
  hasPlan: boolean;
  isMuted: boolean;
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
}

export function buildCalendarMonthGrid(input: {
  displayedYear: number;
  displayedMonthIndex: number;
  planData: ActiveGeneratedPlanCalendarData;
  selectedDate: string;
  todayIso: string;
}): CalendarGridDay[] {
  const monthGrid = getMonthGrid(input.displayedYear, input.displayedMonthIndex);
  const planByDate = new Map(
    input.planData.days.map((day) => [day.planDate, day] as const),
  );

  return monthGrid.cells.map((cell) => {
    if (!cell.isCurrentMonth || !cell.date || cell.dayOfMonth === null) {
      return {
        date: cell.key,
        dayOfMonth: 0,
        workoutCategory: null,
        hasWorkout: false,
        hasNutrition: false,
        hasPlan: false,
        isMuted: true,
        isSelected: false,
        isToday: false,
        isCurrentMonth: false,
      };
    }

    const planDay = planByDate.get(cell.date);

    return {
      date: cell.date,
      dayOfMonth: cell.dayOfMonth,
      workoutCategory:
        planDay === undefined
          ? null
          : planDay.dayType === "rest"
            ? "Rest Day"
            : planDay.focusCategory ?? planDay.dayType,
      hasWorkout: planDay !== undefined && planDay.dayType !== "rest",
      hasNutrition: (planDay?.mealItemCount ?? 0) > 0,
      hasPlan: planDay !== undefined,
      isMuted: planDay === undefined,
      isSelected: sameDateOnly(cell.date, input.selectedDate),
      isToday: sameDateOnly(cell.date, input.todayIso),
      isCurrentMonth: true,
    };
  });
}

export { formatMonthLabel };
