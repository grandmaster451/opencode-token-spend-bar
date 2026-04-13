import { describe, expect, it, vi } from 'vitest';

import { getCurrentMonthBounds, isInCurrentMonth } from '../../src/domain/period';

describe('getCurrentMonthBounds', () => {
  it('returns local start and end boundaries for the current month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 13, 15, 45, 12, 987));

    const { start, end } = getCurrentMonthBounds();

    expect(start.getTime()).toBe(new Date(2026, 3, 1, 0, 0, 0, 0).getTime());
    expect(end.getTime()).toBe(new Date(2026, 4, 1, 0, 0, 0, 0).getTime());
  });

  it('rolls over correctly at year boundaries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 59, 999));

    const { start, end } = getCurrentMonthBounds();

    expect(start.getTime()).toBe(new Date(2026, 11, 1, 0, 0, 0, 0).getTime());
    expect(end.getTime()).toBe(new Date(2027, 0, 1, 0, 0, 0, 0).getTime());
  });
});

describe('isInCurrentMonth', () => {
  it('treats the range as inclusive start and exclusive end', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 13, 15, 45, 12, 987));

    const start = new Date(2026, 3, 1, 0, 0, 0, 0).getTime();
    const end = new Date(2026, 4, 1, 0, 0, 0, 0).getTime();

    expect(isInCurrentMonth(start)).toBe(true);
    expect(isInCurrentMonth(end - 1)).toBe(true);
    expect(isInCurrentMonth(start - 1)).toBe(false);
    expect(isInCurrentMonth(end)).toBe(false);
  });
});
