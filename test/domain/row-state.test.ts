import { describe, expect, it } from 'vitest';

import { createEmptyRowState, mergeRowStates } from '../../src/domain/row-state';

describe('createEmptyRowState', () => {
  it('creates a zeroed state for a bucket', () => {
    expect(createEmptyRowState('minimax')).toEqual({
      bucket: 'minimax',
      tokens: 0,
      cost: 0,
    });
  });
});

describe('mergeRowStates', () => {
  it('groups by bucket, sums tokens, and sums cost', () => {
    expect(
      mergeRowStates([
        { bucket: 'opencode-go', tokens: 200, cost: 1.25 },
        { bucket: 'minimax', tokens: 100, cost: 0.5 },
        { bucket: 'opencode-go', tokens: 300, cost: 2.75 },
      ]),
    ).toEqual([
      { bucket: 'minimax', tokens: 100, cost: 0.5 },
      { bucket: 'opencode-go', tokens: 500, cost: 4 },
    ]);
  });

  it('returns null cost if any merged state has null cost', () => {
    expect(
      mergeRowStates([
        { bucket: 'chatgpt-plus', tokens: 100, cost: null },
        { bucket: 'chatgpt-plus', tokens: 250, cost: 1.5 },
      ]),
    ).toEqual([{ bucket: 'chatgpt-plus', tokens: 350, cost: null }]);
  });

  it('keeps provider rows in fixed display order', () => {
    expect(
      mergeRowStates([
        { bucket: 'chatgpt-plus', tokens: 20, cost: null },
        { bucket: 'minimax', tokens: 10, cost: 0.25 },
        { bucket: 'opencode-go', tokens: 30, cost: 0.75 },
      ]).map((state) => state.bucket),
    ).toEqual(['minimax', 'opencode-go', 'chatgpt-plus']);
  });
});
