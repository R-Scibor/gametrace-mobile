import { buildMonthMatrix, combineDateTime, snapIndex, minuteOptions } from '../dateTime';

describe('buildMonthMatrix (Monday-first, month index 0-based)', () => {
  test('a month starting on Monday has no leading padding', () => {
    // June 2026 (month index 5) starts on a Monday
    const m = buildMonthMatrix(2026, 5);
    expect(m[0]).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  test('pads leading days with null up to the first weekday', () => {
    // July 2026 (month index 6) starts on a Wednesday → 2 leading nulls
    const m = buildMonthMatrix(2026, 6);
    expect(m[0]).toEqual([null, null, 1, 2, 3, 4, 5]);
  });

  test('always returns 6 rows of 7 for a stable sheet height', () => {
    const m = buildMonthMatrix(2026, 5);
    expect(m).toHaveLength(6);
    m.forEach((row) => expect(row).toHaveLength(7));
  });

  test('includes the last day and nothing beyond it', () => {
    const m = buildMonthMatrix(2026, 6); // July has 31 days
    const days = m.flat();
    expect(days).toContain(31);
    expect(days).not.toContain(32);
  });
});

describe('combineDateTime', () => {
  test('composes Y/M/D + H/M into a Date with zeroed seconds', () => {
    const d = combineDateTime(2026, 5, 21, 9, 30);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(21);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(30);
    expect(d.getSeconds()).toBe(0);
  });
});

describe('snapIndex', () => {
  test('rounds a scroll offset to the nearest item index', () => {
    expect(snapIndex(0, 44, 24)).toBe(0);
    expect(snapIndex(66, 44, 24)).toBe(2); // 1.5 rounds up
    expect(snapIndex(70, 44, 24)).toBe(2);
  });

  test('clamps to the valid range', () => {
    expect(snapIndex(-20, 44, 24)).toBe(0);
    expect(snapIndex(99999, 44, 24)).toBe(23);
  });
});

describe('minuteOptions', () => {
  test('5-minute steps from 0 to 55', () => {
    expect(minuteOptions(5)).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  });
});
