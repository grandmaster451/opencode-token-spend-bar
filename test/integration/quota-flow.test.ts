import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { QuotaData } from '../../src/adapters/openai-headers';
import { QuotaAggregator, createQuotaAggregator } from '../../src/services/quota-aggregator';
import { fetchChatGPTUsage } from '../../src/adapters/chatgpt-usage';
import { fetchMiniMaxQuota } from '../../src/adapters/minimax-quota';

vi.mock('../../src/adapters/chatgpt-usage');
vi.mock('../../src/adapters/minimax-quota');

const mockedFetchChatGPTUsage = vi.mocked(fetchChatGPTUsage);
const mockedFetchMiniMaxQuota = vi.mocked(fetchMiniMaxQuota);

describe('integration: quota flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-04-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('full adapter → aggregator → quota data flow', () => {
    it('MiniMax adapter → aggregator → returns quota with percentage', async () => {
      const mockQuota: QuotaData = {
        requests: { limit: 100, remaining: 50, percentage: 50 },
        tokens: { limit: 1_000_000, remaining: 800_000, percentage: 20 },
      };
      mockedFetchMiniMaxQuota.mockResolvedValue(mockQuota);

      const aggregator = createQuotaAggregator({ minimaxCookie: 'test-cookie' });

      // Flow: adapter call → aggregator getQuota → returns QuotaData
      const result = await aggregator.getQuota('minimax');

      expect(result).toEqual(mockQuota);
      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledOnce();
      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledWith('test-cookie');

      // Verify the quota structure has all required fields
      expect(result?.requests.remaining).toBe(50);
      expect(result?.requests.percentage).toBe(50);
      expect(result?.tokens.remaining).toBe(800_000);
      expect(result?.tokens.percentage).toBe(20);
    });

    it('ChatGPT adapter → aggregator → returns quota with percentage', async () => {
      const mockQuota: QuotaData = {
        requests: { limit: 100, remaining: 75, percentage: 25 },
        tokens: { limit: 1_000_000, remaining: 800_000, percentage: 20 },
      };
      mockedFetchChatGPTUsage.mockResolvedValue(mockQuota);

      const aggregator = createQuotaAggregator({ chatgptToken: 'test-token' });

      // Flow: adapter call → aggregator getQuota → returns QuotaData
      const result = await aggregator.getQuota('chatgpt-plus');

      expect(result).toEqual(mockQuota);
      expect(mockedFetchChatGPTUsage).toHaveBeenCalledOnce();
      expect(mockedFetchChatGPTUsage).toHaveBeenCalledWith('test-token');
    });

    it('aggregator caches quota data and returns on subsequent calls', async () => {
      const mockQuota: QuotaData = {
        requests: { limit: 100, remaining: 50, percentage: 50 },
        tokens: { limit: 1_000_000, remaining: 800_000, percentage: 20 },
      };
      mockedFetchMiniMaxQuota.mockResolvedValue(mockQuota);

      const aggregator = createQuotaAggregator({ minimaxCookie: 'test-cookie' });

      // First call populates cache
      await aggregator.getQuota('minimax');
      // Second call should use cache
      await aggregator.getQuota('minimax');

      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledTimes(1);
    });

    it('aggregator uses 5-minute cache TTL', async () => {
      const mockQuota1: QuotaData = {
        requests: { limit: 100, remaining: 50, percentage: 50 },
        tokens: { limit: 1_000_000, remaining: 800_000, percentage: 20 },
      };
      const mockQuota2: QuotaData = {
        requests: { limit: 100, remaining: 40, percentage: 60 },
        tokens: { limit: 1_000_000, remaining: 700_000, percentage: 30 },
      };
      mockedFetchMiniMaxQuota
        .mockResolvedValueOnce(mockQuota1)
        .mockResolvedValueOnce(mockQuota2);

      const aggregator = createQuotaAggregator({ minimaxCookie: 'test-cookie' });

      // First call populates cache
      await aggregator.getQuota('minimax');

      // Advance time by 5 minutes + 1 second
      vi.setSystemTime(new Date('2024-04-15T12:05:01Z'));

      // Second call should fetch again (cache expired)
      await aggregator.getQuota('minimax');

      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledTimes(2);
    });

    it('aggregator returns null when adapter fails without explicit fallback config', async () => {
      mockedFetchMiniMaxQuota.mockRejectedValue(new Error('Network error'));

      const aggregator = createQuotaAggregator({ minimaxCookie: 'test-cookie' });

      // Flow: adapter fails → aggregator returns null unless explicit fallback was configured
      const result = await aggregator.getQuota('minimax');

      expect(result).toBeNull();
    });

    it('aggregator uses custom fallback limits when provided', async () => {
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

  describe('multiple providers simultaneously', () => {
    it('fetches MiniMax and ChatGPT quotas independently', async () => {
      const minimaxQuota: QuotaData = {
        requests: { limit: 100, remaining: 50, percentage: 50 },
        tokens: { limit: 1_000_000, remaining: 800_000, percentage: 20 },
      };
      const chatgptQuota: QuotaData = {
        requests: { limit: 100, remaining: 75, percentage: 25 },
        tokens: { limit: 1_000_000, remaining: 750_000, percentage: 25 },
      };
      mockedFetchMiniMaxQuota.mockResolvedValue(minimaxQuota);
      mockedFetchChatGPTUsage.mockResolvedValue(chatgptQuota);

      const aggregator = createQuotaAggregator({
        minimaxCookie: 'test-cookie',
        chatgptToken: 'test-token',
      });

      // Fetch both providers concurrently
      const [minimaxResult, chatgptResult] = await Promise.all([
        aggregator.getQuota('minimax'),
        aggregator.getQuota('chatgpt-plus'),
      ]);

      expect(minimaxResult).toEqual(minimaxQuota);
      expect(chatgptResult).toEqual(chatgptQuota);
      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledOnce();
      expect(mockedFetchChatGPTUsage).toHaveBeenCalledOnce();
    });
  });

  describe('error scenarios through full stack', () => {
    it('aggregator returns null for opencode-go (no adapter exists)', async () => {
      const aggregator = createQuotaAggregator();

      const result = await aggregator.getQuota('opencode-go');

      expect(result).toBeNull();
    });

    it('aggregator returns null for unknown providers', async () => {
      const aggregator = createQuotaAggregator();

      expect(await aggregator.getQuota('unknown')).toBeNull();
      expect(await aggregator.getQuota('anthropic')).toBeNull();
      expect(await aggregator.getQuota('')).toBeNull();
    });

    it('aggregator handles ChatGPT adapter returning null gracefully', async () => {
      mockedFetchChatGPTUsage.mockResolvedValue(null);

      const aggregator = createQuotaAggregator({ chatgptToken: 'test-token' });

      const result = await aggregator.getQuota('chatgpt-plus');

      expect(result).toBeNull();
    });

    it('aggregator clearCache removes specific provider cache', async () => {
      const mockQuota: QuotaData = {
        requests: { limit: 100, remaining: 50, percentage: 50 },
        tokens: { limit: 1_000_000, remaining: 800_000, percentage: 20 },
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

      // MiniMax cache should be empty (2 calls), ChatGPT cache valid (1 call)
      await aggregator.getQuota('minimax');
      await aggregator.getQuota('chatgpt-plus');

      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledTimes(2);
      expect(mockedFetchChatGPTUsage).toHaveBeenCalledTimes(1);
    });

    it('aggregator clearCache removes all provider caches', async () => {
      const mockQuota: QuotaData = {
        requests: { limit: 100, remaining: 50, percentage: 50 },
        tokens: { limit: 1_000_000, remaining: 800_000, percentage: 20 },
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

      // Clear all caches
      aggregator.clearCache();

      // Both caches should be empty
      await aggregator.getQuota('minimax');
      await aggregator.getQuota('chatgpt-plus');

      expect(mockedFetchMiniMaxQuota).toHaveBeenCalledTimes(2);
      expect(mockedFetchChatGPTUsage).toHaveBeenCalledTimes(2);
    });
  });
});
