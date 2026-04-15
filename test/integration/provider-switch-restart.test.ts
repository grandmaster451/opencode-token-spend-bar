import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as historyScanner from '../../src/adapters/history-scanner';
import { TokenSpendBarPlugin } from '../../src/plugin';
import { MockKV, createAssistantMessage, createMockPluginHarness } from '../helpers/mock-api';
import { readViewModel } from '../helpers/test-utils';

import type { WidgetViewModel } from '../../src/services/usage-aggregator';

vi.mock('../../src/components/SessionSpendWidget', () => ({
  SessionSpendWidget: ({ viewModel }: { viewModel: WidgetViewModel }) => ({
    kind: 'SessionSpendWidget',
    viewModel,
  }),
}));

describe('integration: provider switch and restart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-04-15T12:00:00Z'));
    vi.spyOn(historyScanner, 'scanCurrentMonthHistory').mockReturnValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps provider rows separate across a mid-session switch and preserves state after restart', async () => {
    const kv = new MockKV();
    const firstHarness = createMockPluginHarness(kv);

    await TokenSpendBarPlugin(firstHarness.api, undefined, {} as never);

    firstHarness.emitMessageUpdated(
      createAssistantMessage({
        id: 'message-mm-1',
        providerID: 'minimax',
        cost: 1.5,
        tokens: {
          total: 1000,
          input: 400,
          output: 600,
          reasoning: 0,
          cache: { read: 0, write: 0 },
        },
        time: { created: 100, completed: 110 },
      })
    );
    firstHarness.emitMessageUpdated(
      createAssistantMessage({
        id: 'message-gpt-1',
        providerID: 'openai',
        cost: 20,
        tokens: {
          total: 2500,
          input: 1200,
          output: 1300,
          reasoning: 0,
          cache: { read: 0, write: 0 },
        },
        time: { created: 120, completed: 130 },
      })
    );

    expect(readViewModel(firstHarness).rows).toEqual([
      expect.objectContaining({ bucket: 'minimax', tokens: 1000, cost: 1.5, showCost: true }),
      expect.objectContaining({ bucket: 'opencode-go', tokens: 0, cost: null, showCost: false }),
      expect.objectContaining({
        bucket: 'chatgpt-plus',
        tokens: 2500,
        cost: null,
        showCost: false,
      }),
    ]);
    expect(firstHarness.getRenderRequestCount()).toBe(1);

    await firstHarness.dispose();
    firstHarness.emitMessageUpdated(
      createAssistantMessage({
        id: 'message-mm-after-dispose',
        providerID: 'minimax',
        cost: 9,
        tokens: {
          total: 9000,
          input: 4500,
          output: 4500,
          reasoning: 0,
          cache: { read: 0, write: 0 },
        },
        time: { created: 140, completed: 150 },
      })
    );

    const secondHarness = createMockPluginHarness(kv);
    await TokenSpendBarPlugin(secondHarness.api, undefined, {} as never);

    expect(historyScanner.scanCurrentMonthHistory).toHaveBeenCalledTimes(0);
    expect(readViewModel(secondHarness).rows).toEqual([
      expect.objectContaining({ bucket: 'minimax', tokens: 1000, cost: 1.5, showCost: true }),
      expect.objectContaining({ bucket: 'opencode-go', tokens: 0, cost: null, showCost: false }),
      expect.objectContaining({
        bucket: 'chatgpt-plus',
        tokens: 2500,
        cost: null,
        showCost: false,
      }),
    ]);

    secondHarness.emitMessageUpdated(
      createAssistantMessage({
        id: 'message-gpt-2',
        providerID: 'openai',
        cost: 20,
        tokens: { total: 500, input: 200, output: 300, reasoning: 0, cache: { read: 0, write: 0 } },
        time: { created: 160, completed: 170 },
      })
    );

    expect(readViewModel(secondHarness).rows).toEqual([
      expect.objectContaining({ bucket: 'minimax', tokens: 1000, cost: 1.5, showCost: true }),
      expect.objectContaining({ bucket: 'opencode-go', tokens: 0, cost: null, showCost: false }),
      expect.objectContaining({
        bucket: 'chatgpt-plus',
        tokens: 3000,
        cost: null,
        showCost: false,
      }),
    ]);
    expect(secondHarness.getRenderRequestCount()).toBe(1);
  });
});
