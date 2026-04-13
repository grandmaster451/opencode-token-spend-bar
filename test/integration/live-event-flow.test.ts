import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as historyScanner from '../../src/adapters/history-scanner';
import defaultPlugin, { TokenSpendBarPlugin, tui } from '../../src/index';
import { createAssistantMessage, createMockPluginHarness } from '../helpers/mock-api';
import { readViewModel } from '../helpers/test-utils';

import type { WidgetViewModel } from '../../src/services/usage-aggregator';

vi.mock('../../src/components/SessionSpendWidget', () => ({
  SessionSpendWidget: ({ viewModel }: { viewModel: WidgetViewModel }) => ({
    kind: 'SessionSpendWidget',
    viewModel,
  }),
}));

describe('integration: live event flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-04-15T12:00:00Z'));
    vi.spyOn(historyScanner, 'scanCurrentMonthHistory').mockReturnValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('exports the plugin through package entrypoints', () => {
    expect(defaultPlugin).toBe(TokenSpendBarPlugin);
    expect(tui).toBe(TokenSpendBarPlugin);
  });

  it('registers the session slot, processes completed message.updated events, and refreshes the TUI', async () => {
    const harness = createMockPluginHarness();
    await TokenSpendBarPlugin(harness.api, undefined, {} as never);

    expect(readViewModel(harness).rows).toEqual([
      expect.objectContaining({ bucket: 'minimax', tokens: 0, cost: null, showCost: false }),
      expect.objectContaining({ bucket: 'opencode-go', tokens: 0, cost: null, showCost: false }),
      expect.objectContaining({ bucket: 'chatgpt-plus', tokens: 0, cost: null, showCost: false }),
    ]);

    harness.emitMessageUpdated(
      createAssistantMessage({
        providerID: 'minimax',
        cost: 0.45,
        tokens: { total: 1200, input: 500, output: 700, reasoning: 0, cache: { read: 0, write: 0 } },
        time: { created: 10, completed: undefined },
      }),
    );

    expect(harness.getRenderRequestCount()).toBe(0);
    expect(readViewModel(harness).rows[0]).toMatchObject({ tokens: 0, cost: null, showCost: false });

    harness.emitMessageUpdated(
      createAssistantMessage({
        id: 'message-live-1',
        providerID: 'minimax',
        cost: 0.45,
        tokens: { total: 1200, input: 500, output: 700, reasoning: 0, cache: { read: 0, write: 0 } },
        time: { created: 10, completed: 20 },
      }),
    );

    expect(harness.getRenderRequestCount()).toBe(1);
    expect(readViewModel(harness).rows[0]).toMatchObject({
      bucket: 'minimax',
      label: 'MM',
      tokens: 1200,
      tokensFormatted: '1.2k',
      cost: 0.45,
      costFormatted: '$0.45',
      showCost: true,
    });
  });

  it('unsubscribes live listeners on disposal', async () => {
    const harness = createMockPluginHarness();
    await TokenSpendBarPlugin(harness.api, undefined, {} as never);
    await harness.dispose();

    harness.emitMessageUpdated(
      createAssistantMessage({
        id: 'message-after-dispose',
        providerID: 'minimax',
        cost: 1,
        tokens: { total: 300, input: 100, output: 200, reasoning: 0, cache: { read: 0, write: 0 } },
        time: { created: 30, completed: 40 },
      }),
    );

    expect(harness.getRenderRequestCount()).toBe(0);
    expect(readViewModel(harness).rows[0]).toMatchObject({ tokens: 0, cost: null, showCost: false });
  });
});
