# F4 Scope Fidelity Check — opencode-token-spend-bar

## Verdict

APPROVE

## Scope violations found

None.

## Evidence

### In scope — present

- **Reusable TUI plugin package**: package metadata exports a reusable package entrypoint (`package.json:2-13`, `src/index.tsx:1-5`).
- **Session-only right-side widget**: plugin registers only `session_prompt_right` and renders `SessionSpendWidget` there (`src/plugin.tsx:33-46`).
- **MiniMax API support**: provider normalization includes `minimax` (`src/domain/provider.ts:9-19`).
- **OpenCode Go support**: provider normalization includes `opencode-go` (`src/domain/provider.ts:9-19`).
- **ChatGPT Plus support**: provider normalization maps `openai` into `chatgpt-plus` (`src/domain/provider.ts:15-16`); integration coverage exists (`test/integration/provider-switch-restart.test.ts:43-57`).
- **Current calendar month aggregation**: month bounds and filtering are current-month only (`src/domain/period.ts:1-12`, `src/adapters/history-scanner.ts:60-75`, `157-186`).
- **Monthly usage ledger**: ledger state is month-keyed and stores monthly aggregates (`src/state/kv-ledger.ts:13-48`, `50-161`).
- **KV persistence with rebuild**: KV load/save, schema/month mismatch rebuilds, and corrupt-state rebuilds are implemented (`src/state/kv-ledger.ts:101-161`); rebuild is exercised in tests (`test/fixtures/month-rollover.test.ts:18-55`, `test/fixtures/corrupt-kv-rebuild.test.ts:15-35`).
- **Tests, snapshots, QA harness**: Vitest suite is comprehensive (`vitest.config.ts:3-17`, `test/...`), fixture snapshots are documented (`test/fixtures/README.md:17-31`), and QA scripts exist (`scripts/qa-full-chain.js:1-19`, `scripts/qa-tui-snapshot.js:1-26`).
- **Install/config docs**: installation/configuration/example docs exist (`README.md:23-58`, `examples/opencode.json.example:1-5`).

### ChatGPT Plus requirements

- **Shows usage-only (tokens)**: ChatGPT Plus cost display is disabled by rule (`src/domain/formatter.ts:19-21`), and row formatting omits cost when `showCost` is false (`src/components/format-row.ts:5-23`).
- **Never shows currency symbol**: dedicated tests assert no `$` appears for ChatGPT Plus in normal or narrow modes (`test/components/session-spend-widget-chatgpt-plus.test.tsx:19-70`).
- **Never shows estimated cost**: aggregator nulls cost output for ChatGPT Plus because `showCost` is false unless metered providers have real cost (`src/services/usage-aggregator.ts:93-107`).

### Architecture requirements

- **OpenCode core not patched**: implementation lives entirely in plugin package sources under `src/`; packaged output contains only plugin artifacts (`package.json:49-54`, `npm pack --dry-run` via QA).
- **Only `session_prompt_right` slot used**: the sole registered slot is `session_prompt_right` (`src/plugin.tsx:33-46`).
- **No server-side plugin (TUI-only)**: exported implementation is a `TuiPlugin`; there is no server plugin entrypoint (`src/plugin.tsx:1-46`, `src/index.tsx:1-5`).

### Out of scope — absent

- **No home-screen widget**: docs explicitly state session-only display, not home screen (`README.md:64-67`); code registers no home slot (`src/plugin.tsx:33-46`).
- **No remote provider billing APIs**: data source is local OpenCode SQLite history plus TUI KV only (`src/adapters/history-scanner.ts:43-58`, `157-186`; `src/state/kv-ledger.ts:50-161`).
- **No budget alerts or thresholds**: no alerting/threshold logic exists; docs explicitly list this as not implemented (`README.md:64-67`).
- **No manual currency conversion**: cost formatting only prefixes configured currency symbol to recorded amount; no conversion logic exists (`src/domain/formatter.ts:11-17`).
- **No historical analytics beyond current month**: only current month bounds, current month key, and month rollover rebuild are implemented (`src/domain/period.ts:1-12`, `src/state/kv-ledger.ts:42-48`, `101-117`).
- **No dashboard/reporting UI**: only compact session widget rendering exists (`src/components/SessionSpendWidget.tsx:9-22`).
- **No subscription management**: no subscription/account management code or docs are present in package sources/docs reviewed.
- **No additional providers**: provider whitelist is exactly `minimax`, `opencode-go`, and `chatgpt-plus` (`src/domain/provider.ts:1-19`, `src/services/usage-aggregator.ts:121-123`).

## Verification

- `lsp_diagnostics` on `src/`: 0 diagnostics.
- `npm run qa:full`: passed (`61` tests, build success, `npm pack --dry-run` success).
