import * as esbuild from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';

const watch = process.argv.includes('--watch');

/** @type {esbuild.BuildOptions} */
const options = {
  entryPoints: { content: 'src/content/main.ts', page: 'src/instagram/page.ts' },
  outdir: 'dist',
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  logLevel: 'info',
};

await mkdir('dist', { recursive: true });
await copyFile('manifest.json', 'dist/manifest.json');

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
