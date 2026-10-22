// Serves demo/ and rebuilds its bundle on each request; the bundle stays beside it, out of dist/ and git.
import * as esbuild from 'esbuild';

const port = Number(process.env.PORT ?? 8123);

const ctx = await esbuild.context({
  entryPoints: { demo: 'demo/demo.ts' },
  outdir: 'demo',
  bundle: true,
  format: 'esm',
  target: 'chrome120',
  logLevel: 'info',
});
const { port: served } = await ctx.serve({ servedir: 'demo', host: '127.0.0.1', port });
console.log(`DM Slide demo: http://127.0.0.1:${served}/`);
