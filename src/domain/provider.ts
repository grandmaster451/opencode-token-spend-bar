export type ProviderBucket = 'minimax' | 'opencode-go' | 'chatgpt-plus';

const PROVIDER_LABELS: Record<ProviderBucket, string> = {
  minimax: 'MM',
  'opencode-go': 'OCG',
  'chatgpt-plus': 'GPT+',
};

export function normalizeProvider(rawProviderID: string): ProviderBucket | null {
  switch (rawProviderID) {
    case 'minimax':
      return 'minimax';
    case 'opencode-go':
      return 'opencode-go';
    case 'openai':
      return 'chatgpt-plus';
    default:
      return null;
  }
}

export function getProviderDisplayLabel(bucket: ProviderBucket): string {
  return PROVIDER_LABELS[bucket];
}

export function isProviderBucket(value: unknown): value is ProviderBucket {
  return value === 'minimax' || value === 'opencode-go' || value === 'chatgpt-plus';
}
