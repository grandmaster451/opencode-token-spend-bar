import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

    // April: add some session data
    vi.setSystemTime(new Date('2024-04-30T12:00:00Z'));
    const april = createAggregator(kv);
    await april.initialize();
    april.processRecord({ provider: 'minimax', tokens: 1000, cost: 1, timestamp: 701 });

    // May: new month starts fresh (session-only mode)
    vi.setSystemTime(new Date('2024-05-01T12:00:00Z'));
    const may = createAggregator(kv);
    await may.initialize();
    may.processRecord({ provider: 'opencode-go', tokens: 500, cost: 2, timestamp: 702 });

    const aprilSnapshot = [
      `month=${april.getViewModel().month}`,
      ...april.getViewModel().rows.map(row => formatRow(row, false)),
    ].join('\n');
    const maySnapshot = [
      `month=${may.getViewModel().month}`,
      ...may.getViewModel().rows.map(row => formatRow(row, false)),
    ].join('\n');

    expect(may.getViewModel()).toEqual({
      month: '2024-05',
      heading: 'Usage',
      rows: [
        expect.objectContaining({ bucket: 'minimax', tokens: 0, cost: null, showCost: false }),
        expect.objectContaining({ bucket: 'opencode-go', tokens: 500, cost: 2, showCost: true }),
        expect.objectContaining({ bucket: 'chatgpt-plus', tokens: 0, cost: null, showCost: false }),
      ],
    });
    expect(`${aprilSnapshot}\n---\n${maySnapshot}`).toMatchSnapshot();
  });
});
