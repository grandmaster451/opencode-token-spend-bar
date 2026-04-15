import type { ProviderBucket } from './provider';

export function formatTokens(count: number): string {
  // Format with spaces as thousand separators (e.g., 45500 -> "45 500")
  return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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

/**
 * Determines what value to display: remaining if available, otherwise spent.
 * Priority: remaining → config fallback → spent-only
 *
 * @param remaining - Remaining quota (null if unavailable)
 * @param spent - Amount spent/used
 * @param limit - Total limit (needed to determine if remaining is valid)
 * @returns The value to display: remaining if valid, otherwise spent
 */
export function getDisplayValue(remaining: number | null, spent: number, limit: number | null): number {
  // If we have remaining data and a valid limit, show remaining
  if (remaining !== null && limit !== null && limit > 0) {
    return Math.max(0, remaining); // Cap negative remaining at 0
  }

  // Fallback to spent
  return spent;
}

/**
 * Calculates spent percentage: (spent / limit) * 100
 *
 * @param spent - Amount spent/used
 * @param limit - Total limit
 * @returns Percentage spent, or null if no limit available
 */
export function calculateSpentPercentage(spent: number, limit: number | null): number | null {
  if (limit === null || limit <= 0) {
    return null;
  }

  const percentage = (spent / limit) * 100;
  return Math.round(percentage * 100) / 100; // Round to 2 decimal places
}

/**
 * Formats remaining/spent display value with optional percentage.
 *
 * @param displayValue - The value to display (remaining or spent)
 * @param percentage - Optional percentage to append
 * @returns Formatted string like "500" or "500 (50%)"
 */
export function formatRemainingSpent(displayValue: number, percentage: number | null): string {
  if (percentage !== null) {
    return `${displayValue} (${percentage}%)`;
  }
  return String(displayValue);
}
