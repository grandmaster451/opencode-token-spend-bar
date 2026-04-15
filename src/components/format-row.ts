import type { ProviderRowViewModel } from '../services/usage-aggregator';

export const NARROW_THRESHOLD = 40;

function padEnd(str: string, length: number): string {
  return str.length >= length ? str : str + ' '.repeat(length - str.length);
}

function formatRowNormal(row: ProviderRowViewModel, labelWidth: number): string {
  const remaining = row.remainingFormatted;
  const paddedLabel = padEnd(row.label, labelWidth);
  const parts: string[] = [`${paddedLabel}  ${remaining}`];

  if (row.showCost && row.costFormatted !== null) {
    parts.push(`(${row.costFormatted})`);
  }

  if (row.percentage !== null) {
    parts.push(`| ${row.percentage}% used`);
  }

  return parts.join('  ');
}

function formatRowNarrow(row: ProviderRowViewModel): string {
  const remaining = row.remainingFormatted;
  const parts: string[] = [`${row.label}:${remaining}`];

  if (row.showCost && row.costFormatted !== null) {
    parts.push(`(${row.costFormatted})`);
  }

  if (row.percentage !== null) {
    parts.push(`${row.percentage}%`);
  }

  return parts.join('/');
}

export function formatRow(row: ProviderRowViewModel, narrow: boolean, labelWidth: number = 0): string {
  return narrow ? formatRowNarrow(row) : formatRowNormal(row, labelWidth);
}
