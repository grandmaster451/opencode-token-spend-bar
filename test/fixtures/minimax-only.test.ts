import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runFixture } from './fixture-test-utils';

describe('fixture: minimax only', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('aggregates a pure MiniMax month', async () => {
    const result = await runFixture({
      title: 'minimax-only',
      description: 'Pure MiniMax usage with metered cost',
      liveRecords: [
        { provider: 'minimax', tokens: 1200, cost: 0.45, timestamp: 101 },
        { provider: 'minimax', tokens: 800, cost: 0.35, timestamp: 102 },
      ],
    });

    expect(result.viewModel.rows).toEqual([
      expect.objectContaining({ bucket: 'minimax', tokens: 2000, cost: 0.8, showCost: true }),
      expect.objectContaining({ bucket: 'opencode-go', tokens: 0, cost: null, showCost: false }),
      expect.objectContaining({ bucket: 'chatgpt-plus', tokens: 0, cost: null, showCost: false }),
    ]);
    expect(result.normalLines).toEqual(['MM  2 000  ($0.80)', 'OCG  0', 'GPT+  0']);
    expect(result.snapshot).toMatchSnapshot();
  });
});
