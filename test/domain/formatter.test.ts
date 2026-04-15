import { describe, expect, it } from 'vitest';

import {
  calculateSpentPercentage,
  formatCost,
  formatRemainingSpent,
  formatTokens,
  getDisplayValue,
  shouldShowCost,
} from '../../src/domain/formatter';

describe('formatTokens', () => {
  it('returns raw numbers below one thousand', () => {
    expect(formatTokens(0)).toBe('0');
    expect(formatTokens(999)).toBe('999');
  });

  it('returns numbers with space separators at one thousand and above', () => {
    expect(formatTokens(1000)).toBe('1 000');
    expect(formatTokens(1549)).toBe('1 549');
    expect(formatTokens(10000)).toBe('10 000');
    expect(formatTokens(1234567)).toBe('1 234 567');
  });
});

describe('formatCost', () => {
  it('returns null when no cost exists', () => {
    expect(formatCost(null, '$')).toBeNull();
  });

  it('formats real cost with two decimals', () => {
    expect(formatCost(12, '$')).toBe('$12.00');
    expect(formatCost(12.345, '$')).toBe('$12.35');
  });

  it('never emits a currency string for chatgpt plus rows', () => {
    expect(shouldShowCost('chatgpt-plus')).toBe(false);
    expect(shouldShowCost('minimax')).toBe(true);
    expect(shouldShowCost('opencode-go')).toBe(true);
    expect(shouldShowCost('chatgpt-plus') ? formatCost(19.99, '$') : null).toBeNull();
  });
});

describe('getDisplayValue', () => {
  it('returns remaining when available with valid limit', () => {
    expect(getDisplayValue(500, 500, 1000)).toBe(500);
  });

  it('caps negative remaining at 0', () => {
    expect(getDisplayValue(-100, 1100, 1000)).toBe(0);
  });

  it('falls back to spent when remaining is null', () => {
    expect(getDisplayValue(null, 500, 1000)).toBe(500);
  });

  it('falls back to spent when limit is null', () => {
    expect(getDisplayValue(500, 500, null)).toBe(500);
  });

  it('falls back to spent when limit is zero', () => {
    expect(getDisplayValue(500, 500, 0)).toBe(500);
  });

  it('falls back to spent when remaining is null even with negative remaining', () => {
    expect(getDisplayValue(null, 1500, 1000)).toBe(1500);
  });
});

describe('calculateSpentPercentage', () => {
  it('calculates correct percentage', () => {
    expect(calculateSpentPercentage(500, 1000)).toBe(50);
    expect(calculateSpentPercentage(250, 1000)).toBe(25);
  });

  it('returns null when limit is null', () => {
    expect(calculateSpentPercentage(500, null)).toBeNull();
  });

  it('returns null when limit is zero', () => {
    expect(calculateSpentPercentage(500, 0)).toBeNull();
  });

  it('returns null when limit is negative', () => {
    expect(calculateSpentPercentage(500, -100)).toBeNull();
  });

  it('rounds to two decimal places', () => {
    expect(calculateSpentPercentage(333, 1000)).toBe(33.3);
    expect(calculateSpentPercentage(1, 3)).toBe(33.33);
  });
});

describe('formatRemainingSpent', () => {
  it('formats value without percentage when percentage is null', () => {
    expect(formatRemainingSpent(500, null)).toBe('500');
  });

  it('formats value with percentage', () => {
    expect(formatRemainingSpent(500, 50)).toBe('500 (50%)');
  });

  it('formats zero percentage correctly', () => {
    expect(formatRemainingSpent(1000, 0)).toBe('1000 (0%)');
  });
});
