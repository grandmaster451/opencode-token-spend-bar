export type QuotaData = {
  requests: {
    limit: number;
    remaining: number;
    percentage: number;
  };
  tokens: {
    limit: number;
    remaining: number;
    percentage: number;
  };
};

/**
 * Parses OpenAI rate limit headers from API responses.
 *
 * Headers parsed:
 * - x-ratelimit-limit-requests
 * - x-ratelimit-remaining-requests
 * - x-ratelimit-limit-tokens
 * - x-ratelimit-remaining-tokens
 *
 * @param headers - Record of lowercase header names to values
 * @returns QuotaData with calculated percentages, or null if required headers are missing
 */
export function parseRateLimitHeaders(headers: Record<string, string>): QuotaData | null {
  const limitRequests = parseHeaderValue(headers['x-ratelimit-limit-requests']);
  const remainingRequests = parseHeaderValue(headers['x-ratelimit-remaining-requests']);
  const limitTokens = parseHeaderValue(headers['x-ratelimit-limit-tokens']);
  const remainingTokens = parseHeaderValue(headers['x-ratelimit-remaining-tokens']);

  if (
    limitRequests === null ||
    remainingRequests === null ||
    limitTokens === null ||
    remainingTokens === null
  ) {
    return null;
  }

  return {
    requests: {
      limit: limitRequests,
      remaining: remainingRequests,
      percentage: calculatePercentage(limitRequests, remainingRequests),
    },
    tokens: {
      limit: limitTokens,
      remaining: remainingTokens,
      percentage: calculatePercentage(limitTokens, remainingTokens),
    },
  };
}

function parseHeaderValue(value: string | undefined): number | null {
  if (value === undefined || value === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function calculatePercentage(limit: number, remaining: number): number {
  if (limit === 0) {
    return 0;
  }

  return Math.round(((limit - remaining) / limit) * 100 * 100) / 100;
}
