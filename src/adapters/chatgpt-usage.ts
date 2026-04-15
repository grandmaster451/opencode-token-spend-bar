/**
 * Unofficial ChatGPT Plus usage adapter.
 *
 * WARNING: This adapter uses an unofficial API endpoint (`/backend-api/wham/usage`)
 * that may break at any time if OpenAI changes their infrastructure.
 * Do NOT rely solely on this endpoint for critical functionality.
 *
 * Based on the community plugin `opencode-quotas`.
 */

import type { QuotaData } from './openai-headers';

const WHAM_USAGE_ENDPOINT = 'https://chatgpt.com/backend-api/wham/usage';

export type WhisperUsageResponse = {
  await_guilds: number;
  await_usage: number;
  subscription_has_applied: boolean;
};

/**
 * Fetches ChatGPT Plus usage data from the unofficial `/backend-api/wham/usage` endpoint.
 *
 * @param token - OAuth Bearer token for authentication
 * @returns QuotaData with requests/tokens info, or null on failure
 */
export async function fetchChatGPTUsage(token: string): Promise<QuotaData | null> {
  try {
    const response = await fetch(WHAM_USAGE_ENDPOINT, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`[token-spend-bar] ChatGPT usage endpoint returned ${response.status}`);
      return null;
    }

    const data = (await response.json()) as WhisperUsageResponse;

    if (!response.ok) {
      console.warn(`[token-spend-bar] ChatGPT usage endpoint returned ${response.status}`);
      return null;
    }

    // The response indicates how many "await" tokens/requests the user has used.
    // We treat "await_usage" as the "used" portion and assume a fixed limit.
    // This is an approximation since the unofficial endpoint doesn't expose limits directly.
    const usedRequests = data.await_guilds;
    const usedTokens = data.await_usage;

    // If we can't determine usage, return null for graceful degradation
    if (usedRequests === undefined && usedTokens === undefined) {
      return null;
    }

    // Calculate remaining assuming ChatGPT Plus has:
    // - 100 requests per 3 hours (approximate)
    // - 1,000,000 tokens per month (approximate)
    // These are rough estimates since the unofficial API doesn't expose actual limits.
    const REQUEST_LIMIT = 100;
    const TOKEN_LIMIT = 1_000_000;

    const remainingRequests = Math.max(0, REQUEST_LIMIT - usedRequests);
    const remainingTokens = Math.max(0, TOKEN_LIMIT - usedTokens);

    return {
      requests: {
        limit: REQUEST_LIMIT,
        remaining: remainingRequests,
        percentage: calculatePercentage(REQUEST_LIMIT, remainingRequests),
      },
      tokens: {
        limit: TOKEN_LIMIT,
        remaining: remainingTokens,
        percentage: calculatePercentage(TOKEN_LIMIT, remainingTokens),
      },
    };
  } catch (error) {
    // Graceful fallback - do not expose token in logs
    console.warn('[token-spend-bar] Failed to fetch ChatGPT usage data from unofficial endpoint.');
    return null;
  }
}

function calculatePercentage(limit: number, remaining: number): number {
  if (limit === 0) {
    return 0;
  }

  const used = limit - remaining;
  return Math.round((used / limit) * 100 * 100) / 100;
}
