import { spawnSync } from 'node:child_process';

const commands = [
  ['npm', ['test']],
  ['npm', ['run', 'build']],
  ['npm', ['pack', '--dry-run']],
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
