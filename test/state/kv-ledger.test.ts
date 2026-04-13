import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  LEDGER_SCHEMA_VERSION,
  KV_NAMESPACE_PREFIX,
  buildLedgerKey,
  createLedger,
  getCurrentMonthKey,
} from '../../src/state/kv-ledger';
import { MockKV } from '../helpers/mock-kv';

describe('kv ledger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-04-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('uses namespaced keys', () => {
    const kv = new MockKV();
    const ledger = createLedger(kv);

    ledger.updateAggregate('minimax', 1200, 1.25);
    ledger.markRecordProcessed('message-1');
    ledger.save();

    expect(buildLedgerKey('2024-04', 'aggregate', 'minimax')).toBe(
      'token-spend-bar:v1:2024-04:aggregate:minimax',
    );
    expect([...kv.store.keys()]).toEqual(
      expect.arrayContaining([
        `${KV_NAMESPACE_PREFIX}:schema:version`,
        `${KV_NAMESPACE_PREFIX}:meta:currentMonth`,
        'token-spend-bar:v1:2024-04:aggregate:minimax',
        'token-spend-bar:v1:2024-04:processed:message-1',
        'token-spend-bar:v1:2024-04:meta:lastRebuild',
      ]),
    );
  });

  it('saves and loads aggregates', () => {
    const kv = new MockKV();
    const ledger = createLedger(kv);

    ledger.updateAggregate('minimax', 100, 0.5);
    ledger.updateAggregate('minimax', 50, 0.25);
    ledger.updateAggregate('chatgpt-plus', 1000, null);
    ledger.save();

    const reloaded = createLedger(kv);

    expect(reloaded.shouldRebuild()).toBe(false);
    expect(reloaded.getAggregates()).toEqual([
      { month: '2024-04', provider: 'minimax', tokens: 150, cost: 0.75 },
      { month: '2024-04', provider: 'chatgpt-plus', tokens: 1000, cost: null },
    ]);
  });

  it('detects duplicate processed records', () => {
    const kv = new MockKV();
    const ledger = createLedger(kv);

    expect(ledger.isRecordProcessed('message-42')).toBe(false);

    ledger.markRecordProcessed('message-42');
    ledger.save();

    const reloaded = createLedger(kv);

    expect(reloaded.isRecordProcessed('message-42')).toBe(true);
    expect(reloaded.isRecordProcessed('message-99')).toBe(false);
  });

  it('rebuilds when the month changes', () => {
    const kv = new MockKV();
    const aprilLedger = createLedger(kv);

    aprilLedger.updateAggregate('opencode-go', 250, 2.5);
    aprilLedger.markRecordProcessed('apr-message');
    aprilLedger.save();

    vi.setSystemTime(new Date('2024-05-01T00:00:00Z'));

    const mayLedger = createLedger(kv);

    expect(getCurrentMonthKey()).toBe('2024-05');
    expect(mayLedger.shouldRebuild()).toBe(true);
    expect(mayLedger.getAggregates()).toEqual([]);
    expect(mayLedger.isRecordProcessed('apr-message')).toBe(false);
  });

  it('recovers from corrupt data without crashing', () => {
    const kv = new MockKV();
    kv.set(`${KV_NAMESPACE_PREFIX}:schema:version`, LEDGER_SCHEMA_VERSION);
    kv.set(`${KV_NAMESPACE_PREFIX}:meta:currentMonth`, '2024-04');
    kv.set(buildLedgerKey('2024-04', 'meta', 'aggregateProviders'), ['minimax']);
    kv.set(buildLedgerKey('2024-04', 'meta', 'processedFingerprints'), ['message-1']);
    kv.set(buildLedgerKey('2024-04', 'aggregate', 'minimax'), { month: '2024-04', provider: 'minimax', tokens: 'bad' });

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const ledger = createLedger(kv);

    expect(ledger.shouldRebuild()).toBe(true);
    expect(ledger.getAggregates()).toEqual([]);
    expect(ledger.isRecordProcessed('message-1')).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('rebuilds on schema version mismatch', () => {
    const kv = new MockKV();
    kv.set(`${KV_NAMESPACE_PREFIX}:schema:version`, LEDGER_SCHEMA_VERSION + 1);
    kv.set(`${KV_NAMESPACE_PREFIX}:meta:currentMonth`, '2024-04');

    const ledger = createLedger(kv);

    expect(ledger.shouldRebuild()).toBe(true);
    expect(ledger.getAggregates()).toEqual([]);
  });
});
