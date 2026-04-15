import type { ProviderBucket } from './provider';

export type ProviderRowState = {
  bucket: ProviderBucket;
  tokens: number;
  cost: number | null;
  /** Remaining quota (null if unavailable) */
  remaining: number | null;
  /** Spent percentage: (spent / limit) * 100 (null if no limit) */
  percentage: number | null;
};

export const ROW_ORDER: ProviderBucket[] = ['minimax', 'opencode-go', 'chatgpt-plus'];

export function createEmptyRowState(bucket: ProviderBucket): ProviderRowState {
  return {
    bucket,
    tokens: 0,
    cost: 0,
    remaining: null,
    percentage: null,
  };
}

export function mergeRowStates(states: ProviderRowState[]): ProviderRowState[] {
  const merged = new Map<ProviderBucket, ProviderRowState>();

  for (const state of states) {
    const current = merged.get(state.bucket);

    if (!current) {
      merged.set(state.bucket, { ...state });
      continue;
    }

    current.tokens += state.tokens;
    current.cost = current.cost === null || state.cost === null ? null : current.cost + state.cost;
    // remaining and percentage come from quota data (not usage aggregation)
    // they should remain as-is from the first state with non-null values
    if (current.remaining === null && state.remaining !== null) {
      current.remaining = state.remaining;
    }
    if (current.percentage === null && state.percentage !== null) {
      current.percentage = state.percentage;
    }
  }

  return ROW_ORDER.filter(bucket => merged.has(bucket)).map(bucket => merged.get(bucket)!);
}
