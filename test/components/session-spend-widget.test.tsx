import { describe, expect, it } from 'vitest';

import { formatRow } from '../../src/components/format-row';
import type { ProviderRowViewModel } from '../../src/services/usage-aggregator';
import { makeRow } from '../helpers/test-utils';

describe('SessionSpendWidget formatRow', () => {
  describe('normal width (≥40 columns)', () => {
    it('renders all three providers with tokens and cost', () => {
      const rows: ProviderRowViewModel[] = [
        makeRow({ bucket: 'minimax', label: 'MM', tokens: 1200, tokensFormatted: '1.2k', cost: 0.45, costFormatted: '$0.45', showCost: true }),
        makeRow({ bucket: 'opencode-go', label: 'OCG', tokens: 3000, tokensFormatted: '3.0k', cost: 2.25, costFormatted: '$2.25', showCost: true }),
        makeRow({ bucket: 'chatgpt-plus', label: 'GPT+', tokens: 2500, tokensFormatted: '2.5k', cost: null, costFormatted: null, showCost: false }),
      ];

      expect(formatRow(rows[0], false)).toBe('MM  1.2k  $0.45');
      expect(formatRow(rows[1], false)).toBe('OCG  3.0k  $2.25');
      expect(formatRow(rows[2], false)).toBe('GPT+  2.5k');
    });

    it('renders zero-data state without overflow', () => {
      const rows: ProviderRowViewModel[] = [
        makeRow({ bucket: 'minimax', label: 'MM', tokens: 0, tokensFormatted: '0', cost: null, costFormatted: null, showCost: false }),
        makeRow({ bucket: 'opencode-go', label: 'OCG', tokens: 0, tokensFormatted: '0', cost: null, costFormatted: null, showCost: false }),
        makeRow({ bucket: 'chatgpt-plus', label: 'GPT+', tokens: 0, tokensFormatted: '0', cost: null, costFormatted: null, showCost: false }),
      ];

      expect(formatRow(rows[0], false)).toBe('MM  0');
      expect(formatRow(rows[1], false)).toBe('OCG  0');
      expect(formatRow(rows[2], false)).toBe('GPT+  0');
    });

    it('renders row with cost when showCost is true and costFormatted exists', () => {
      const row = makeRow({ bucket: 'minimax', label: 'MM', tokens: 500, tokensFormatted: '500', cost: 1.5, costFormatted: '$1.50', showCost: true });
      expect(formatRow(row, false)).toBe('MM  500  $1.50');
    });

    it('renders row without cost when showCost is false even if costFormatted exists', () => {
      const row = makeRow({ bucket: 'minimax', label: 'MM', tokens: 500, tokensFormatted: '500', cost: 1.5, costFormatted: '$1.50', showCost: false });
      expect(formatRow(row, false)).toBe('MM  500');
    });

    it('renders row without cost when showCost is true but costFormatted is null', () => {
      const row = makeRow({ bucket: 'minimax', label: 'MM', tokens: 500, tokensFormatted: '500', cost: null, costFormatted: null, showCost: true });
      expect(formatRow(row, false)).toBe('MM  500');
    });
  });

  describe('narrow width (<40 columns)', () => {
    it('formats rows compactly with colon separator', () => {
      const rows: ProviderRowViewModel[] = [
        makeRow({ bucket: 'minimax', label: 'MM', tokens: 1200, tokensFormatted: '1.2k', cost: 0.45, costFormatted: '$0.45', showCost: true }),
        makeRow({ bucket: 'opencode-go', label: 'OCG', tokens: 3000, tokensFormatted: '3.0k', cost: 2.25, costFormatted: '$2.25', showCost: true }),
        makeRow({ bucket: 'chatgpt-plus', label: 'GPT+', tokens: 2500, tokensFormatted: '2.5k', cost: null, costFormatted: null, showCost: false }),
      ];

      expect(formatRow(rows[0], true)).toBe('MM:1.2k/$0.45');
      expect(formatRow(rows[1], true)).toBe('OCG:3.0k/$2.25');
      expect(formatRow(rows[2], true)).toBe('GPT+:2.5k');
    });

    it('formats zero-data state compactly', () => {
      const row = makeRow({ bucket: 'minimax', label: 'MM', tokens: 0, tokensFormatted: '0', cost: null, costFormatted: null, showCost: false });
      expect(formatRow(row, true)).toBe('MM:0');
    });

    it('never wraps or overflows — max row width under 25 chars', () => {
      const rows: ProviderRowViewModel[] = [
        makeRow({ bucket: 'minimax', label: 'MM', tokens: 99999, tokensFormatted: '100.0k', cost: 999.99, costFormatted: '$999.99', showCost: true }),
        makeRow({ bucket: 'opencode-go', label: 'OCG', tokens: 99999, tokensFormatted: '100.0k', cost: 999.99, costFormatted: '$999.99', showCost: true }),
        makeRow({ bucket: 'chatgpt-plus', label: 'GPT+', tokens: 99999, tokensFormatted: '100.0k', cost: null, costFormatted: null, showCost: false }),
      ];

      for (const row of rows) {
        const normal = formatRow(row, false);
        const narrow = formatRow(row, true);
        expect(normal.length).toBeLessThanOrEqual(25);
        expect(narrow.length).toBeLessThanOrEqual(25);
      }
    });
  });

  describe('fixed row order', () => {
    it('always outputs rows in MM, OCG, GPT+ order', () => {
      const rows: ProviderRowViewModel[] = [
        makeRow({ bucket: 'minimax', label: 'MM', tokens: 100, tokensFormatted: '100', cost: 0.5, costFormatted: '$0.50', showCost: true }),
        makeRow({ bucket: 'opencode-go', label: 'OCG', tokens: 200, tokensFormatted: '200', cost: 1.0, costFormatted: '$1.00', showCost: true }),
        makeRow({ bucket: 'chatgpt-plus', label: 'GPT+', tokens: 300, tokensFormatted: '300', cost: null, costFormatted: null, showCost: false }),
      ];

      const labels = rows.map((r) => r.label);
      expect(labels).toEqual(['MM', 'OCG', 'GPT+']);
    });
  });
});
