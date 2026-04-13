import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as historyScanner from '../../src/adapters/history-scanner';
import { formatRow } from '../../src/components/format-row';
import { createAggregator } from '../../src/services/usage-aggregator';
import { MockKV } from '../helpers/mock-api';

describe('fixture: month rollover', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('rebuilds when the active month changes', async () => {
    const kv = new MockKV();

    vi.setSystemTime(new Date('2024-04-30T12:00:00Z'));
    const scan = vi.spyOn(historyScanner, 'scanCurrentMonthHistory').mockReturnValueOnce([
      { provider: 'minimax', tokens: 1000, cost: 1, timestamp: 701 },
    ]);

    const april = createAggregator(kv);
    await april.initialize();

    vi.setSystemTime(new Date('2024-05-01T12:00:00Z'));
    scan.mockReturnValueOnce([
      { provider: 'opencode-go', tokens: 500, cost: 2, timestamp: 702 },
    ]);

    const may = createAggregator(kv);
    await may.initialize();

    const aprilSnapshot = [
      `month=${april.getViewModel().month}`,
      ...april.getViewModel().rows.map((row) => formatRow(row, false)),
    ].join('\n');
    const maySnapshot = [
      `month=${may.getViewModel().month}`,
      ...may.getViewModel().rows.map((row) => formatRow(row, false)),
    ].join('\n');

    expect(may.getViewModel()).toEqual({
      month: '2024-05',
      rows: [
        expect.objectContaining({ bucket: 'minimax', tokens: 0, cost: null, showCost: false }),
        expect.objectContaining({ bucket: 'opencode-go', tokens: 500, cost: 2, showCost: true }),
        expect.objectContaining({ bucket: 'chatgpt-plus', tokens: 0, cost: null, showCost: false }),
      ],
    });
    expect(`${aprilSnapshot}\n---\n${maySnapshot}`).toMatchSnapshot();
  });
});
