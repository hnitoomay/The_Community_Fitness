export interface DateOnlyParts {
  year: number;
  monthIndex: number;
  day: number;
}

export interface MonthGridCell {
  key: string;
  date: string | null;
  dayOfMonth: number | null;
  isCurrentMonth: boolean;
}

function padDateOnlyValue(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateOnly(year: number, monthIndex: number, day: number) {
  return `${year}-${padDateOnlyValue(monthIndex + 1)}-${padDateOnlyValue(day)}`;
}

export function parseDateOnly(value: string): DateOnlyParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(`Invalid date-only value: ${value}`);
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsedDate = new Date(year, monthIndex, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== monthIndex ||
    parsedDate.getDate() !== day
  ) {
    throw new Error(`Invalid date-only value: ${value}`);
  }

  return { year, monthIndex, day };
}

export function sameDateOnly(a: string, b: string) {
  return a === b;
}

export function addDaysDateOnly(value: string, amount: number) {
  const { year, monthIndex, day } = parseDateOnly(value);
  const nextDate = new Date(year, monthIndex, day + amount);

  return formatDateOnly(
    nextDate.getFullYear(),
    nextDate.getMonth(),
    nextDate.getDate(),
  );
}

export function shiftMonth(year: number, monthIndex: number, delta: number) {
  const shiftedDate = new Date(year, monthIndex + delta, 1);

  return {
    year: shiftedDate.getFullYear(),
    monthIndex: shiftedDate.getMonth(),
  };
}

export function formatMonthLabel(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function getMonthGrid(year: number, monthIndex: number) {
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: MonthGridCell[] = [];

  for (let offset = 0; offset < firstWeekday; offset += 1) {
    cells.push({
      key: `blank-${year}-${monthIndex}-${offset}`,
      date: null,
      dayOfMonth: null,
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      key: formatDateOnly(year, monthIndex, day),
      date: formatDateOnly(year, monthIndex, day),
      dayOfMonth: day,
      isCurrentMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `blank-tail-${year}-${monthIndex}-${cells.length}`,
      date: null,
      dayOfMonth: null,
      isCurrentMonth: false,
    });
  }

  return {
    year,
    monthIndex,
    firstWeekday,
    daysInMonth,
    cells,
  };
}

export function getTodayDateOnly(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const partByType = new Map(parts.map((part) => [part.type, part.value] as const));

  return `${partByType.get("year")}-${partByType.get("month")}-${partByType.get("day")}`;
}
