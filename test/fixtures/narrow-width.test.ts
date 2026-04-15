import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runFixture } from './fixture-test-utils';

describe('fixture: narrow width', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders compact rows for terminals narrower than 40 columns', async () => {
    const result = await runFixture({
      title: 'narrow-width',
      description: 'Compact rendering for sub-40 column terminals',
      liveRecords: [
        { provider: 'minimax', tokens: 1200, cost: 0.45, timestamp: 601 },
        { provider: 'opencode-go', tokens: 3000, cost: 2.25, timestamp: 602 },
        { provider: 'chatgpt-plus', tokens: 2500, cost: null, timestamp: 603 },
      ],
    });

    expect(result.narrowLines).toEqual(['MM:1 200/($0.45)', 'OCG:3 000/($2.25)', 'GPT+:2 500']);
    expect(result.narrowLines.every(line => line.length < 40)).toBe(true);
    expect(result.snapshot).toMatchSnapshot();
  });
});
