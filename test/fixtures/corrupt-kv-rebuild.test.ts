import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runFixture, seedCorruptAggregateKV } from './fixture-test-utils';

describe('fixture: corrupt kv rebuild', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('rebuilds from history when the persisted aggregate is corrupt', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await runFixture({
      title: 'corrupt-kv-rebuild',
      description: 'Corrupted KV state triggers a safe history rebuild',
      historyRecords: [
        { provider: 'minimax', tokens: 900, cost: 0.9, timestamp: 801 },
        { provider: 'opencode-go', tokens: 300, cost: 1.1, timestamp: 802 },
      ],
      seedKV: seedCorruptAggregateKV,
    });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(result.viewModel.rows).toEqual([
      expect.objectContaining({ bucket: 'minimax', tokens: 900, cost: 0.9, showCost: true }),
      expect.objectContaining({ bucket: 'opencode-go', tokens: 300, cost: 1.1, showCost: true }),
      expect.objectContaining({ bucket: 'chatgpt-plus', tokens: 0, cost: null, showCost: false }),
    ]);
    expect(result.snapshot).toMatchSnapshot();
  });
});
