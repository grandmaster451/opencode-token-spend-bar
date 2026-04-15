import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { fetchMiniMaxQuota, type QuotaData } from '../../src/adapters/minimax-quota.ts';

describe('fetchMiniMaxQuota', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function createMockFetch(response: unknown, status = 200, statusText?: string): void {
    const defaultStatusText: Record<number, string> = {
      200: 'OK',
      401: 'Unauthorized',
      403: 'Forbidden',
      500: 'Server Error',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: statusText ?? defaultStatusText[status] ?? 'Unknown',
      json: async () => response,
    }) as typeof fetch;
  }

  it('parses MiniMax quota data correctly (used = total - remaining)', async () => {
    // MiniMax API returns current_interval_usage_count which is actually REMAINING!
    const apiResponse = {
      current_interval_usage_count: 75, // This is REMAINING (confusingly named!)
      current_interval_total_count: 100,
    };

    createMockFetch(apiResponse);

    const result = await fetchMiniMaxQuota('sessioncookie123');

    expect(result).toEqual<QuotaData>({
      requests: {
        limit: 100,
        remaining: 75,
        used: 25,
        percentage: 25,
      },
    });
  });

  it('calculates 100% usage when quota is exhausted', async () => {
    const apiResponse = {
      current_interval_usage_count: 0, // 0 remaining means 100% used
      current_interval_total_count: 100,
    };

    createMockFetch(apiResponse);

    const result = await fetchMiniMaxQuota('sessioncookie123');

    expect(result).toEqual<QuotaData>({
      requests: {
        limit: 100,
        remaining: 0,
        used: 100,
        percentage: 100,
      },
    });
  });

  it('calculates 0% usage when no requests have been made', async () => {
    const apiResponse = {
      current_interval_usage_count: 100, // All remaining = no usage
      current_interval_total_count: 100,
    };

    createMockFetch(apiResponse);

    const result = await fetchMiniMaxQuota('sessioncookie123');

    expect(result).toEqual<QuotaData>({
      requests: {
        limit: 100,
        remaining: 100,
        used: 0,
        percentage: 0,
      },
    });
  });

  it('handles missing fields with defaults', async () => {
    const apiResponse = {};

    createMockFetch(apiResponse);

    const result = await fetchMiniMaxQuota('sessioncookie123');

    expect(result).toEqual<QuotaData>({
      requests: {
        limit: 0,
        remaining: 0,
        used: 0,
        percentage: 0,
      },
    });
  });

  it('throws error on 401 authentication failure', async () => {
    createMockFetch({ error: 'Unauthorized' }, 401);

    await expect(fetchMiniMaxQuota('invalidcookie')).rejects.toThrow(
      'MiniMax authentication failed: 401 Unauthorized'
    );
  });

  it('throws error on 403 forbidden', async () => {
    createMockFetch({ error: 'Forbidden' }, 403);

    await expect(fetchMiniMaxQuota('expiredcookie')).rejects.toThrow(
      'MiniMax authentication failed: 403 Forbidden'
    );
  });

  it('throws error on non-OK response', async () => {
    createMockFetch({ error: 'Server Error' }, 500);

    await expect(fetchMiniMaxQuota('sessioncookie123')).rejects.toThrow(
      'MiniMax API error: 500 Server Error'
    );
  });

  it('passes cookie as authentication header', async () => {
    const apiResponse = {
      current_interval_usage_count: 50,
      current_interval_total_count: 100,
    };

    createMockFetch(apiResponse);

    await fetchMiniMaxQuota('my-session-cookie');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.minimax.chat/v1/api/openplatform/coding_plan/remains',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Cookie: 'my-session-cookie',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('handles partial usage percentage correctly', async () => {
    const apiResponse = {
      current_interval_usage_count: 333, // Remaining
      current_interval_total_count: 1000,
    };

    createMockFetch(apiResponse);

    const result = await fetchMiniMaxQuota('sessioncookie123');

    // used = 1000 - 333 = 667
    // percentage = (667 / 1000) * 100 = 66.7
    expect(result).toEqual<QuotaData>({
      requests: {
        limit: 1000,
        remaining: 333,
        used: 667,
        percentage: 66.7,
      },
    });
  });

  it('handles decimal remaining values by flooring', async () => {
    const apiResponse = {
      current_interval_usage_count: 33.7,
      current_interval_total_count: 100,
    };

    createMockFetch(apiResponse);

    const result = await fetchMiniMaxQuota('sessioncookie123');

    expect(result.requests.remaining).toBe(33.7);
    expect(result.requests.used).toBe(66.3);
  });
});
