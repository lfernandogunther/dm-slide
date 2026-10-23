import * as esbuild from 'esbuild';
import { copyFile, cp, mkdir, writeFile } from 'node:fs/promises';

const watch = process.argv.includes('--watch');

// Instagram's private API and the markers of calling it: a bundle naming any of them is not written.
const FORBIDDEN = ['/api/', 'i.instagram.com', 'graphql', 'doc_id', 'fb_dtsg', 'x-ig-'];

/** @type {esbuild.Plugin} */
const noPrivateApi = {
  name: 'no-private-api',
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length) return;
      const found = result.outputFiles.flatMap((file) =>
        FORBIDDEN.filter((word) => file.text.toLowerCase().includes(word)).map((word) => ({ text: `${file.path} contains "${word}": the extension never calls Instagram's private API` })),
      );
      if (found.length) return { errors: found };
      await Promise.all(result.outputFiles.map((file) => writeFile(file.path, file.contents)));
    });
  },
};

/** @type {esbuild.BuildOptions} */
const options = {
  entryPoints: { content: 'src/content/main.ts', page: 'src/instagram/page.ts' },
  outdir: 'dist',
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  logLevel: 'info',
  // The guard writes the bundle once it passes.
  write: false,
  plugins: [noPrivateApi],
};

await mkdir('dist', { recursive: true });
await copyFile('manifest.json', 'dist/manifest.json');
await cp('icons', 'dist/icons', { recursive: true, filter: (src) => !src.endsWith('.svg') });

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
