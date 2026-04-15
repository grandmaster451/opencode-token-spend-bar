import { describe, expect, it } from 'vitest';

import { createEmptyRowState, mergeRowStates } from '../../src/domain/row-state';

describe('createEmptyRowState', () => {
  it('creates a zeroed state for a bucket', () => {
    expect(createEmptyRowState('minimax')).toEqual({
      bucket: 'minimax',
      tokens: 0,
      cost: 0,
      remaining: null,
      percentage: null,
    });
  });
});

describe('mergeRowStates', () => {
  it('groups by bucket, sums tokens, and sums cost', () => {
    expect(
      mergeRowStates([
        { bucket: 'opencode-go', tokens: 200, cost: 1.25, remaining: null, percentage: null },
        { bucket: 'minimax', tokens: 100, cost: 0.5, remaining: null, percentage: null },
        { bucket: 'opencode-go', tokens: 300, cost: 2.75, remaining: null, percentage: null },
      ])
    ).toEqual([
      { bucket: 'minimax', tokens: 100, cost: 0.5, remaining: null, percentage: null },
      { bucket: 'opencode-go', tokens: 500, cost: 4, remaining: null, percentage: null },
    ]);
  });

  it('returns null cost if any merged state has null cost', () => {
    expect(
      mergeRowStates([
        { bucket: 'chatgpt-plus', tokens: 100, cost: null, remaining: null, percentage: null },
        { bucket: 'chatgpt-plus', tokens: 250, cost: 1.5, remaining: null, percentage: null },
      ])
    ).toEqual([{ bucket: 'chatgpt-plus', tokens: 350, cost: null, remaining: null, percentage: null }]);
  });

  it('keeps provider rows in fixed display order', () => {
    expect(
      mergeRowStates([
        { bucket: 'chatgpt-plus', tokens: 20, cost: null, remaining: null, percentage: null },
        { bucket: 'minimax', tokens: 10, cost: 0.25, remaining: null, percentage: null },
        { bucket: 'opencode-go', tokens: 30, cost: 0.75, remaining: null, percentage: null },
      ]).map(state => state.bucket)
    ).toEqual(['minimax', 'opencode-go', 'chatgpt-plus']);
  });

  it('preserves first non-null remaining and percentage when merging', () => {
    expect(
      mergeRowStates([
        { bucket: 'minimax', tokens: 100, cost: 0.5, remaining: null, percentage: null },
        { bucket: 'minimax', tokens: 50, cost: 0.25, remaining: 400, percentage: 20 },
      ])
    ).toEqual([
      { bucket: 'minimax', tokens: 150, cost: 0.75, remaining: 400, percentage: 20 },
    ]);
  });
});
