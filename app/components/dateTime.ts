// Pure date/time helpers for DateTimeSheet. No React Native imports so these
// stay trivially testable. `month` is 0-based to match the JS Date convention.

// Monday-first weekday index (0 = Mon … 6 = Sun) for a given JS Date day.
const mondayFirst = (jsDay: number) => (jsDay + 6) % 7;

// 6 rows x 7 cols, Monday-first. Empty leading/trailing cells are null so the
// grid keeps a fixed height regardless of how the month falls.
export function buildMonthMatrix(year: number, month: number): (number | null)[][] {
  const firstWeekday = mondayFirst(new Date(year, month, 1).getDay());
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length < 42) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let r = 0; r < 6; r++) rows.push(cells.slice(r * 7, r * 7 + 7));
  return rows;
}

export function combineDateTime(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
): Date {
  return new Date(year, month, day, hours, minutes, 0, 0);
}

// Nearest item index for a scroll offset, clamped to [0, count - 1].
export function snapIndex(offsetY: number, itemHeight: number, count: number): number {
  const i = Math.round(offsetY / itemHeight);
  return Math.max(0, Math.min(count - 1, i));
}

export const hourOptions = (): number[] => Array.from({ length: 24 }, (_, i) => i);

export const minuteOptions = (step: number): number[] => {
  const out: number[] = [];
  for (let m = 0; m < 60; m += step) out.push(m);
  return out;
};
