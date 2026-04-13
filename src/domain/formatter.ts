import type { ProviderBucket } from './provider';

export function formatTokens(count: number): string {
  if (Math.abs(count) < 1000) {
    return String(count);
  }

  return `${(count / 1000).toFixed(1)}k`;
}

export function formatCost(amount: number | null, currency: string): string | null {
  if (amount === null) {
    return null;
  }

  return `${currency}${amount.toFixed(2)}`;
}

export function shouldShowCost(bucket: ProviderBucket): boolean {
  return bucket !== 'chatgpt-plus';
}
