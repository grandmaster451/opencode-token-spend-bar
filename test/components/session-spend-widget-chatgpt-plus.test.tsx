import { describe, expect, it } from 'vitest';

import { formatRow } from '../../src/components/format-row';
import type { ProviderRowViewModel } from '../../src/services/usage-aggregator';
import { makeRow } from '../helpers/test-utils';

describe('ChatGPT Plus row never shows currency', () => {
  it('never shows currency symbol in normal width', () => {
    const row = makeRow({
      bucket: 'chatgpt-plus',
      label: 'GPT+',
      tokens: 2500,
      tokensFormatted: '2.5k',
      cost: null,
      costFormatted: null,
      showCost: false,
      remaining: 7500,
      remainingFormatted: '7.5k',
      percentage: 25,
    });

    const output = formatRow(row, false);
    expect(output).toBe('GPT+  7.5k  | 25% used');
    expect(output).not.toContain('$');
  });

  it('never shows currency symbol in narrow width', () => {
    const row = makeRow({
      bucket: 'chatgpt-plus',
      label: 'GPT+',
      tokens: 2500,
      tokensFormatted: '2.5k',
      cost: null,
      costFormatted: null,
      showCost: false,
      remaining: 7500,
      remainingFormatted: '7.5k',
      percentage: 25,
    });

    const output = formatRow(row, true);
    expect(output).toBe('GPT+:7.5k/25%');
    expect(output).not.toContain('$');
  });

  it('never shows currency even if cost data were accidentally present', () => {
    const row = makeRow({
      bucket: 'chatgpt-plus',
      label: 'GPT+',
      tokens: 5000,
      tokensFormatted: '5.0k',
      cost: 19.99,
      costFormatted: '$19.99',
      showCost: false,
      remaining: 5000,
      remainingFormatted: '5.0k',
      percentage: 50,
    });

    const normalOutput = formatRow(row, false);
    const narrowOutput = formatRow(row, true);

    expect(normalOutput).toBe('GPT+  5.0k  | 50% used');
    expect(narrowOutput).toBe('GPT+:5.0k/50%');
    expect(normalOutput).not.toContain('$');
    expect(narrowOutput).not.toContain('$');
  });

  it('shows only remaining in zero-data state', () => {
    const row = makeRow({
      bucket: 'chatgpt-plus',
      label: 'GPT+',
      tokens: 0,
      tokensFormatted: '0',
      cost: null,
      costFormatted: null,
      showCost: false,
      remaining: null,
      remainingFormatted: '0',
      percentage: null,
    });

    expect(formatRow(row, false)).toBe('GPT+  0');
    expect(formatRow(row, true)).toBe('GPT+:0');
  });

  it('contrasts with a cost-showing provider that does display currency', () => {
    const gptRow = makeRow({
      bucket: 'chatgpt-plus',
      label: 'GPT+',
      tokens: 1000,
      tokensFormatted: '1.0k',
      cost: null,
      costFormatted: null,
      showCost: false,
      remaining: 9000,
      remainingFormatted: '9.0k',
      percentage: 10,
    });

    const mmRow: ProviderRowViewModel = {
      bucket: 'minimax',
      label: 'MM',
      tokens: 1000,
      tokensFormatted: '1.0k',
      cost: 0.5,
      costFormatted: '$0.50',
      showCost: true,
      remaining: 9000,
      remainingFormatted: '9.0k',
      percentage: 10,
    };

    expect(formatRow(mmRow, false)).toContain('$');
    expect(formatRow(gptRow, false)).not.toContain('$');
  });
});
