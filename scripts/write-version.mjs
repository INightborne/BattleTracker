import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Vercel may build from source without a .git directory.
const git = spawnSync('git', ['describe', '--tags', '--always'], { encoding: 'utf8' });
const version = (git.status === 0 && git.stdout.trim()) ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  'local';
writeFileSync('src/assets/version.txt', version + '\n');
