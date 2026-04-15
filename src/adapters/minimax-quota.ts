export type QuotaData = {
  requests: {
    limit: number;
    remaining: number;
    used: number;
    percentage: number;
  };
};

const MINI_MAX_API_BASE = 'https://api.minimax.chat';
const ENDPOINT = '/v1/api/openplatform/coding_plan/remains';

/**
 * Fetches MiniMax quota data from the coding_plan/remains endpoint.
 *
 * IMPORTANT: The MiniMax API returns a field called `current_interval_usage_count`
 * which is MISLEADING - it actually contains the REMAINING quota, not used!
 * We calculate used = total - remaining.
 *
 * @param cookie - Browser session cookie for authentication
 * @returns Promise<QuotaData> with quota information
 * @throws Error on authentication failure (401/403) or network error
 */
export async function fetchMiniMaxQuota(cookie: string): Promise<QuotaData> {
  const url = `${MINI_MAX_API_BASE}${ENDPOINT}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error(`MiniMax authentication failed: ${response.status} ${response.statusText}`);
  }

  if (!response.ok) {
    throw new Error(`MiniMax API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as MiniMaxApiResponse;

  // The API returns current_interval_usage_count which is actually REMAINING (confusingly named!)
  const remaining = data.current_interval_usage_count ?? 0;
  const total = data.current_interval_total_count ?? 0;
  const used = total - remaining;

  return {
    requests: {
      limit: total,
      remaining,
      used,
      percentage: total > 0 ? Math.round((used / total) * 10000) / 100 : 0,
    },
  };
}

type MiniMaxApiResponse = {
  current_interval_usage_count?: number;
  current_interval_total_count?: number;
  [key: string]: unknown;
};
