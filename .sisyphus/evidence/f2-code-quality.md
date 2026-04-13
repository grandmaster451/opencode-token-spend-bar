# F2 Code Quality Review — opencode-token-spend-bar

## Verdict

REJECT

## What passed

- `npm test` passed: 21 files, 61 tests.
- `npm run lint` passed.
- `npm run build` passed.
- Domain/UI separation is generally good: domain helpers live under `src/domain`, persistence under `src/state`, DB scan logic under `src/adapters`, and UI rendering under `src/components`.
- Event subscription cleanup is present: `message.updated` unsubscribe is registered via `api.lifecycle.onDispose()` in `src/plugin.tsx:28-31`.
- KV usage is namespaced and versioned via `token-spend-bar:v1` in `src/state/kv-ledger.ts:5-10`.

## Reject reasons

1. **Type safety regression: `any` is still present.**
   - `src/adapters/history-scanner.ts:217-220` returns `Record<string, any> | null` from `safeParseJson`.
   - Review requirement explicitly called for proper TypeScript types with no `any`.

2. **Maintainability issue: domain logic is duplicated across modules.**
   - Token counting logic appears in both `src/plugin.tsx:74-88` and `src/adapters/history-scanner.ts:245-263`.
   - Provider/order guards are also duplicated:
     - `ROW_ORDER` in `src/domain/row-state.ts:9` and `src/services/usage-aggregator.ts:33`
     - `isProviderBucket` in `src/services/usage-aggregator.ts:121-123` and `src/state/kv-ledger.ts:210-212`
   - This creates drift risk if provider rules change.

3. **Hardcoded machine-specific path should be configurable/resolved, not embedded.**
   - `src/adapters/history-scanner.ts:43` hardcodes `C:\Users\chist\.local\share\opencode\opencode.db`.
   - This is a portability/configurability issue and violates the “no hardcoded values that should be configurable” review target.

4. **History scan failure path is silently swallowed.**
   - `src/adapters/history-scanner.ts:164-185` catches every DB/open/query error and returns `[]` without diagnostics.
   - That makes operational failures indistinguishable from “no usage this month”, which is risky for plugin observability and debugging.

5. **Edge-case dedupe key is too weak and is not covered by tests.**
   - `src/services/usage-aggregator.ts:111-113` fingerprints only `provider:timestamp:tokens`.
   - Two distinct records with the same provider, completion timestamp, and token count but different cost/message identity would collapse incorrectly.
   - No test currently exercises fingerprint collision behavior.

6. **Test suite has repeated test helpers instead of shared fixtures/utilities.**
   - `MockKV` is redefined in `test/services/usage-aggregator.test.ts:9-20`, `test/services/usage-aggregator-edge.test.ts:9-20`, and `test/state/kv-ledger.test.ts:13-24` even though `test/helpers/mock-api.ts:13-24` already exports one.
   - `makeRow` is duplicated in both component test files.
   - Not a functional bug, but it weakens maintainability and violates the “no code duplication” goal.

## Coverage notes

- Happy-path coverage is strong across domain, services, integration, and fixture scenarios.
- Error-path coverage exists for corrupt KV rebuild and missing DB, but there is still no direct test for DB open/query exceptions in `scanCurrentMonthHistory()` and no test for dedupe-key collision.

## Summary

The plugin is functionally solid and currently passes test/lint/build, but it does **not** meet the requested final code-quality bar because of remaining `any` usage, duplicated business rules, a hardcoded environment path, and a silent failure path in the history adapter.
