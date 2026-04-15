/**
 * Quota Aggregator Service
 *
 * Orchestrates all quota adapters (T1, T2, T3) with:
 * - Caching with 5 minute TTL
 * - Priority fallback: headers (real-time) → API → config fallback
 * - Graceful error handling
 */

import type { QuotaData } from '../adapters/openai-headers';
import { fetchChatGPTUsage } from '../adapters/chatgpt-usage';
import { fetchMiniMaxQuota } from '../adapters/minimax-quota';
import type { ProviderBucket } from '../domain/provider';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry = {
  data: QuotaData;
  timestamp: number;
};

type QuotaSource = 'headers' | 'api' | 'config';

export type QuotaResult = {
  data: QuotaData;
  source: QuotaSource;
};

export type QuotaAggregatorConfig = {
  /** Browser session cookie for MiniMax API authentication */
  minimaxCookie?: string;
  /** Bearer token for ChatGPT API authentication */
  chatgptToken?: string;
  /** Static fallback limits when all adapters fail (requests only) */
  fallbackLimits?: {
    requests?: number;
    tokens?: number;
  };
};

export class QuotaAggregator {
  private cache = new Map<ProviderBucket, CacheEntry>();

  constructor(private config: QuotaAggregatorConfig = {}) {}

  /**
   * Fetches quota data for a provider with caching and priority fallback.
   *
   * Priority order:
   * 1. Cache (if valid, return immediately)
   * 2. API (try to fetch fresh data)
   * 3. Config fallback (return static limits if API fails)
   *
   * @param provider - The provider bucket ('minimax' | 'opencode-go' | 'chatgpt-plus')
   * @returns Promise<QuotaData | null> - Quota data or null if unavailable
   */
  async getQuota(provider: string): Promise<QuotaData | null> {
    if (!this.isValidProvider(provider)) {
      return null;
    }

    const bucket = provider as ProviderBucket;

    // Check cache first
    const cached = this.getCached(bucket);
    if (cached !== null) {
      return cached;
    }

    // Try API sources with priority fallback
    const result = await this.fetchWithPriority(bucket);
    if (result === null) {
      // All API sources failed, try config fallback
      return this.getConfigFallback(bucket);
    }

    // Cache the successful result
    this.setCache(bucket, result.data);

    return result.data;
  }

  /**
   * Clears the cache for a specific provider or all providers.
   */
  clearCache(provider?: ProviderBucket): void {
    if (provider) {
      this.cache.delete(provider);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Gets cached quota data if still valid.
   */
  private getCached(provider: ProviderBucket): QuotaData | null {
    const entry = this.cache.get(provider);
    if (entry === undefined) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL_MS) {
      // Cache expired
      this.cache.delete(provider);
      return null;
    }

    return entry.data;
  }

  /**
   * Sets quota data in cache.
   */
  private setCache(provider: ProviderBucket, data: QuotaData): void {
    this.cache.set(provider, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Fetches quota data using priority fallback: API → config
   */
  private async fetchWithPriority(provider: ProviderBucket): Promise<QuotaResult | null> {
    switch (provider) {
      case 'minimax':
        return this.fetchMiniMaxQuotaWithFallback();
      case 'chatgpt-plus':
        return this.fetchChatGPTQuotaWithFallback();
      case 'opencode-go':
        // opencode-go doesn't have a quota adapter; return null to use config fallback
        return null;
      default:
        return null;
    }
  }

  /**
   * Fetches MiniMax quota with graceful error handling.
   * MiniMax adapter doesn't support headers (real-time) - only API mode.
   */
  private async fetchMiniMaxQuotaWithFallback(): Promise<QuotaResult | null> {
    if (!this.config.minimaxCookie) {
      return null;
    }

    try {
      const data = await fetchMiniMaxQuota(this.config.minimaxCookie);
      return { data, source: 'api' };
    } catch (error) {
      console.warn('[quota-aggregator] MiniMax quota fetch failed:', error);
      return null;
    }
  }

  /**
   * Fetches ChatGPT quota with graceful error handling.
   * Tries the unofficial API endpoint.
   *
   * Note: The 'headers' priority would be used if we had access to real-time
   * headers from ChatGPT API responses. Currently, we only support API mode.
   */
  private async fetchChatGPTQuotaWithFallback(): Promise<QuotaResult | null> {
    if (!this.config.chatgptToken) {
      return null;
    }

    try {
      const data = await fetchChatGPTUsage(this.config.chatgptToken);
      if (data === null) {
        // Adapter returned null (e.g., unofficial API returned error)
        return null;
      }
      return { data, source: 'api' };
    } catch (error) {
      console.warn('[quota-aggregator] ChatGPT quota fetch failed:', error);
      return null;
    }
  }

  /**
   * Returns config-based fallback quota data when all API sources fail.
   */
  private getConfigFallback(provider: ProviderBucket): QuotaData | null {
    const limits = this.config.fallbackLimits;

    // opencode-go has no quota concept, and absent explicit limits should mean no quota data.
    if (provider === 'opencode-go' || !limits) {
      return null;
    }

    return {
      requests: {
        limit: limits.requests ?? 0,
        remaining: limits.requests ?? 0,
        percentage: 0,
      },
      tokens: {
        limit: limits.tokens ?? 0,
        remaining: limits.tokens ?? 0,
        percentage: 0,
      },
    };
  }

  /**
   * Validates that the provider is a known ProviderBucket.
   */
  private isValidProvider(provider: string): boolean {
    return provider === 'minimax' || provider === 'opencode-go' || provider === 'chatgpt-plus';
  }
}

/**
 * Creates a new QuotaAggregator instance with the given config.
 */
export function createQuotaAggregator(config?: QuotaAggregatorConfig): QuotaAggregator {
  return new QuotaAggregator(config);
}
