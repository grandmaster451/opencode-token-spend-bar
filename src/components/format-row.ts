import type { ProviderRowViewModel } from '../services/usage-aggregator';

export const NARROW_THRESHOLD = 40;

function formatRowNormal(row: ProviderRowViewModel): string {
  const tokens = row.tokensFormatted;
  if (row.showCost && row.costFormatted !== null) {
    return `${row.label}  ${tokens}  ${row.costFormatted}`;
  }
  return `${row.label}  ${tokens}`;
}

function formatRowNarrow(row: ProviderRowViewModel): string {
  const tokens = row.tokensFormatted;
  if (row.showCost && row.costFormatted !== null) {
    return `${row.label}:${tokens}/${row.costFormatted}`;
  }
  return `${row.label}:${tokens}`;
}

export function formatRow(row: ProviderRowViewModel, narrow: boolean): string {
  return narrow ? formatRowNarrow(row) : formatRowNormal(row);
}