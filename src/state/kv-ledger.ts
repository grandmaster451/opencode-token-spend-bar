import type { TuiKV } from '@opencode-ai/plugin/tui';

import { isProviderBucket, type ProviderBucket } from '../domain/provider';

export const KV_NAMESPACE_PREFIX = 'token-spend-bar:v1';
export const LEDGER_SCHEMA_VERSION = 1;

const SCHEMA_VERSION_KEY = `${KV_NAMESPACE_PREFIX}:schema:version`;
const ACTIVE_MONTH_KEY = `${KV_NAMESPACE_PREFIX}:meta:currentMonth`;

const MISSING = Symbol('missing');

export type MonthlyAggregate = {
  month: string;
  provider: ProviderBucket;
  tokens: number;
  cost: number | null;
};

export type LedgerState = {
  schemaVersion: number;
  currentMonth: string;
  aggregates: MonthlyAggregate[];
  processedFingerprints: Set<string>;
};

export type Ledger = {
  isRecordProcessed: (fingerprint: string) => boolean;
  markRecordProcessed: (fingerprint: string) => void;
  updateAggregate: (provider: ProviderBucket, tokens: number, cost: number | null) => void;
  getAggregates: () => MonthlyAggregate[];
  shouldRebuild: () => boolean;
  triggerRebuild: () => void;
  save: () => void;
};

type LoadResult = {
  state: LedgerState;
  shouldRebuild: boolean;
};

export function getCurrentMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function buildLedgerKey(month: string, type: string, id: string): string {
  return `${KV_NAMESPACE_PREFIX}:${month}:${type}:${id}`;
}

export function createLedger(kv: TuiKV): Ledger {
  const loaded = loadLedgerState(kv);
  let state = loaded.state;
  let rebuildRequired = loaded.shouldRebuild;

  return {
    isRecordProcessed(fingerprint: string): boolean {
      return state.processedFingerprints.has(fingerprint);
    },

    markRecordProcessed(fingerprint: string): void {
      state.processedFingerprints.add(fingerprint);
    },

    updateAggregate(provider: ProviderBucket, tokens: number, cost: number | null): void {
      const existing = state.aggregates.find((aggregate) => aggregate.provider === provider);

      if (!existing) {
        state.aggregates.push({
          month: state.currentMonth,
          provider,
          tokens,
          cost,
        });
        return;
      }

      existing.tokens += tokens;
      existing.cost = existing.cost === null || cost === null ? null : existing.cost + cost;
    },

    getAggregates(): MonthlyAggregate[] {
      return state.aggregates.map((aggregate) => ({ ...aggregate }));
    },

    shouldRebuild(): boolean {
      return rebuildRequired;
    },

    triggerRebuild(): void {
      state = createEmptyLedgerState(state.currentMonth);
      rebuildRequired = true;
    },

    save(): void {
      saveLedgerState(kv, state);
      rebuildRequired = false;
    },
  };
}

function loadLedgerState(kv: TuiKV): LoadResult {
  const currentMonth = getCurrentMonthKey();
  const schemaVersion = kv.get<number | typeof MISSING>(SCHEMA_VERSION_KEY, MISSING);
  const activeMonth = kv.get<string | typeof MISSING>(ACTIVE_MONTH_KEY, MISSING);

  const kvIsEmpty = schemaVersion === MISSING && activeMonth === MISSING;
  if (kvIsEmpty) {
    return { state: createEmptyLedgerState(currentMonth), shouldRebuild: true };
  }

  if (schemaVersion !== LEDGER_SCHEMA_VERSION) {
    return { state: createEmptyLedgerState(currentMonth), shouldRebuild: true };
  }

  if (activeMonth !== currentMonth) {
    return { state: createEmptyLedgerState(currentMonth), shouldRebuild: true };
  }

  try {
    const aggregateProviders = readStringArray(kv.get(buildLedgerKey(currentMonth, 'meta', 'aggregateProviders'), []));
    const processedFingerprints = readStringArray(kv.get(buildLedgerKey(currentMonth, 'meta', 'processedFingerprints'), []));

    const aggregates = aggregateProviders.map((provider) => {
      const aggregate = kv.get<unknown>(buildLedgerKey(currentMonth, 'aggregate', provider), null);
      return validateAggregate(aggregate, currentMonth);
    });

    return {
      state: {
        schemaVersion: LEDGER_SCHEMA_VERSION,
        currentMonth,
        aggregates,
        processedFingerprints: new Set(processedFingerprints),
      },
      shouldRebuild: false,
    };
  } catch (error) {
    console.warn('[token-spend-bar] Corrupt KV ledger detected, rebuilding state.', error);
    return { state: createEmptyLedgerState(currentMonth), shouldRebuild: true };
  }
}

function saveLedgerState(kv: TuiKV, state: LedgerState): void {
  kv.set(SCHEMA_VERSION_KEY, state.schemaVersion);
  kv.set(ACTIVE_MONTH_KEY, state.currentMonth);
  kv.set(buildLedgerKey(state.currentMonth, 'meta', 'lastRebuild'), Date.now());

  const aggregateProviders = state.aggregates.map((aggregate) => aggregate.provider);
  kv.set(buildLedgerKey(state.currentMonth, 'meta', 'aggregateProviders'), aggregateProviders);

  for (const aggregate of state.aggregates) {
    kv.set(buildLedgerKey(state.currentMonth, 'aggregate', aggregate.provider), aggregate);
  }

  const processedFingerprints = [...state.processedFingerprints];
  kv.set(buildLedgerKey(state.currentMonth, 'meta', 'processedFingerprints'), processedFingerprints);

  for (const fingerprint of processedFingerprints) {
    kv.set(buildLedgerKey(state.currentMonth, 'processed', fingerprint), true);
  }
}

function createEmptyLedgerState(currentMonth: string): LedgerState {
  return {
    schemaVersion: LEDGER_SCHEMA_VERSION,
    currentMonth,
    aggregates: [],
    processedFingerprints: new Set<string>(),
  };
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error('Expected string array in KV ledger metadata.');
  }

  return value;
}

function validateAggregate(value: unknown, currentMonth: string): MonthlyAggregate {
  if (!isRecord(value)) {
    throw new Error('Aggregate entry must be an object.');
  }

  const { month, provider, tokens, cost } = value;

  if (month !== currentMonth) {
    throw new Error('Aggregate month mismatch.');
  }

  if (!isProviderBucket(provider)) {
    throw new Error('Aggregate provider is invalid.');
  }

  if (typeof tokens !== 'number' || Number.isNaN(tokens)) {
    throw new Error('Aggregate token count is invalid.');
  }

  if (cost !== null && (typeof cost !== 'number' || Number.isNaN(cost))) {
    throw new Error('Aggregate cost is invalid.');
  }

  return { month, provider, tokens, cost };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
