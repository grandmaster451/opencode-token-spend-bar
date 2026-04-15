import type {
  TuiHostSlotMap,
  TuiPlugin,
  TuiPluginMeta,
  TuiSlotContext,
  TuiSlotPlugin,
} from '@opencode-ai/plugin/tui';
import type { AssistantMessage, EventMessageUpdated, Message } from '@opencode-ai/sdk/v2';
import type { QuotaData } from './adapters/openai-headers';

import { ErrorFallback } from './components/ErrorFallback';
import { SessionSpendWidget } from './components/SessionSpendWidget';
import { normalizeProvider, type ProviderBucket } from './domain/provider';
import { getTokenCount } from './domain/tokens';
import { createQuotaAggregator } from './services/quota-aggregator';
import { createAggregator, type UsageRecord } from './services/usage-aggregator';

type TokenSpendBarOptions = {
  minimaxCookie?: string;
  chatgptToken?: string;
  fallbackLimits?: {
    requests?: number;
    tokens?: number;
  };
};

export const TokenSpendBarPlugin: TuiPlugin = async (api, options, _meta: TuiPluginMeta) => {
  let aggregator: ReturnType<typeof createAggregator> | null = null;
  let initError: Error | null = null;
  const parsedOptions = parseOptions(options);
  const quotaAggregator = createQuotaAggregator(parsedOptions);
  const quotaByProvider: Partial<Record<ProviderBucket, QuotaData | null>> = {};
  // Track in-flight quota refresh request IDs per provider to prevent stale async responses
  // from overwriting newer state (race protection for concurrent messages to same provider)
  const inFlightQuotaRequestId = new Map<ProviderBucket, number>();

  try {
    aggregator = createAggregator(api.kv);
    await aggregator.initialize();
    await refreshAllQuotas();
    api.renderer.requestRender();
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    console.error('[TokenSpendBar] Initialization failed:', initError.message);
  }

  const handleMessageUpdated = (event: EventMessageUpdated): void => {
    void handleMessageUpdatedAsync(event);
  };

  const handleMessageUpdatedAsync = async (event: EventMessageUpdated): Promise<void> => {
    if (!aggregator) return;

    const record = toUsageRecord(event.properties.info);
    if (!record) {
      return;
    }

    aggregator.processRecord(record);
    await refreshQuota(record.provider);
    api.renderer.requestRender();
  };

  const unsubscribeMessageUpdated = api.event.on('message.updated', handleMessageUpdated);
  api.lifecycle.onDispose(() => {
    unsubscribeMessageUpdated();
  });

  const slotPlugin = {
    order: 150,
    slots: {
      sidebar_content: (_ctx: TuiSlotContext, _props: TuiHostSlotMap['sidebar_content']) => {
        if (initError) {
          return ErrorFallback({ error: initError });
        }
        if (!aggregator) {
          return ErrorFallback({ error: new Error('Aggregator not initialized') });
        }
        const viewModel = aggregator.getViewModel(quotaByProvider);
        return SessionSpendWidget({
          viewModel,
          colors: {
            text: _ctx.theme?.current?.text,
            muted: _ctx.theme?.current?.textMuted,
          },
        });
      },
    },
  } satisfies TuiSlotPlugin;

  api.slots.register(slotPlugin);

  async function refreshAllQuotas(): Promise<void> {
    await Promise.all([
      refreshQuota('minimax'),
      refreshQuota('chatgpt-plus'),
      refreshQuota('opencode-go'),
    ]);
  }

  async function refreshQuota(provider: ProviderBucket): Promise<void> {
    const requestId = (inFlightQuotaRequestId.get(provider) ?? 0) + 1;
    inFlightQuotaRequestId.set(provider, requestId);

    quotaAggregator.clearCache(provider);
    const result = await quotaAggregator.getQuota(provider);

    // Only apply if this is still the latest request (discards stale responses from slower earlier calls)
    if (inFlightQuotaRequestId.get(provider) === requestId) {
      quotaByProvider[provider] = result;
    }
  }
};

function parseOptions(options: unknown): TokenSpendBarOptions {
  if (!options || typeof options !== 'object') {
    return {};
  }

  const value = options as Record<string, unknown>;

  return {
    minimaxCookie: typeof value.minimaxCookie === 'string' ? value.minimaxCookie : undefined,
    chatgptToken: typeof value.chatgptToken === 'string' ? value.chatgptToken : undefined,
    fallbackLimits:
      value.fallbackLimits && typeof value.fallbackLimits === 'object'
        ? {
            requests:
              typeof (value.fallbackLimits as Record<string, unknown>).requests === 'number'
                ? ((value.fallbackLimits as Record<string, unknown>).requests as number)
                : undefined,
            tokens:
              typeof (value.fallbackLimits as Record<string, unknown>).tokens === 'number'
                ? ((value.fallbackLimits as Record<string, unknown>).tokens as number)
                : undefined,
          }
        : undefined,
  };
}

function toUsageRecord(message: Message): UsageRecord | null {
  if (!isCompletedAssistantMessage(message)) {
    return null;
  }

  const provider = normalizeProvider(message.providerID);
  if (provider === null) {
    return null;
  }

  const tokens = getTokenCount(message.tokens);

  return {
    provider,
    tokens,
    cost: Number.isFinite(message.cost) ? message.cost : null,
    timestamp: message.time.completed,
  };
}

function isCompletedAssistantMessage(message: Message): message is AssistantMessage & {
  time: AssistantMessage['time'] & { completed: number };
} {
  return message.role === 'assistant' && typeof message.time.completed === 'number';
}
