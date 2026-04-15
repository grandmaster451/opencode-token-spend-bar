import { createElement, insert, setProp, type JSX } from '@opentui/solid';

type Props = {
  error: Error;
  onRetry?: () => void;
};

export function ErrorFallback(props: Props): JSX.Element {
  console.error('[TokenSpendBar] Error:', props.error.message, props.error.stack);

  const box = createElement('box');
  setProp(box, 'flexDirection', 'column');
  setProp(box, 'borderStyle', 'round');

  const title = createElement('text');
  insert(title, 'Token spend (error)');
  insert(box, title);

  const msg = createElement('text');
  insert(msg, truncate(props.error.message, 60));
  insert(box, msg);

  return box as unknown as JSX.Element;
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}
