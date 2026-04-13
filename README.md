# OpenCode Token Spend Bar Plugin

A reusable TUI plugin for OpenCode that displays a compact token spending widget in active sessions. Track your API costs at a glance without leaving your terminal.

## What It Does

The plugin shows a small spending summary in the top-right corner of your session prompt. It displays month-to-date costs for supported providers, updating as you work. The widget sits in the `session_prompt_right` slot, staying visible but unobtrusive.

## Supported Providers

| Provider | Display | Currency | Notes |
|----------|---------|----------|-------|
| MiniMax API | MM | USD | Real cost metadata from OpenCode |
| OpenCode Go | OCG | USD | Real cost metadata from OpenCode |
| ChatGPT Plus | GPT+ | N/A | Usage-only display |

Only MiniMax, OpenCode Go, and ChatGPT Plus are supported. Other providers are silently ignored.

## Current Month Semantics

The widget aggregates data for the current calendar month. When the month changes, the widget automatically rebuilds its cache from OpenCode local history to show fresh data for the new month. Historical months are not displayed.

## Installation

Install the plugin from npm:

```bash
npm install opencode-token-spend-bar
```

The plugin has peer dependencies on OpenCode packages. Your OpenCode installation should provide these automatically. If you see errors about missing peer dependencies, ensure you are running a recent version of OpenCode.

## Configuration

Add the plugin to your `opencode.json` configuration file. Create this file in your project root or home directory if it does not exist:

```json
{
  "plugin": [
    "opencode-token-spend-bar"
  ]
}
```

A full example configuration:

```json
{
  "plugin": [
    "opencode-token-spend-bar"
  ],
  "providers": {
    "minimax": {
      "apiKey": "your-api-key"
    }
  }
}
```

## v1 Limitations

This release has known constraints:

- **Session-only display**: The widget appears only in active sessions, not on the home screen
- **No budget alerts**: Cost thresholds and notifications are not implemented
- **No remote provider polling**: The plugin reads only from OpenCode local storage
- **ChatGPT Plus shows usage only**: The plugin displays token counts for ChatGPT Plus but cannot show synthetic currency costs

## Troubleshooting

### Missing cost rows

If you see a provider row missing from the display, the plugin fell back to usage-only mode because OpenCode has not recorded cost metadata for that provider in the current session. This is normal for providers that do not emit cost events. Costs are still tracked by OpenCode itself.

### Empty data on first run

The widget needs time to aggregate data from OpenCode history. On first install or after a month change, you may see empty or zero values for a few seconds until the aggregation completes. The widget updates automatically once data is available.

### Stale cache after month change

When the calendar month changes, the plugin rebuilds its cache from OpenCode local history. This happens automatically. If you notice incorrect data at month boundaries, restarting your session will trigger a fresh aggregation.

## Uninstall

To remove the plugin, edit your `opencode.json` and remove `"opencode-token-spend-bar"` from the plugin array:

```json
{
  "plugin": []
}
```

Then uninstall the package:

```bash
npm uninstall opencode-token-spend-bar
```

## Requirements

- OpenCode CLI with TUI support
- Node.js 18 or later
- Peer dependencies: `@opencode-ai/plugin`, `@opencode-ai/sdk`, `solid-js`, `@opentui/core`, `@opentui/solid`

## License

MIT
