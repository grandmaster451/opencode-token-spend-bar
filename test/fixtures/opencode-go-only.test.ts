import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runFixture } from './fixture-test-utils';

describe('fixture: opencode-go only', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('aggregates a pure OpenCode Go session', async () => {
    const result = await runFixture({
      title: 'opencode-go-only',
      description: 'Pure OpenCode Go usage with metered cost (session-only)',
      liveRecords: [
        { provider: 'opencode-go', tokens: 3000, cost: 2.25, timestamp: 201 },
        { provider: 'opencode-go', tokens: 500, cost: 0.15, timestamp: 202 },
      ],
    });

    expect(result.viewModel.rows).toEqual([
      expect.objectContaining({ bucket: 'minimax', tokens: 0, cost: null, showCost: false }),
      expect.objectContaining({ bucket: 'opencode-go', tokens: 3500, cost: 2.4, showCost: true }),
      expect.objectContaining({ bucket: 'chatgpt-plus', tokens: 0, cost: null, showCost: false }),
    ]);
    expect(result.normalLines).toEqual(['MM  0', 'OCG  3 500  ($2.40)', 'GPT+  0']);
    expect(result.snapshot).toMatchSnapshot();
  });
});
