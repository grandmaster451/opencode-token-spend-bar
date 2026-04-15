import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QuotaAggregator, createQuotaAggregator } from '../../src/services/quota-aggregator';
import { fetchChatGPTUsage } from '../../src/adapters/chatgpt-usage';
import { fetchMiniMaxQuota } from '../../src/adapters/minimax-quota';

vi.mock('../../src/adapters/chatgpt-usage');
vi.mock('../../src/adapters/minimax-quota');

const mockedFetchChatGPTUsage = vi.mocked(fetchChatGPTUsage);
const mockedFetchMiniMaxQuota = vi.mocked(fetchMiniMaxQuota);

describe('quota aggregator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-04-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('getQuota', () => {
    it('returns null for unknown providers', async () => {
      const aggregator = createQuotaAggregator();

      expect(await aggregator.getQuota('unknown')).toBeNull();
      expect(await aggregator.getQuota('anthropic')).toBeNull();
      expect(await aggregator.getQuota('')).toBeNull();
    });

    it('returns null for opencode-go (no adapter exists)', async () => {
      const aggregator = createQuotaAggregator();

      expect(await aggregator.getQuota('opencode-go')).toBeNull();
    });

    it('fetches MiniMax quota when cache miss and cookie provided', async () => {
      const mockQuota = {
        requests: { limit: 100, remaining: 50, used: 50, percentage: 50 },
      };
      mockedFetchMiniMaxQuota.mockResolvedValue(mockQuota);

      const aggregator = createQuotaAggregator({ minimaxCookie: 'test-cookie' });
      const result = await aggregator.getQuota('minimax');

      expect(result).toEqual(mockQuota);
      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledOnce();
      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledWith('test-cookie');
    });

    it('fetches ChatGPT quota when cache miss and token provided', async () => {
      const mockQuota = {
        requests: { limit: 100, remaining: 75, percentage: 25 },
        tokens: { limit: 1_000_000, remaining: 800_000, percentage: 20 },
      };
      mockedFetchChatGPTUsage.mockResolvedValue(mockQuota);

      const aggregator = createQuotaAggregator({ chatgptToken: 'test-token' });
      const result = await aggregator.getQuota('chatgpt-plus');

      expect(result).toEqual(mockQuota);
      expect(mockedFetchChatGPTUsage).toHaveBeenCalledOnce();
      expect(mockedFetchChatGPTUsage).toHaveBeenCalledWith('test-token');
    });

    it('returns null when MiniMax cookie not provided', async () => {
      const aggregator = createQuotaAggregator({});

      const result = await aggregator.getQuota('minimax');

      expect(result).toBeNull();
      expect(mockedFetchMiniMaxQuota).not.toHaveBeenCalled();
    });

    it('returns null when ChatGPT token not provided', async () => {
      const aggregator = createQuotaAggregator({});

      const result = await aggregator.getQuota('chatgpt-plus');

      expect(result).toBeNull();
      expect(mockedFetchChatGPTUsage).not.toHaveBeenCalled();
    });

    it('returns null when MiniMax adapter throws and no explicit fallback configured', async () => {
      mockedFetchMiniMaxQuota.mockRejectedValue(new Error('Network error'));

      const aggregator = createQuotaAggregator({ minimaxCookie: 'test-cookie' });
      const result = await aggregator.getQuota('minimax');

      expect(result).toBeNull();
    });

    it('returns null when ChatGPT adapter returns null and no explicit fallback configured', async () => {
      mockedFetchChatGPTUsage.mockResolvedValue(null);

      const aggregator = createQuotaAggregator({ chatgptToken: 'test-token' });
      const result = await aggregator.getQuota('chatgpt-plus');

      expect(result).toBeNull();
    });

    it('uses custom fallback limits when provided', async () => {
      const aggregator = createQuotaAggregator({
        fallbackLimits: { requests: 200, tokens: 2_000_000 },
      });

      const result = await aggregator.getQuota('minimax');

      expect(result).toEqual({
        requests: { limit: 200, remaining: 200, percentage: 0 },
        tokens: { limit: 2_000_000, remaining: 2_000_000, percentage: 0 },
      });
    });

    it('uses explicit fallback limits when adapter fails', async () => {
      mockedFetchMiniMaxQuota.mockRejectedValue(new Error('Network error'));

      const aggregator = createQuotaAggregator({
        minimaxCookie: 'test-cookie',
        fallbackLimits: { requests: 200, tokens: 2_000_000 },
      });

      const result = await aggregator.getQuota('minimax');

      expect(result).toEqual({
        requests: { limit: 200, remaining: 200, percentage: 0 },
        tokens: { limit: 2_000_000, remaining: 2_000_000, percentage: 0 },
      });
    });
  });

  describe('caching', () => {
    it('returns cached data without calling adapter', async () => {
      const mockQuota = {
        requests: { limit: 100, remaining: 50, used: 50, percentage: 50 },
      };
      mockedFetchMiniMaxQuota.mockResolvedValue(mockQuota);

      const aggregator = createQuotaAggregator({ minimaxCookie: 'test-cookie' });

      // First call - populates cache
      await aggregator.getQuota('minimax');
      // Second call - should use cache
      await aggregator.getQuota('minimax');

      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledTimes(1);
    });

    it('cache expires after 5 minutes', async () => {
      const mockQuota1 = {
        requests: { limit: 100, remaining: 50, used: 50, percentage: 50 },
      };
      const mockQuota2 = {
        requests: { limit: 100, remaining: 40, used: 60, percentage: 60 },
      };
      mockedFetchMiniMaxQuota
        .mockResolvedValueOnce(mockQuota1)
        .mockResolvedValueOnce(mockQuota2);

      const aggregator = createQuotaAggregator({ minimaxCookie: 'test-cookie' });

      // First call - populates cache
      await aggregator.getQuota('minimax');
      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledTimes(1);

      // Simulate time passing by advancing system time
      vi.setSystemTime(new Date('2024-04-15T12:05:01Z')); // 5 min + 1 sec later

      // Second call - should fetch again since cache expired
      await aggregator.getQuota('minimax');

      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledTimes(2);
    });

    it('cache does not expire before 5 minutes', async () => {
      const mockQuota = {
        requests: { limit: 100, remaining: 50, used: 50, percentage: 50 },
      };
      mockedFetchMiniMaxQuota.mockResolvedValue(mockQuota);

      const aggregator = createQuotaAggregator({ minimaxCookie: 'test-cookie' });

      // First call - populates cache
      await aggregator.getQuota('minimax');

      // Advance time by 4 minutes (less than TTL) - needs async for fake timers
      await vi.advanceTimersByTimeAsync(4 * 60 * 1000);

      // Second call - should use cache
      await aggregator.getQuota('minimax');

      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledTimes(1);
    });

    it('clearCache removes all cached entries', async () => {
      const mockQuota = {
        requests: { limit: 100, remaining: 50, used: 50, percentage: 50 },
      };
      mockedFetchMiniMaxQuota.mockResolvedValue(mockQuota);
      mockedFetchChatGPTUsage.mockResolvedValue({
        requests: { limit: 100, remaining: 75, percentage: 25 },
        tokens: { limit: 1_000_000, remaining: 800_000, percentage: 20 },
      });

      const aggregator = createQuotaAggregator({
        minimaxCookie: 'test-cookie',
        chatgptToken: 'test-token',
      });

      // Populate caches
      await aggregator.getQuota('minimax');
      await aggregator.getQuota('chatgpt-plus');

      // Clear all cache
      aggregator.clearCache();

      // Both caches should be empty, so next calls should fetch again
      await aggregator.getQuota('minimax');
      await aggregator.getQuota('chatgpt-plus');

      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledTimes(2);
      expect(mockedFetchChatGPTUsage).toHaveBeenCalledTimes(2);
    });

    it('clearCache for specific provider only clears that provider', async () => {
      const mockQuota = {
        requests: { limit: 100, remaining: 50, used: 50, percentage: 50 },
      };
      mockedFetchMiniMaxQuota.mockResolvedValue(mockQuota);
      mockedFetchChatGPTUsage.mockResolvedValue({
        requests: { limit: 100, remaining: 75, percentage: 25 },
        tokens: { limit: 1_000_000, remaining: 800_000, percentage: 20 },
      });

      const aggregator = createQuotaAggregator({
        minimaxCookie: 'test-cookie',
        chatgptToken: 'test-token',
      });

      // Populate caches
      await aggregator.getQuota('minimax');
      await aggregator.getQuota('chatgpt-plus');

      // Clear only MiniMax cache
      aggregator.clearCache('minimax');

      // MiniMax cache should be empty (2 calls), ChatGPT cache should still be valid (1 call)
      await aggregator.getQuota('minimax');
      await aggregator.getQuota('chatgpt-plus');

      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledTimes(2);
      expect(mockedFetchChatGPTUsage).toHaveBeenCalledTimes(1);
    });
  });

  describe('createQuotaAggregator', () => {
    it('creates aggregator with default config', () => {
      const aggregator = createQuotaAggregator();
      expect(aggregator).toBeInstanceOf(QuotaAggregator);
    });

    it('creates aggregator with custom config', () => {
      const aggregator = createQuotaAggregator({
        minimaxCookie: 'cookie',
        chatgptToken: 'token',
        fallbackLimits: { requests: 50, tokens: 500_000 },
      });
      expect(aggregator).toBeInstanceOf(QuotaAggregator);
    });
  });
});
