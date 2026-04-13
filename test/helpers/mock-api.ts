import type { CliRenderer } from '@opentui/core';
import type { JSX } from 'solid-js';

import type { AssistantMessage, Event, EventMessageUpdated } from '@opencode-ai/sdk/v2';
import type {
  TuiDispose,
  TuiHostSlotMap,
  TuiPluginApi,
  TuiSlotContext,
} from '@opencode-ai/plugin/tui';

import { MockKV } from './mock-kv';

export { MockKV };

type SessionPromptRightRenderer = (
  ctx: TuiSlotContext,
  props: TuiHostSlotMap['session_prompt_right'],
) => JSX.Element;

export type MockPluginHarness = {
  api: TuiPluginApi;
  kv: MockKV;
  emitMessageUpdated: (message: AssistantMessage) => void;
  renderSessionPromptRight: (props?: Partial<TuiHostSlotMap['session_prompt_right']>) => JSX.Element;
  getRenderRequestCount: () => number;
  dispose: () => Promise<void>;
};

export function createMockPluginHarness(kv = new MockKV()): MockPluginHarness {
  const controller = new AbortController();
  const disposeCallbacks = new Set<TuiDispose>();
  const messageUpdatedHandlers = new Set<(event: EventMessageUpdated) => void>();

  let renderRequests = 0;
  let slotRenderer: SessionPromptRightRenderer | undefined;
  let slotRegistrationCount = 0;

  const api = {
    kv,
    renderer: {
      requestRender: () => {
        renderRequests += 1;
      },
    } as unknown as CliRenderer,
    event: {
      on: <Type extends Event['type']>(
        type: Type,
        handler: (event: Extract<Event, { type: Type }>) => void,
      ) => {
        if (type !== 'message.updated') {
          return () => undefined;
        }

        const typedHandler = handler as unknown as (event: EventMessageUpdated) => void;
        messageUpdatedHandlers.add(typedHandler);

        return () => {
          messageUpdatedHandlers.delete(typedHandler);
        };
      },
    },
    slots: {
      register: (plugin) => {
        const renderer = plugin.slots?.session_prompt_right;
        if (renderer) {
          slotRenderer = renderer;
        }

        slotRegistrationCount += 1;
        return `mock-slot-${slotRegistrationCount}`;
      },
    },
    lifecycle: {
      signal: controller.signal,
      onDispose: (fn: TuiDispose) => {
        disposeCallbacks.add(fn);
        return () => {
          disposeCallbacks.delete(fn);
        };
      },
    },
  } as unknown as TuiPluginApi;

  return {
    api,
    kv,
    emitMessageUpdated(message: AssistantMessage) {
      const event: EventMessageUpdated = {
        type: 'message.updated',
        properties: {
          sessionID: message.sessionID,
          info: message,
        },
      };

      for (const handler of messageUpdatedHandlers) {
        handler(event);
      }
    },
    renderSessionPromptRight(props = {}) {
      if (!slotRenderer) {
        throw new Error('session_prompt_right slot was not registered');
      }

      return slotRenderer(
        {
          theme: {} as TuiSlotContext['theme'],
        },
        {
          session_id: 'session-1',
          ...props,
        },
      );
    },
    getRenderRequestCount() {
      return renderRequests;
    },
    async dispose() {
      controller.abort();

      for (const callback of [...disposeCallbacks]) {
        await callback();
      }
    },
  };
}

export function createAssistantMessage(overrides: Partial<AssistantMessage> = {}): AssistantMessage {
  const base: AssistantMessage = {
    id: 'message-1',
    sessionID: 'session-1',
    role: 'assistant',
    time: {
      created: 1,
      completed: 2,
    },
    parentID: 'message-0',
    modelID: 'model-1',
    providerID: 'minimax',
    mode: 'chat',
    agent: 'main',
    path: {
      cwd: 'C:/workspace',
      root: 'C:/workspace',
    },
    cost: 1.25,
    tokens: {
      total: 500,
      input: 200,
      output: 250,
      reasoning: 50,
      cache: {
        read: 0,
        write: 0,
      },
    },
  };

  return {
    ...base,
    ...overrides,
    time: {
      ...base.time,
      ...overrides.time,
    },
    path: {
      ...base.path,
      ...overrides.path,
    },
    tokens: {
      ...base.tokens,
      ...overrides.tokens,
      cache: {
        ...base.tokens.cache,
        ...overrides.tokens?.cache,
      },
    },
  };
}
