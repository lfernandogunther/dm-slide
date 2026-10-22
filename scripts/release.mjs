// npm run release <version>: bumps the manifest and package, commits, tags v<version> and pushes.
// The tag's workflow does the rest: build, GitHub Release, Chrome Web Store.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

const version = process.argv[2];
const run = (cmd, ...args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
const fail = (why) => {
  console.error(`release: ${why}`);
  process.exit(1);
};

// The store accepts only dot-separated integers as an extension version.
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) fail(`expected a version like 0.1.0, got "${version ?? ''}"`);
if (run('git', 'status', '--porcelain')) fail('the working tree has changes; commit or stash them first');
if (run('git', 'branch', '--show-current') !== 'main') fail('releases are cut from main');
if (run('git', 'tag', '--list', `v${version}`)) fail(`tag v${version} already exists`);

const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
const [a, b] = [manifest.version, version].map((v) => v.split('.').map(Number));
const newer = a.findIndex((n, i) => n !== b[i]);
if (newer < 0 || b[newer] < a[newer]) fail(`${version} is not newer than the manifest's ${manifest.version}`);

manifest.version = version;
await writeFile('manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
run('npm', 'version', version, '--no-git-tag-version', '--allow-same-version');
run('npm', 'run', 'typecheck');

run('git', 'add', 'manifest.json', 'package.json', 'package-lock.json');
run('git', 'commit', '-m', `chore: release v${version}`);
run('git', 'tag', '-a', `v${version}`, '-m', `v${version}`);
console.log(`release: v${version} committed and tagged`);

try {
  execFileSync('git', ['push', '--atomic', 'origin', 'main', `v${version}`], { stdio: 'inherit' });
  console.log('release: pushed; the workflow takes it from here');
} catch {
  fail(`the push failed; the commit and tag are local. Retry with: git push --atomic origin main v${version}`);
}
