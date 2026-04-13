import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const evidenceDir = join(root, '.sisyphus', 'evidence');
const outputPath = join(evidenceDir, 'qa-snapshots.txt');

mkdirSync(evidenceDir, { recursive: true });

const result = spawnSync('npm', ['run', 'qa:fixtures', '--', '--update'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});

const output = [result.stdout ?? '', result.stderr ?? ''].filter(Boolean).join('\n');
writeFileSync(outputPath, output, 'utf8');

if (output) {
  process.stdout.write(output);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
