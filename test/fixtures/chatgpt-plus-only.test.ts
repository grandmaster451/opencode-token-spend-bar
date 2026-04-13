import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runFixture } from './fixture-test-utils';

describe('fixture: chatgpt plus only', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('aggregates a pure ChatGPT Plus month without showing currency', async () => {
    const result = await runFixture({
      title: 'chatgpt-plus-only',
      description: 'Pure ChatGPT Plus usage where spend is token-only',
      historyRecords: [
        { provider: 'chatgpt-plus', tokens: 2500, cost: null, timestamp: 301 },
        { provider: 'chatgpt-plus', tokens: 500, cost: null, timestamp: 302 },
      ],
    });

    expect(result.viewModel.rows).toEqual([
      expect.objectContaining({ bucket: 'minimax', tokens: 0, cost: null, showCost: false }),
      expect.objectContaining({ bucket: 'opencode-go', tokens: 0, cost: null, showCost: false }),
      expect.objectContaining({ bucket: 'chatgpt-plus', tokens: 3000, cost: null, showCost: false }),
    ]);
    expect(result.normalLines).toEqual(['MM  0', 'OCG  0', 'GPT+  3.0k']);
    expect(result.snapshot).toMatchSnapshot();
  });
});
