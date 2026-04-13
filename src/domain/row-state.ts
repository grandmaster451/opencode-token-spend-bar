import type { ProviderBucket } from './provider';

export type ProviderRowState = {
  bucket: ProviderBucket;
  tokens: number;
  cost: number | null;
};

export const ROW_ORDER: ProviderBucket[] = ['minimax', 'opencode-go', 'chatgpt-plus'];

export function createEmptyRowState(bucket: ProviderBucket): ProviderRowState {
  return {
    bucket,
    tokens: 0,
    cost: 0,
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
  }

  return ROW_ORDER.filter((bucket) => merged.has(bucket)).map((bucket) => merged.get(bucket)!);
}
