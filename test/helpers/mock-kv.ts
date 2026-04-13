import type { TuiKV } from '@opencode-ai/plugin/tui';

export class MockKV implements TuiKV {
  readonly ready = true;
  readonly store = new Map<string, unknown>();

  get<Value = unknown>(key: string, fallback?: Value): Value {
    return this.store.has(key) ? (this.store.get(key) as Value) : (fallback as Value);
  }

  set(key: string, value: unknown): void {
    this.store.set(key, value);
  }
}
