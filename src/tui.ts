import type { TuiPluginModule } from '@opencode-ai/plugin/tui';

import { TokenSpendBarPlugin } from './plugin';

const plugin: TuiPluginModule = {
  id: 'grandmaster451.token-spend-bar',
  tui: TokenSpendBarPlugin,
};

export default plugin;
