# Fixture scenarios

These fixture tests provide deterministic, credential-free QA coverage for the token spend bar.

## Scenarios

- `minimax-only.test.ts` — MiniMax-only month with metered cost aggregation.
- `opencode-go-only.test.ts` — OpenCode Go-only month with metered cost aggregation.
- `chatgpt-plus-only.test.ts` — ChatGPT Plus-only month where the widget stays token-only.
- `mixed-providers.test.ts` — Mixed provider inputs while preserving fixed row order.
- `missing-cost.test.ts` — Metered providers with `null` cost values falling back to token-only display.
- `zero-data.test.ts` — Empty usage history producing the stable all-zero widget.
- `narrow-width.test.ts` — Compact rendering for terminals narrower than 40 columns.
- `month-rollover.test.ts` — Ledger rebuild and view reset when the month changes.
- `corrupt-kv-rebuild.test.ts` — Safe recovery path when persisted KV state is corrupt.

## Pattern

Each fixture test:

1. Seeds deterministic history or KV state.
2. Runs the aggregator or rollover flow.
3. Verifies the expected widget view model and rendered lines.
4. Saves a deterministic Vitest snapshot for unattended QA runs.

## Notes

- No live provider credentials are required.
- No browser automation or manual interaction is required.
- Run `npm run qa:fixtures` for fixture verification.
- Run `npm run qa:tui-snapshot` to refresh fixture snapshots and save the QA transcript.
