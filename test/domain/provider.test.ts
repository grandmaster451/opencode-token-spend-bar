import { describe, expect, it } from 'vitest';

import { getProviderDisplayLabel, normalizeProvider } from '../../src/domain/provider';

describe('normalizeProvider', () => {
  it('maps all supported providers to v1 buckets', () => {
    expect(normalizeProvider('minimax')).toBe('minimax');
    expect(normalizeProvider('opencode-go')).toBe('opencode-go');
    expect(normalizeProvider('openai')).toBe('chatgpt-plus');
  });

  it('ignores unsupported providers', () => {
    expect(normalizeProvider('opencode')).toBeNull();
    expect(normalizeProvider('anthropic')).toBeNull();
    expect(normalizeProvider('')).toBeNull();
  });
});

describe('getProviderDisplayLabel', () => {
  it('returns compact row labels', () => {
    expect(getProviderDisplayLabel('minimax')).toBe('MM');
    expect(getProviderDisplayLabel('opencode-go')).toBe('OCG');
    expect(getProviderDisplayLabel('chatgpt-plus')).toBe('GPT+');
  });
});
