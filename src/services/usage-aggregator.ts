import type { TuiKV } from '@opencode-ai/plugin/tui';

import * as historyScanner from '../adapters/history-scanner';
import { formatCost, formatTokens, shouldShowCost } from '../domain/formatter';
import { getProviderDisplayLabel, isProviderBucket, type ProviderBucket } from '../domain/provider';
import { createEmptyRowState, ROW_ORDER } from '../domain/row-state';
import {
  createLedger,
  getCurrentMonthKey,
  type Ledger,
  type MonthlyAggregate,
} from '../state/kv-ledger';

export type AggregatorConfig = {
  currency: string;
};

export type ProviderRowViewModel = {
  bucket: ProviderBucket;
  label: string;
  tokens: number;
  tokensFormatted: string;
  cost: number | null;
  costFormatted: string | null;
  showCost: boolean;
};

export type WidgetViewModel = {
  month: string;
  rows: ProviderRowViewModel[];
};

export class UsageAggregator {
  constructor(
    private ledger: Ledger,
    private config: AggregatorConfig = { currency: '$' },
  ) {}

  async initialize(): Promise<void> {
    if (!this.ledger.shouldRebuild()) {
      return;
    }

    const records = historyScanner.scanCurrentMonthHistory();

    for (const record of records) {
      if (!isProviderBucket(record.provider)) {
        continue;
      }

      this.ledger.updateAggregate(record.provider, record.tokens, record.cost);
      this.ledger.markRecordProcessed(this.createFingerprint(record));
    }

    this.ledger.save();
  }

  processRecord(record: historyScanner.UsageRecord): void {
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

  getViewModel(): WidgetViewModel {
    const aggregates = this.ledger.getAggregates();

    return {
      month: getCurrentMonthKey(),
      rows: this.buildRows(aggregates),
    };
  }

  private buildRows(aggregates: MonthlyAggregate[]): ProviderRowViewModel[] {
    const aggregateMap = new Map<ProviderBucket, MonthlyAggregate>();

    for (const aggregate of aggregates) {
      if (isProviderBucket(aggregate.provider)) {
        aggregateMap.set(aggregate.provider, aggregate);
      }
    }

    return ROW_ORDER.map((bucket) => {
      const aggregate = aggregateMap.get(bucket);
      const state = aggregate ?? createEmptyRowState(bucket);
      const hasRealCost = aggregate !== undefined && aggregate.cost !== null;
      const showCost = shouldShowCost(bucket) && hasRealCost;

      return {
        bucket,
        label: getProviderDisplayLabel(bucket),
        tokens: state.tokens,
        tokensFormatted: formatTokens(state.tokens),
        cost: showCost ? aggregate.cost : null,
        costFormatted: showCost ? formatCost(aggregate.cost, this.config.currency) : null,
        showCost,
      };
    });
  }

  private createFingerprint(record: historyScanner.UsageRecord): string {
    return `${record.provider}:${record.timestamp}:${record.tokens}:${record.cost ?? 'null'}`;
  }
}

export function createAggregator(kv: TuiKV): UsageAggregator {
  const ledger = createLedger(kv);
  return new UsageAggregator(ledger);
}
