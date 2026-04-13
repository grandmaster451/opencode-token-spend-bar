- 2026-04-13: Kept provider normalization as a strict v1 allowlist: `minimax`, `opencode-go`, and `openai -> chatgpt-plus`; everything else resolves to `null`.
- 2026-04-13: Month helpers should use local `new Date(year, month, day)` boundaries so `[start, end)` rollover behavior stays aligned with the local calendar month.
- 2026-04-13: Row-state merging is simplest when cost nullability is contagious per bucket and final rows are sorted by fixed provider order `minimax`, `opencode-go`, `chatgpt-plus`.
- 2026-04-13: KV persistence needs explicit monthly indexes (`meta:aggregateProviders`, `meta:processedFingerprints`) because the TUI KV API only exposes `get`/`set` and cannot enumerate or delete keys.
- 2026-04-13: OpenCode history backfill should read only the current calendar month from the local SQLite `message` and `part` tables, using `time.created` plus `step-finish` parts to recover token/cost usage safely.
- 2026-04-13: The usage aggregator should always emit exactly three rows in fixed provider order, but metered rows only expose currency when an actual aggregate with non-null cost exists; empty buckets stay token-zero with hidden cost.
- 2026-04-13: The TUI plugin should only ingest `message.updated` records for completed assistant messages; using `time.completed` as the live fingerprint timestamp avoids counting partial stream updates before the message is finalized.
- 2026-04-13: Plugin integration tests are easiest with a lightweight mock `TuiPluginApi` that captures `event.on`, `lifecycle.onDispose`, `slots.register`, and `renderer.requestRender`, while mocking `SessionSpendWidget` to assert the view-model passed through the slot.
- 2026-04-13: Fixture QA stays deterministic when each scenario freezes system time, seeds history/KV state explicitly, and snapshots both the view-model-derived rows and the narrow/normal rendered strings instead of depending on live TUI rendering.
- 2026-04-13: Final code-quality review found maintainability drift from duplicated provider/token logic across `plugin`, `history-scanner`, `usage-aggregator`, and `kv-ledger`; these rules should be centralized before adding more providers.
- 2026-04-13: F1 plan-compliance audit passed with the current implementation; the package stays TUI-only, session-slot-only, current-month-only, and all release gates (
pm install, 
pm test, 
pm run build, 
pm run qa:tui-snapshot, 
pm pack --dry-run) completed successfully.
- 2026-04-13: Correction to the prior audit note — the verified release gates were npm install, npm test, npm run build, npm run qa:tui-snapshot, and npm pack --dry-run.
- 2026-04-13: Token counting, provider-bucket validation, and row-order rules now live in shared domain utilities (`tokens.ts`, `provider.ts`, `row-state.ts`) so history backfill, live updates, ledger validation, and UI row building cannot drift independently.
- 2026-04-13: OpenCode DB access should resolve from `OPENCODE_DB_PATH`/`TOKEN_SPEND_BAR_OPENCODE_DB_PATH` first, then fall back to XDG data-home resolution (`XDG_DATA_HOME` or `~/.local/share/opencode/opencode.db`) even on Windows.
- 2026-04-13: F2 re-review passed after fixes; the current codebase now meets the quality gate for unknown-based typing, domain-centralized provider/token rules, configurable DB resolution, warn-on-error handling, cost-aware fingerprints, and shared test helpers.
