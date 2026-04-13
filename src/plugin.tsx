import type {
  TuiHostSlotMap,
  TuiPlugin,
  TuiSlotContext,
  TuiSlotPlugin,
} from '@opencode-ai/plugin/tui';
import type { AssistantMessage, EventMessageUpdated, Message } from '@opencode-ai/sdk/v2';

import { SessionSpendWidget } from './components/SessionSpendWidget';
import { normalizeProvider } from './domain/provider';
import { getTokenCount } from './domain/tokens';
import { createAggregator } from './services/usage-aggregator';

export const TokenSpendBarPlugin: TuiPlugin = async (api) => {
  const aggregator = createAggregator(api.kv);

  await aggregator.initialize();

  const handleMessageUpdated = (event: EventMessageUpdated): void => {
    const record = toUsageRecord(event.properties.info);
    if (!record) {
      return;
    }

    aggregator.processRecord(record);
    api.renderer.requestRender();
  };

  const unsubscribeMessageUpdated = api.event.on('message.updated', handleMessageUpdated);
  api.lifecycle.onDispose(() => {
    unsubscribeMessageUpdated();
  });

  const slotPlugin = {
    slots: {
      session_prompt_right: (
        _ctx: TuiSlotContext,
        _props: TuiHostSlotMap['session_prompt_right'],
      ) => {
        const viewModel = aggregator.getViewModel();
        return SessionSpendWidget({ viewModel });
      },
    },
  } satisfies TuiSlotPlugin;

  api.slots.register(slotPlugin);
};

function toUsageRecord(message: Message) {
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
