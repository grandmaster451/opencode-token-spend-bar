import type { WidgetViewModel } from '../services/usage-aggregator';
import { formatRow, NARROW_THRESHOLD } from './format-row';

type Props = {
  viewModel: WidgetViewModel;
  columns?: number;
};

export function SessionSpendWidget(props: Props) {
  const columns = props.columns ?? 80;
  const narrow = columns < NARROW_THRESHOLD;

  const lines = props.viewModel.rows.map((row) => formatRow(row, narrow));

  return (
    <box flexDirection="column">
      {lines.map((line) => (
        <text>{line}</text>
      ))}
    </box>
  );
}