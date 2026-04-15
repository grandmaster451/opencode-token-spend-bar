import { vi } from 'vitest';

import * as historyScanner from '../../src/adapters/history-scanner';
import { formatRow } from '../../src/components/format-row';
import { UsageAggregator } from '../../src/services/usage-aggregator';
import {
  LEDGER_SCHEMA_VERSION,
  KV_NAMESPACE_PREFIX,
  buildLedgerKey,
  createLedger,
  getCurrentMonthKey,
} from '../../src/state/kv-ledger';
import { MockKV } from '../helpers/mock-api';

import type { UsageRecord } from '../../src/adapters/history-scanner';
import type { WidgetViewModel } from '../../src/services/usage-aggregator';

export type FixtureResult = {
  kv: MockKV;
  viewModel: WidgetViewModel;
  normalLines: string[];
  narrowLines: string[];
  snapshot: string;
};

type RunFixtureOptions = {
  title: string;
  description: string;
  date?: string;
  currency?: string;
  historyRecords?: UsageRecord[];
  liveRecords?: UsageRecord[];
  seedKV?: (kv: MockKV, month: string) => void;
};

export async function runFixture(options: RunFixtureOptions): Promise<FixtureResult> {
  const {
    title,
    description,
    date = '2024-04-15T12:00:00Z',
    currency = '$',
    historyRecords = [],
    liveRecords = [],
    seedKV,
  } = options;

  vi.setSystemTime(new Date(date));

  const kv = new MockKV();
  const month = getCurrentMonthKey(new Date(date));
  seedKV?.(kv, month);

  vi.spyOn(historyScanner, 'scanCurrentMonthHistory').mockReturnValue(historyRecords);

  const aggregator = new UsageAggregator(createLedger(kv), { currency });
  await aggregator.initialize();

  for (const record of liveRecords) {
    aggregator.processRecord(record);
  }

  return buildFixtureResult(title, description, kv, aggregator.getViewModel());
}

export function buildFixtureResult(
  title: string,
  description: string,
  kv: MockKV,
  viewModel: WidgetViewModel
): FixtureResult {
  const normalLines = viewModel.rows.map(row => formatRow(row, false));
  const narrowLines = viewModel.rows.map(row => formatRow(row, true));

  return {
    kv,
    viewModel,
    normalLines,
    narrowLines,
    snapshot: formatFixtureSnapshot(title, description, viewModel, normalLines, narrowLines),
  };
}

export function seedCorruptAggregateKV(kv: MockKV, month: string): void {
  kv.set(`${KV_NAMESPACE_PREFIX}:schema:version`, LEDGER_SCHEMA_VERSION);
  kv.set(`${KV_NAMESPACE_PREFIX}:meta:currentMonth`, month);
  kv.set(buildLedgerKey(month, 'meta', 'aggregateProviders'), ['minimax']);
  kv.set(buildLedgerKey(month, 'meta', 'processedFingerprints'), ['minimax:1:100']);
  kv.set(buildLedgerKey(month, 'aggregate', 'minimax'), {
    month,
    provider: 'minimax',
    tokens: 'corrupt',
    cost: 1.5,
  });
}

function formatFixtureSnapshot(
  title: string,
  description: string,
  viewModel: WidgetViewModel,
  normalLines: string[],
  narrowLines: string[]
): string {
  const rows = viewModel.rows
    .map(
      row =>
        `${row.bucket}|tokens=${row.tokens}|tokensFormatted=${row.tokensFormatted}|cost=${row.cost ?? 'null'}|costFormatted=${row.costFormatted ?? 'null'}|showCost=${row.showCost}|remaining=${row.remaining ?? 'null'}|remainingFormatted=${row.remainingFormatted}|percentage=${row.percentage ?? 'null'}`
    )
    .join('\n');

  return [
    `fixture=${title}`,
    `description=${description}`,
    `month=${viewModel.month}`,
    'rows:',
    rows,
    'normal:',
    ...normalLines,
    'narrow:',
    ...narrowLines,
  ].join('\n');
}
