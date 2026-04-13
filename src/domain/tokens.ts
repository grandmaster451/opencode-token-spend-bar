export type TokenBreakdown = {
  total?: number;
  input?: number;
  output?: number;
  reasoning?: number;
  cache?: {
    read?: number;
    write?: number;
  };
};

export type TokenPayload = TokenBreakdown | null;

export function getTokenCount(tokens: TokenBreakdown | null | undefined): number {
  if (!tokens) {
    return 0;
  }

  if (typeof tokens.total === 'number' && Number.isFinite(tokens.total)) {
    return tokens.total;
  }

  const values = [
    tokens.input,
    tokens.output,
    tokens.reasoning,
    tokens.cache?.read,
    tokens.cache?.write,
  ].map((value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0));

  return values.reduce((sum, value) => sum + value, 0);
}
