import type { TuiKV } from '@opencode-ai/plugin/tui';

import type { QuotaData } from '../adapters/openai-headers';
import { formatCost, formatTokens, shouldShowCost, getDisplayValue, calculateSpentPercentage } from '../domain/formatter';
import { getProviderDisplayLabel, isProviderBucket, type ProviderBucket } from '../domain/provider';
import { createEmptyRowState, ROW_ORDER, type ProviderRowState } from '../domain/row-state';
import {
  createLedger,
  getCurrentMonthKey,
  type Ledger,
  type MonthlyAggregate,
} from '../state/kv-ledger';

export type AggregatorConfig = {
  currency: string;
};

export type UsageRecord = {
  provider: ProviderBucket;
  tokens: number;
  cost: number | null;
  timestamp: number;
};

export type ProviderRowViewModel = {
  bucket: ProviderBucket;
  label: string;
  tokens: number;
  tokensFormatted: string;
  cost: number | null;
  costFormatted: string | null;
  showCost: boolean;
  /** Remaining token quota (null if unavailable) */
  remaining: number | null;
  /** Formatted remaining tokens (e.g. "8.8k") */
  remainingFormatted: string;
  /** Spent percentage (null if no limit available) */
  percentage: number | null;
  /** True when remaining comes from actual quota data, not spent fallback */
  hasRemainingQuota: boolean;
};

export type WidgetViewModel = {
  month: string;
  heading: string;
  rows: ProviderRowViewModel[];
};

export class UsageAggregator {
  constructor(
    private ledger: Ledger,
    private config: AggregatorConfig = { currency: '$' }
  ) {}

  async initialize(): Promise<void> {
    // Session-only mode: start with empty aggregates, don't load history
    // Only rebuild if schema/migration requires it
    if (!this.ledger.shouldRebuild()) {
      return;
    }

    // Reset aggregates for fresh session
    this.ledger.triggerRebuild();
    this.ledger.save();
  }

  processRecord(record: UsageRecord): void {
    if (!isProviderBucket(record.provider)) {
      return;
    }

    const fingerprint = this.createFingerprint(record);
    if (this.ledger.isRecordProcessed(fingerprint)) {
      return;
    }

    this.ledger.updateAggregate(record.provider, record.tokens, record.cost);
    this.ledger.markRecordProcessed(fingerprint);
    this.ledger.save();
  }

  getViewModel(quotaByProvider: Partial<Record<ProviderBucket, QuotaData | null>> = {}): WidgetViewModel {
    const aggregates = this.ledger.getAggregates();
    const rows = this.buildRows(aggregates, quotaByProvider);

    // Single authoritative source for heading text
    const hasAnyRemainingQuota = rows.some(row => row.hasRemainingQuota);
    const heading = hasAnyRemainingQuota ? 'Remaining' : 'Usage';

    return {
      month: getCurrentMonthKey(),
      heading,
      rows,
    };
  }

  private buildRows(
    aggregates: MonthlyAggregate[],
    quotaByProvider: Partial<Record<ProviderBucket, QuotaData | null>>
  ): ProviderRowViewModel[] {
    const aggregateMap = new Map<ProviderBucket, MonthlyAggregate>();

    for (const aggregate of aggregates) {
      if (isProviderBucket(aggregate.provider)) {
        aggregateMap.set(aggregate.provider, aggregate);
      }
    }

    return ROW_ORDER.map(bucket => {
      const aggregate = aggregateMap.get(bucket);
      const emptyState = createEmptyRowState(bucket);
      const state: ProviderRowState = aggregate
        ? { ...emptyState, tokens: aggregate.tokens, cost: aggregate.cost }
        : emptyState;
      const hasRealCost = aggregate !== undefined && aggregate.cost !== null;
      const showCost = shouldShowCost(bucket) && hasRealCost;
      const quota = this.resolveQuota(quotaByProvider[bucket]);

      const spentPercentage = quota.percentage ?? calculateSpentPercentage(state.tokens, quota.limit);
      const hasRemainingQuota = quota.remaining !== null && quota.limit !== null && quota.limit > 0;

      return {
        bucket,
        label: getProviderDisplayLabel(bucket),
        tokens: state.tokens,
        tokensFormatted: formatTokens(state.tokens),
        cost: showCost ? state.cost : null,
        costFormatted: showCost ? formatCost(state.cost, this.config.currency) : null,
        showCost,
        remaining: quota.remaining,
        remainingFormatted:
          hasRemainingQuota && quota.remaining !== null
            ? `${formatTokens(state.tokens)}  (${quota.remaining}, ${quota.percentage}%)`
            : formatTokens(state.tokens),
        percentage: spentPercentage,
        hasRemainingQuota,
      };
    });
  }

  private resolveQuota(quota: QuotaData | null | undefined): {
    remaining: number | null;
    limit: number | null;
    percentage: number | null;
  } {
    if (!quota) {
      return { remaining: null, limit: null, percentage: null };
    }

    if ('tokens' in quota && quota.tokens) {
      return {
        remaining: quota.tokens.remaining,
        limit: quota.tokens.limit,
        percentage: quota.tokens.percentage,
      };
    }

    if ('requests' in quota && quota.requests) {
      return {
        remaining: quota.requests.remaining,
        limit: quota.requests.limit,
        percentage: quota.requests.percentage,
      };
    }

    return { remaining: null, limit: null, percentage: null };
  }

  private createFingerprint(record: UsageRecord): string {
    return `${record.provider}:${record.timestamp}:${record.tokens}:${record.cost ?? 'null'}`;
  }
}

export function createAggregator(kv: TuiKV): UsageAggregator {
  const ledger = createLedger(kv);
  return new UsageAggregator(ledger);
}
