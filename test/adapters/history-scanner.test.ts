import * as fs from 'node:fs';

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');

  return {
    ...actual,
    existsSync: vi.fn(actual.existsSync),
  };
});

import {
  ensureDbExists,
  getOpencodeDbPath,
  normalizeMessageRecord,
  queryCurrentMonthMessages,
  queryStepFinishParts,
  scanCurrentMonthHistory,
  type MessageRecord,
} from '../../src/adapters/history-scanner';

describe('history scanner adapter', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('queries current month messages and normalizes projected fields', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 13, 15, 45, 12, 987));

    const all = vi.fn().mockReturnValue([
      {
        id: 'msg-1',
        sessionID: 'ses-1',
        data: JSON.stringify({
          role: 'assistant',
          providerID: 'minimax',
          time: { created: new Date(2026, 3, 10, 8, 30).getTime() },
          cost: 1.25,
          tokens: { total: 1234 },
        }),
      },
      {
        id: 'msg-2',
        sessionID: 'ses-2',
        data: JSON.stringify({
          role: 'user',
          model: { providerID: 'openai' },
          time: { created: new Date(2026, 3, 11, 9, 0).getTime() },
          tokens: { input: 20, output: 10, reasoning: 5 },
        }),
      },
    ]);
    const prepare = vi.fn().mockReturnValue({ all });

    const records = queryCurrentMonthMessages({ prepare } as never);

    expect(prepare).toHaveBeenCalledOnce();
    expect(all).toHaveBeenCalledWith(
      new Date(2026, 3, 1, 0, 0, 0, 0).getTime(),
      new Date(2026, 4, 1, 0, 0, 0, 0).getTime()
    );
    expect(records).toEqual([
      {
        id: 'msg-1',
        sessionID: 'ses-1',
        role: 'assistant',
        providerID: 'minimax',
        cost: 1.25,
        tokens: { total: 1234 },
        timestamp: new Date(2026, 3, 10, 8, 30).getTime(),
      },
      {
        id: 'msg-2',
        sessionID: 'ses-2',
        role: 'user',
        providerID: 'openai',
        cost: null,
        tokens: { input: 20, output: 10, reasoning: 5 },
        timestamp: new Date(2026, 3, 11, 9, 0).getTime(),
      },
    ]);
  });

  it('queries step-finish parts for the requested messages only', () => {
    const all = vi.fn().mockReturnValue([
      {
        messageID: 'msg-1',
        data: JSON.stringify({
          type: 'step-finish',
          cost: 0.75,
          tokens: { total: 400 },
        }),
      },
      {
        messageID: 'msg-2',
        data: JSON.stringify({
          type: 'step-finish',
          cost: 0,
          tokens: { input: 100, output: 20, reasoning: 5 },
        }),
      },
    ]);
    const prepare = vi.fn().mockReturnValue({ all });

    const records = queryStepFinishParts({ prepare } as never, ['msg-1', 'msg-2']);

    expect(prepare).toHaveBeenCalledOnce();
    expect(all).toHaveBeenCalledWith('msg-1', 'msg-2');
    expect(records).toEqual([
      {
        messageID: 'msg-1',
        cost: 0.75,
        tokens: { total: 400 },
      },
      {
        messageID: 'msg-2',
        cost: 0,
        tokens: { input: 100, output: 20, reasoning: 5 },
      },
    ]);
  });

  it('normalizes supported providers and drops unsupported ones', () => {
    const supported: MessageRecord = {
      id: 'msg-1',
      sessionID: 'ses-1',
      role: 'assistant',
      providerID: 'openai',
      cost: null,
      tokens: { input: 120, output: 40, reasoning: 10, cache: { read: 30, write: 0 } },
      timestamp: 123,
    };

    expect(normalizeMessageRecord(supported)).toEqual({
      provider: 'chatgpt-plus',
      tokens: 200,
      cost: null,
      timestamp: 123,
    });
    expect(normalizeMessageRecord({ ...supported, providerID: 'openrouter' })).toBeNull();
    expect(normalizeMessageRecord({ ...supported, tokens: null, cost: null })).toBeNull();
  });

  it('returns an empty scan when the OpenCode database is missing', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(getOpencodeDbPath()).toBe('C:\\Users\\chist\\.local\\share\\opencode\\opencode.db');
    expect(ensureDbExists()).toBe(false);
    expect(scanCurrentMonthHistory()).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      '[token-spend-bar] OpenCode database not found at C:\\Users\\chist\\.local\\share\\opencode\\opencode.db.'
    );
  });

  it('allows overriding the OpenCode database path via environment variable', () => {
    vi.stubEnv('OPENCODE_DB_PATH', 'D:\\custom\\opencode.db');

    expect(getOpencodeDbPath()).toBe('D:\\custom\\opencode.db');
  });

  it('logs and returns an empty scan when opening the database fails', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubEnv('OPENCODE_DB_PATH', 'Z:\\definitely-missing\\opencode.db');

    expect(scanCurrentMonthHistory()).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      '[token-spend-bar] Failed to open OpenCode database at Z:\\definitely-missing\\opencode.db.',
      expect.any(Error)
    );
  });
});
