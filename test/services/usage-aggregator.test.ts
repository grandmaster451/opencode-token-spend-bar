import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as historyScanner from '../../src/adapters/history-scanner';
import { createAggregator, UsageAggregator } from '../../src/services/usage-aggregator';
import { createLedger } from '../../src/state/kv-ledger';
import { MockKV } from '../helpers/mock-kv';

describe('usage aggregator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-04-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes from history when the ledger needs a rebuild', async () => {
    const kv = new MockKV();
    const scan = vi.spyOn(historyScanner, 'scanCurrentMonthHistory').mockReturnValue([
      { provider: 'minimax', tokens: 1200, cost: 1.5, timestamp: 101 },
      { provider: 'opencode-go', tokens: 3000, cost: 2.25, timestamp: 102 },
    ]);

    const aggregator = createAggregator(kv);
    await aggregator.initialize();

    expect(scan).toHaveBeenCalledOnce();
    expect(aggregator.getViewModel()).toEqual({
      month: '2024-04',
      rows: [
        {
          bucket: 'minimax',
          label: 'MM',
          tokens: 1200,
          tokensFormatted: '1.2k',
          cost: 1.5,
          costFormatted: '$1.50',
          showCost: true,
        },
        {
          bucket: 'opencode-go',
          label: 'OCG',
          tokens: 3000,
          tokensFormatted: '3.0k',
          cost: 2.25,
          costFormatted: '$2.25',
          showCost: true,
        },
        {
          bucket: 'chatgpt-plus',
          label: 'GPT+',
          tokens: 0,
          tokensFormatted: '0',
          cost: null,
          costFormatted: null,
          showCost: false,
        },
      ],
    });
  });

  it('processes live records and persists them', () => {
    const kv = new MockKV();
    const aggregator = new UsageAggregator(createLedger(kv), { currency: '€' });

    aggregator.processRecord({ provider: 'minimax', tokens: 999, cost: 1.2, timestamp: 500 });

    expect(new UsageAggregator(createLedger(kv), { currency: '€' }).getViewModel().rows[0]).toEqual({
      bucket: 'minimax',
      label: 'MM',
      tokens: 999,
      tokensFormatted: '999',
      cost: 1.2,
      costFormatted: '€1.20',
      showCost: true,
    });
  });

  it('deduplicates the same live fingerprint', () => {
    const aggregator = new UsageAggregator(createLedger(new MockKV()));

    const record = { provider: 'opencode-go', tokens: 400, cost: 0.75, timestamp: 700 } as const;
    aggregator.processRecord(record);
    aggregator.processRecord(record);

    expect(aggregator.getViewModel().rows[1]).toMatchObject({
      bucket: 'opencode-go',
      tokens: 400,
      cost: 0.75,
      showCost: true,
    });
  });

  it('treats cost as part of the deduplication fingerprint', () => {
    const aggregator = new UsageAggregator(createLedger(new MockKV()));

    aggregator.processRecord({ provider: 'opencode-go', tokens: 400, cost: 0.75, timestamp: 700 });
    aggregator.processRecord({ provider: 'opencode-go', tokens: 400, cost: 1.25, timestamp: 700 });

    expect(aggregator.getViewModel().rows[1]).toMatchObject({
      bucket: 'opencode-go',
      tokens: 800,
      cost: 2,
      showCost: true,
    });
  });

  it('returns a stable zero-data view model when nothing has been recorded', () => {
    const aggregator = new UsageAggregator(createLedger(new MockKV()));

    expect(aggregator.getViewModel()).toEqual({
      month: '2024-04',
      rows: [
        {
          bucket: 'minimax',
          label: 'MM',
          tokens: 0,
          tokensFormatted: '0',
          cost: null,
          costFormatted: null,
          showCost: false,
        },
        {
          bucket: 'opencode-go',
          label: 'OCG',
          tokens: 0,
          tokensFormatted: '0',
          cost: null,
          costFormatted: null,
          showCost: false,
        },
        {
          bucket: 'chatgpt-plus',
          label: 'GPT+',
          tokens: 0,
          tokensFormatted: '0',
          cost: null,
          costFormatted: null,
          showCost: false,
        },
      ],
    });
  });

  it('builds exactly three rows in fixed order across mixed providers', () => {
    const aggregator = new UsageAggregator(createLedger(new MockKV()));

    aggregator.processRecord({ provider: 'chatgpt-plus', tokens: 2500, cost: null, timestamp: 1 });
    aggregator.processRecord({ provider: 'minimax', tokens: 100, cost: 0.5, timestamp: 2 });
    aggregator.processRecord({ provider: 'opencode-go', tokens: 200, cost: 1.25, timestamp: 3 });

    expect(aggregator.getViewModel().rows).toEqual([
      expect.objectContaining({ bucket: 'minimax', label: 'MM', tokens: 100, cost: 0.5, showCost: true }),
      expect.objectContaining({ bucket: 'opencode-go', label: 'OCG', tokens: 200, cost: 1.25, showCost: true }),
      expect.objectContaining({ bucket: 'chatgpt-plus', label: 'GPT+', tokens: 2500, cost: null, showCost: false }),
    ]);
  });

  it('rebuilds cleanly on month rollover', async () => {
    const kv = new MockKV();
    vi.spyOn(historyScanner, 'scanCurrentMonthHistory').mockReturnValueOnce([
      { provider: 'minimax', tokens: 1000, cost: 1, timestamp: 10 },
    ]);

    const april = createAggregator(kv);
    await april.initialize();
    expect(april.getViewModel().rows[0]).toMatchObject({ tokens: 1000, cost: 1 });

    vi.setSystemTime(new Date('2024-05-01T00:00:00Z'));
    vi.spyOn(historyScanner, 'scanCurrentMonthHistory').mockReturnValueOnce([
      { provider: 'opencode-go', tokens: 500, cost: 2, timestamp: 20 },
    ]);

    const may = createAggregator(kv);
    await may.initialize();

    expect(may.getViewModel()).toEqual({
      month: '2024-05',
      rows: [
        expect.objectContaining({ bucket: 'minimax', tokens: 0, cost: null, showCost: false }),
        expect.objectContaining({ bucket: 'opencode-go', tokens: 500, cost: 2 }),
        expect.objectContaining({ bucket: 'chatgpt-plus', tokens: 0, cost: null, showCost: false }),
      ],
    });
  });
});
