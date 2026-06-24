import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!existsSync('.git')) {
  process.exit(0);
}

spawnSync('npx', ['husky'], { stdio: 'inherit' });
