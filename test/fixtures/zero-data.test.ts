import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runFixture } from './fixture-test-utils';

describe('fixture: zero data', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns the stable empty widget state', async () => {
    const result = await runFixture({
      title: 'zero-data',
      description: 'No historical or live usage produces the all-zero widget',
    });

    expect(result.viewModel.rows).toEqual([
      expect.objectContaining({ bucket: 'minimax', tokens: 0, cost: null, showCost: false }),
      expect.objectContaining({ bucket: 'opencode-go', tokens: 0, cost: null, showCost: false }),
      expect.objectContaining({ bucket: 'chatgpt-plus', tokens: 0, cost: null, showCost: false }),
    ]);
    expect(result.normalLines).toEqual(['MM  0', 'OCG  0', 'GPT+  0']);
    expect(result.snapshot).toMatchSnapshot();
  });
});
