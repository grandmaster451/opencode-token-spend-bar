import { describe, expect, it } from 'vitest';

import { formatCost, formatTokens, shouldShowCost } from '../../src/domain/formatter';

describe('formatTokens', () => {
  it('returns raw numbers below one thousand', () => {
    expect(formatTokens(0)).toBe('0');
    expect(formatTokens(999)).toBe('999');
  });

  it('returns abbreviated numbers at one thousand and above', () => {
    expect(formatTokens(1000)).toBe('1.0k');
    expect(formatTokens(1549)).toBe('1.5k');
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
