import { describe, expect, it } from 'vitest';
import { parseRateLimitHeaders, type QuotaData } from '../../src/adapters/openai-headers.ts';

describe('parseRateLimitHeaders', () => {
  it('parses complete rate limit headers', () => {
    const headers: Record<string, string> = {
      'x-ratelimit-limit-requests': '200',
      'x-ratelimit-remaining-requests': '150',
      'x-ratelimit-limit-tokens': '100000',
      'x-ratelimit-remaining-tokens': '75000',
    };

    const result = parseRateLimitHeaders(headers);

    expect(result).toEqual<QuotaData>({
      requests: {
        limit: 200,
        remaining: 150,
        percentage: 25,
      },
      tokens: {
        limit: 100000,
        remaining: 75000,
        percentage: 25,
      },
    });
  });

  it('returns null when all rate limit headers are missing', () => {
    const headers: Record<string, string> = {};

    const result = parseRateLimitHeaders(headers);

    expect(result).toBeNull();
  });

  it('returns null when requests headers are missing', () => {
    const headers: Record<string, string> = {
      'x-ratelimit-limit-tokens': '100000',
      'x-ratelimit-remaining-tokens': '75000',
    };

    const result = parseRateLimitHeaders(headers);

    expect(result).toBeNull();
  });

  it('returns null when tokens headers are missing', () => {
    const headers: Record<string, string> = {
      'x-ratelimit-limit-requests': '200',
      'x-ratelimit-remaining-requests': '150',
    };

    const result = parseRateLimitHeaders(headers);

    expect(result).toBeNull();
  });

  it('returns null when only some headers are present', () => {
    const headers: Record<string, string> = {
      'x-ratelimit-limit-requests': '200',
      'x-ratelimit-remaining-requests': '150',
      'x-ratelimit-limit-tokens': '100000',
    };

    const result = parseRateLimitHeaders(headers);

    expect(result).toBeNull();
  });

  it('calculates 0% usage when limit and remaining are both zero', () => {
    const headers: Record<string, string> = {
      'x-ratelimit-limit-requests': '0',
      'x-ratelimit-remaining-requests': '0',
      'x-ratelimit-limit-tokens': '100000',
      'x-ratelimit-remaining-tokens': '75000',
    };

    const result = parseRateLimitHeaders(headers);

    expect(result).toEqual<QuotaData>({
      requests: {
        limit: 0,
        remaining: 0,
        percentage: 0,
      },
      tokens: {
        limit: 100000,
        remaining: 75000,
        percentage: 25,
      },
    });
  });

  it('calculates 100% usage correctly', () => {
    const headers: Record<string, string> = {
      'x-ratelimit-limit-requests': '100',
      'x-ratelimit-remaining-requests': '0',
      'x-ratelimit-limit-tokens': '100000',
      'x-ratelimit-remaining-tokens': '0',
    };

    const result = parseRateLimitHeaders(headers);

    expect(result).toEqual<QuotaData>({
      requests: {
        limit: 100,
        remaining: 0,
        percentage: 100,
      },
      tokens: {
        limit: 100000,
        remaining: 0,
        percentage: 100,
      },
    });
  });

  it('calculates 0% usage correctly', () => {
    const headers: Record<string, string> = {
      'x-ratelimit-limit-requests': '100',
      'x-ratelimit-remaining-requests': '100',
      'x-ratelimit-limit-tokens': '100000',
      'x-ratelimit-remaining-tokens': '100000',
    };

    const result = parseRateLimitHeaders(headers);

    expect(result).toEqual<QuotaData>({
      requests: {
        limit: 100,
        remaining: 100,
        percentage: 0,
      },
      tokens: {
        limit: 100000,
        remaining: 100000,
        percentage: 0,
      },
    });
  });

  it('handles empty string header values as missing', () => {
    const headers: Record<string, string> = {
      'x-ratelimit-limit-requests': '200',
      'x-ratelimit-remaining-requests': '',
      'x-ratelimit-limit-tokens': '100000',
      'x-ratelimit-remaining-tokens': '75000',
    };

    const result = parseRateLimitHeaders(headers);

    expect(result).toBeNull();
  });

  it('handles non-numeric header values gracefully', () => {
    const headers: Record<string, string> = {
      'x-ratelimit-limit-requests': '200',
      'x-ratelimit-remaining-requests': 'not-a-number',
      'x-ratelimit-limit-tokens': '100000',
      'x-ratelimit-remaining-tokens': '75000',
    };

    const result = parseRateLimitHeaders(headers);

    expect(result).toBeNull();
  });

  it('calculates partial usage percentage correctly', () => {
    const headers: Record<string, string> = {
      'x-ratelimit-limit-requests': '1000',
      'x-ratelimit-remaining-requests': '333',
      'x-ratelimit-limit-tokens': '200000',
      'x-ratelimit-remaining-tokens': '50000',
    };

    const result = parseRateLimitHeaders(headers);

    expect(result).toEqual<QuotaData>({
      requests: {
        limit: 1000,
        remaining: 333,
        percentage: 66.7,
      },
      tokens: {
        limit: 200000,
        remaining: 50000,
        percentage: 75,
      },
    });
  });
});
