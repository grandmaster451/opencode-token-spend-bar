import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runFixture } from './fixture-test-utils';

describe('fixture: mixed providers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps all three providers separated in fixed order', async () => {
    const result = await runFixture({
      title: 'mixed-providers',
      description: 'Mixed provider usage across the fixed three-row widget',
      historyRecords: [
        { provider: 'chatgpt-plus', tokens: 2500, cost: null, timestamp: 401 },
        { provider: 'minimax', tokens: 100, cost: 0.5, timestamp: 402 },
      ],
      liveRecords: [{ provider: 'opencode-go', tokens: 200, cost: 1.25, timestamp: 403 }],
    });

    expect(result.viewModel.rows).toEqual([
      expect.objectContaining({ bucket: 'minimax', tokens: 100, cost: 0.5, showCost: true }),
      expect.objectContaining({ bucket: 'opencode-go', tokens: 200, cost: 1.25, showCost: true }),
      expect.objectContaining({ bucket: 'chatgpt-plus', tokens: 2500, cost: null, showCost: false }),
    ]);
    expect(result.normalLines).toEqual(['MM  100  $0.50', 'OCG  200  $1.25', 'GPT+  2.5k']);
    expect(result.snapshot).toMatchSnapshot();
  });
});
