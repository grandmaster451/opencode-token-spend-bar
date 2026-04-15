import { expect } from 'vitest';

import type { ProviderRowViewModel, WidgetViewModel } from '../../src/services/usage-aggregator';
import type { createMockPluginHarness } from './mock-api';

export function makeRow(overrides: Partial<ProviderRowViewModel> = {}): ProviderRowViewModel {
  return {
    bucket: 'minimax',
    label: 'MM',
    tokens: 0,
    tokensFormatted: '0',
    cost: null,
    costFormatted: null,
    showCost: false,
    remaining: null,
    remainingFormatted: '0',
    percentage: null,
    hasRemainingQuota: false,
    ...overrides,
  };
}

export function readViewModel(
  harness: ReturnType<typeof createMockPluginHarness>
): WidgetViewModel {
  const rendered = harness.renderSidebarContent() as { kind: string; viewModel: WidgetViewModel };
  expect(rendered.kind).toBe('SessionSpendWidget');
  return rendered.viewModel;
}
