import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runFixture } from './fixture-test-utils';

describe('fixture: missing cost', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('hides currency for metered providers when any record has null cost', async () => {
    const result = await runFixture({
      title: 'missing-cost',
      description: 'Metered providers fall back to token-only display when cost is missing',
      liveRecords: [
        { provider: 'minimax', tokens: 400, cost: 0.5, timestamp: 501 },
        { provider: 'minimax', tokens: 100, cost: null, timestamp: 502 },
        { provider: 'opencode-go', tokens: 600, cost: null, timestamp: 503 },
      ],
    });

    expect(result.viewModel.rows).toEqual([
      expect.objectContaining({
        bucket: 'minimax',
        tokens: 500,
        cost: null,
        costFormatted: null,
        showCost: false,
      }),
      expect.objectContaining({
        bucket: 'opencode-go',
        tokens: 600,
        cost: null,
        costFormatted: null,
        showCost: false,
      }),
      expect.objectContaining({ bucket: 'chatgpt-plus', tokens: 0, cost: null, showCost: false }),
    ]);
    expect(result.normalLines).toEqual(['MM  500', 'OCG  600', 'GPT+  0']);
    expect(result.snapshot).toMatchSnapshot();
  });
});
