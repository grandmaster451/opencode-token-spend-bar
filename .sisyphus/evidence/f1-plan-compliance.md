# F1 Plan Compliance Audit — opencode-token-spend-bar

## Verdict

APPROVE

## Plan requirements met

- [x] **TUI-first plugin package (not dual-entry)** — `package.json` exposes a single package entry (`exports["."]`), build targets `src/index.tsx`, and `dist/` contains only `index.js` + `index.d.ts`; exported type is `TuiPlugin` (`package.json`, `src/index.tsx`, `dist/index.d.ts`).
- [x] **Session-only widget in `session_prompt_right`** — the plugin registers only `session_prompt_right` (`src/plugin.tsx:33-46`).
- [x] **Current calendar month aggregation** — current-month bounds come from `getCurrentMonthBounds()`, history scan filters by those bounds, and the ledger month key is `YYYY-MM` for the active month only (`src/domain/period.ts`, `src/adapters/history-scanner.ts`, `src/state/kv-ledger.ts`).
- [x] **Three provider rows: MM, OCG, GPT+** — provider labels and fixed row order are exactly `MM`, `OCG`, `GPT+` (`src/domain/provider.ts`, `src/services/usage-aggregator.ts`).
- [x] **Real spend only when OpenCode cost exists** — metered rows show currency only when an aggregate exists with non-null cost (`src/services/usage-aggregator.ts:96-106`).
- [x] **ChatGPT Plus usage-only (no currency)** — `chatgpt-plus` is excluded from cost display by rule and covered by dedicated tests (`src/domain/formatter.ts:19-21`, `test/components/session-spend-widget-chatgpt-plus.test.tsx`).
- [x] **Narrow-width fallback implemented** — `NARROW_THRESHOLD = 40` with compact row formatting and fixture coverage (`src/components/format-row.ts`, `test/components/session-spend-widget.test.tsx`, `test/fixtures/narrow-width.test.ts`).
- [x] **Namespaced KV keys** — storage uses `token-spend-bar:v1:*` (`src/state/kv-ledger.ts:5-10`, `46-48`).
- [x] **Rebuild-on-missing/corrupt behavior** — empty/mismatched/corrupt KV state forces rebuild; `initialize()` rehydrates from current-month history (`src/state/kv-ledger.ts:101-140`, `src/services/usage-aggregator.ts:41-58`).
- [x] **Duplicate-event protection** — processed fingerprints are persisted and checked before applying live/history records; coverage exists for duplicate live records and init+live overlap (`src/services/usage-aggregator.ts:60-73`, `src/state/kv-ledger.ts:27-35`, `test/services/usage-aggregator.test.ts`, `test/services/usage-aggregator-edge.test.ts`).

## Must NOT have — verified absent

- [x] **No OpenCode core patching** — implementation is confined to the plugin package; no core-modification code found in source.
- [x] **No `home_prompt_right` support** — no implementation references found; only `session_prompt_right` is registered.
- [x] **No remote dashboard polling** — data comes from local OpenCode SQLite history + TUI KV only (`src/adapters/history-scanner.ts`, `src/state/kv-ledger.ts`).
- [x] **No synthetic ChatGPT Plus spend** — ChatGPT Plus rows never display currency even if cost data is present (`test/components/session-spend-widget-chatgpt-plus.test.tsx:52-70`).
- [x] **No merged cross-provider total** — widget view model renders only the three provider rows; no total row or cross-provider aggregation UI exists (`src/services/usage-aggregator.ts:84-109`, `src/components/SessionSpendWidget.tsx`).
- [x] **No budget alerts/notifications** — no alerting/threshold code found in implementation.

## Acceptance criteria verified

- [x] **`npm install` succeeds** — passed on 2026-04-13 (`up to date`).
- [x] **`npm run test` passes (61 tests)** — passed: 21 files, 61 tests.
- [x] **`npm run build` emits TUI plugin** — passed; output `dist/index.js`, `dist/index.d.ts`.
- [x] **`npm run qa:tui-snapshot` works** — passed; 9 fixture snapshot tests succeeded and wrote `.sisyphus/evidence/qa-snapshots.txt`.
- [x] **`npm pack --dry-run` succeeds** — passed; tarball contains `README.md`, `dist/`, example config, and `package.json`.

## Notes

- I did not find a `.sisyphus/plans/*.md` file in this workspace, so this audit used the provided review checklist as the authoritative plan requirements.
- There is a known non-blocking quality risk already noted elsewhere: the duplicate fingerprint key is implemented but somewhat collision-prone (`provider:timestamp:tokens`). That does not invalidate this specific plan-compliance checklist because duplicate-event protection is present and tested.
