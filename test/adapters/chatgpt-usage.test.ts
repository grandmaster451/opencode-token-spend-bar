import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchChatGPTUsage } from '../../src/adapters/chatgpt-usage';

describe('ChatGPT usage adapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches usage data successfully and returns QuotaData', async () => {
    const mockResponse: WhisperUsageResponse = {
      await_guilds: 50,
      await_usage: 500000,
      subscription_has_applied: true,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    global.fetch = fetchMock;

    const result = await fetchChatGPTUsage('test-token');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('https://chatgpt.com/backend-api/wham/usage', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
    });

    expect(result).toEqual({
      requests: {
        limit: 100,
        remaining: 50,
        percentage: 50,
      },
      tokens: {
        limit: 1_000_000,
        remaining: 500000,
        percentage: 50,
      },
    });
  });

  it('returns null on non-OK response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    global.fetch = fetchMock;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await fetchChatGPTUsage('invalid-token');

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith('[token-spend-bar] ChatGPT usage endpoint returned 401');
  });

  it('returns null and logs warning when fetch throws', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network failure'));

    global.fetch = fetchMock;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await fetchChatGPTUsage('test-token');

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      '[token-spend-bar] Failed to fetch ChatGPT usage data from unofficial endpoint.'
    );
  });

  it('returns null when response data is invalid', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        subscription_has_applied: false,
      }),
    });

    global.fetch = fetchMock;

    const result = await fetchChatGPTUsage('test-token');

    expect(result).toBeNull();
  });

  it('calculates correct percentage when usage is at limit', async () => {
    const mockResponse: WhisperUsageResponse = {
      await_guilds: 100,
      await_usage: 1_000_000,
      subscription_has_applied: true,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    global.fetch = fetchMock;

    const result = await fetchChatGPTUsage('test-token');

    expect(result?.requests.percentage).toBe(100);
    expect(result?.tokens.percentage).toBe(100);
  });
});

type WhisperUsageResponse = {
  await_guilds: number;
  await_usage: number;
  subscription_has_applied: boolean;
};
