import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as historyScanner from '../../src/adapters/history-scanner';
import { UsageAggregator, createAggregator } from '../../src/services/usage-aggregator';
import { createLedger } from '../../src/state/kv-ledger';
import { MockKV } from '../helpers/mock-kv';

describe('usage aggregator edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-04-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not double count records already processed during initialization', async () => {
    const kv = new MockKV();
    const record = { provider: 'minimax', tokens: 100, cost: 1, timestamp: 42 } as const;
    vi.spyOn(historyScanner, 'scanCurrentMonthHistory').mockReturnValue([record]);

    const aggregator = createAggregator(kv);
    await aggregator.initialize();
    aggregator.processRecord(record);

    expect(aggregator.getViewModel().rows[0]).toMatchObject({ tokens: 100, cost: 1 });
  });

  it('hides cost for usage-only rows when a metered provider has no real cost', () => {
    const aggregator = new UsageAggregator(createLedger(new MockKV()));

    aggregator.processRecord({ provider: 'minimax', tokens: 250, cost: null, timestamp: 1 });
    aggregator.processRecord({ provider: 'opencode-go', tokens: 125, cost: null, timestamp: 2 });

    expect(aggregator.getViewModel().rows.slice(0, 2)).toEqual([
      expect.objectContaining({ bucket: 'minimax', tokens: 250, cost: null, costFormatted: null, showCost: false }),
      expect.objectContaining({ bucket: 'opencode-go', tokens: 125, cost: null, costFormatted: null, showCost: false }),
    ]);
  });

  it('ignores unsupported providers from history and live updates', async () => {
    const kv = new MockKV();
    vi.spyOn(historyScanner, 'scanCurrentMonthHistory').mockReturnValue([
      { provider: 'openrouter', tokens: 999, cost: 9.99, timestamp: 1 } as never,
    ]);

    const aggregator = createAggregator(kv);
    await aggregator.initialize();
    aggregator.processRecord({ provider: 'anthropic', tokens: 500, cost: 5, timestamp: 2 } as never);

    expect(aggregator.getViewModel().rows).toEqual([
      expect.objectContaining({ bucket: 'minimax', tokens: 0 }),
      expect.objectContaining({ bucket: 'opencode-go', tokens: 0 }),
      expect.objectContaining({ bucket: 'chatgpt-plus', tokens: 0, cost: null, showCost: false }),
    ]);
  });
});
