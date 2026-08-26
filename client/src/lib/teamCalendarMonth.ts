export type CalendarDay = {
  key: string;
  day: number;
  inMonth: boolean;
};

export const CALENDAR_WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

function paraguayParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? "";
  return { year: Number(part("year")), month: Number(part("month")), day: Number(part("day")) };
}

export function calendarDayKey(value: Date) {
  const { year, month, day } = paraguayParts(value);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function monthCursorFor(value: Date) {
  const { year, month } = paraguayParts(value);
  return new Date(year, month - 1, 1, 12);
}

export function shiftCalendarMonth(cursor: Date, amount: number) {
  return new Date(cursor.getFullYear(), cursor.getMonth() + amount, 1, 12);
}

export function calendarMonthLabel(cursor: Date) {
  return new Intl.DateTimeFormat("es-PY", { month: "long", year: "numeric", timeZone: "America/Asuncion" }).format(cursor);
}

export function buildCalendarMonth(cursor: Date): CalendarDay[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1, 12);
  const mondayIndex = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - mondayIndex, 12);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index, 12);
    return {
      key: calendarDayKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
    };
  });
}
