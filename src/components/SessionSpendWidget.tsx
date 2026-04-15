import { createElement, insert, setProp, type JSX } from '@opentui/solid';
import type { WidgetViewModel } from '../services/usage-aggregator';
import { formatRow, NARROW_THRESHOLD } from './format-row';
import { useAnimatedNumber } from './AnimatedNumber';
import { formatTokens } from '../domain/formatter';

type Props = {
  viewModel: WidgetViewModel;
  columns?: number;
  colors?: {
    text?: unknown;
    muted?: unknown;
  };
};

export function SessionSpendWidget(props: Props): JSX.Element {
  const columns = props.columns ?? 80;
  const narrow = columns < NARROW_THRESHOLD;

  // Calculate max label width for alignment
  const maxLabelWidth = props.viewModel.rows.reduce((max, row) => 
    Math.max(max, row.label.length), 0);

  const box = createElement('box');
  setProp(box, 'flexDirection', 'column');

  const heading = createElement('text');
  if (props.colors?.text) {
    setProp(heading, 'fg', props.colors.text);
  }
  insert(heading, props.viewModel.heading);
  insert(box, heading);

  for (const row of props.viewModel.rows) {
    // Animate the token count, but keep the quota info static
    const animatedDisplay = useAnimatedNumber(() => row.tokens);
    const text = createElement('text');
    if (props.colors?.muted) {
      setProp(text, 'fg', props.colors.muted);
    }
    insert(text, () => {
      const animatedTokens = formatTokens(animatedDisplay());
      const animatedRow = { ...row, remainingFormatted: `${animatedTokens}${row.remainingFormatted.slice(row.tokensFormatted.length)}` };
      return formatRow(animatedRow, narrow, maxLabelWidth);
    });
    insert(box, text);
  }

  return box as unknown as JSX.Element;
}
