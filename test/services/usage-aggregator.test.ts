import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('initializes with empty state (session-only mode, no history loading)', async () => {
    const kv = new MockKV();

    const aggregator = createAggregator(kv);
    await aggregator.initialize();

    // Session-only: should start empty, not load history
    expect(aggregator.getViewModel()).toEqual({
      month: '2024-04',
      heading: 'Usage',
      rows: [
        {
          bucket: 'minimax',
          label: 'MM',
          tokens: 0,
          tokensFormatted: '0',
          cost: null,
          costFormatted: null,
          showCost: false,
          remaining: null,
          remainingFormatted: '0',
          percentage: null,
          hasRemainingQuota: false,
        },
        {
          bucket: 'opencode-go',
          label: 'OCG',
          tokens: 0,
          tokensFormatted: '0',
          cost: null,
          costFormatted: null,
          showCost: false,
          remaining: null,
          remainingFormatted: '0',
          percentage: null,
          hasRemainingQuota: false,
        },
        {
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
          hasRemainingQuota: false,
        },
      ],
    });
  });

  it('processes live records and persists them', () => {
    const kv = new MockKV();
    const aggregator = new UsageAggregator(createLedger(kv), { currency: '€' });

    aggregator.processRecord({ provider: 'minimax', tokens: 999, cost: 1.2, timestamp: 500 });

    expect(new UsageAggregator(createLedger(kv), { currency: '€' }).getViewModel().rows[0]).toEqual(
      {
        bucket: 'minimax',
        label: 'MM',
        tokens: 999,
        tokensFormatted: '999',
        cost: 1.2,
        costFormatted: '€1.20',
        showCost: true,
        remaining: null,
        remainingFormatted: '999',
        percentage: null,
        hasRemainingQuota: false,
      }
    );
  });

  it('accumulates tokens across multiple records in same session', () => {
    const kv = new MockKV();
    const aggregator = new UsageAggregator(createLedger(kv), { currency: '$' });

    aggregator.processRecord({ provider: 'minimax', tokens: 1200, cost: 1.5, timestamp: 101 });
    aggregator.processRecord({ provider: 'minimax', tokens: 3000, cost: 2.25, timestamp: 102 });

    const viewModel = aggregator.getViewModel();
    expect(viewModel.rows[0]).toMatchObject({
      bucket: 'minimax',
      tokens: 4200,
      tokensFormatted: '4 200',
      cost: 3.75,
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
      heading: 'Usage',
      rows: [
        {
          bucket: 'minimax',
          label: 'MM',
          tokens: 0,
          tokensFormatted: '0',
          cost: null,
          costFormatted: null,
          showCost: false,
          remaining: null,
          remainingFormatted: '0',
          percentage: null,
          hasRemainingQuota: false,
        },
        {
          bucket: 'opencode-go',
          label: 'OCG',
          tokens: 0,
          tokensFormatted: '0',
          cost: null,
          costFormatted: null,
          showCost: false,
          remaining: null,
          remainingFormatted: '0',
          percentage: null,
          hasRemainingQuota: false,
        },
        {
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
          hasRemainingQuota: false,
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
      expect.objectContaining({
        bucket: 'minimax',
        label: 'MM',
        tokens: 100,
        cost: 0.5,
        showCost: true,
      }),
      expect.objectContaining({
        bucket: 'opencode-go',
        label: 'OCG',
        tokens: 200,
        cost: 1.25,
        showCost: true,
      }),
      expect.objectContaining({
        bucket: 'chatgpt-plus',
        label: 'GPT+',
        tokens: 2500,
        cost: null,
        showCost: false,
      }),
    ]);
  });

  it('rebuilds cleanly on month rollover', async () => {
    const kv = new MockKV();

    const april = createAggregator(kv);
    await april.initialize();
    // Session-only: starts empty
    expect(april.getViewModel().rows[0]).toMatchObject({ tokens: 0, cost: null });

    // Add some data in April
    april.processRecord({ provider: 'minimax', tokens: 1000, cost: 1, timestamp: 10 });
    expect(april.getViewModel().rows[0]).toMatchObject({ tokens: 1000, cost: 1 });

    vi.setSystemTime(new Date('2024-05-01T00:00:00Z'));

    const may = createAggregator(kv);
    await may.initialize();

    // Session-only: starts empty in new month too
    expect(may.getViewModel()).toEqual({
      month: '2024-05',
      heading: 'Usage',
      rows: [
        expect.objectContaining({ bucket: 'minimax', tokens: 0, cost: null, showCost: false }),
        expect.objectContaining({ bucket: 'opencode-go', tokens: 0, cost: null, showCost: false }),
        expect.objectContaining({ bucket: 'chatgpt-plus', tokens: 0, cost: null, showCost: false }),
      ],
    });
  });
});
