// Shared build: bundle, prerender every route to static HTML, copy public assets.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { ROOT } from '../src/data/sqlite/connection.ts';
import { normaliseBasePath } from '../src/lib/base-path.ts';

const require = createRequire(import.meta.url);

export interface BuildOptions { outDir?: string; minify?: boolean; siteUrl?: string; basePath?: string }



const hash = (s: string | Uint8Array) => createHash('sha256').update(s).digest('hex').slice(0, 10);

export async function buildSite(opts: BuildOptions = {}): Promise<{ pages: number; outDir: string }> {
  const outDir = resolve(ROOT, opts.outDir ?? 'dist');
  const minify = opts.minify ?? true;
  const basePath = normaliseBasePath(opts.basePath ?? process.env.BASE_PATH);
  const siteUrl = (opts.siteUrl ?? process.env.BASE_SITE_URL ?? `http://localhost:4173${basePath}`).replace(/\/$/, '');
  const at = (p: string) => `${basePath}${p}`;   // root-relative URL → served URL
  const snapshotPath = resolve(ROOT, 'src/data/generated/snapshot.json');
  if (!existsSync(snapshotPath)) throw new Error('No data snapshot. Run `npm run data` first.');

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(resolve(outDir, 'assets'), { recursive: true });
  mkdirSync(resolve(outDir, 'data'), { recursive: true });
  cpSync(resolve(ROOT, 'public'), outDir, { recursive: true });

  const define = { 'process.env.NODE_ENV': '"production"' };
  // client bundle + css
  const client = await build({
    entryPoints: { app: resolve(ROOT, 'src/entry-client.tsx'), styles: resolve(ROOT, 'src/styles/main.css') },
    bundle: true, minify, sourcemap: false, format: 'esm', target: ['es2020'], jsx: 'automatic',
    outdir: resolve(outDir, 'assets'), entryNames: '[name]-[hash]', write: true, metafile: true, define, logLevel: 'error',
    external: ['/fonts/*'],
  });
  const outputs = Object.keys(client.metafile!.outputs).map((p) => `/${p.slice(p.indexOf('assets/'))}`);
  const js = outputs.find((p) => /\/app-.*\.js$/.test(p))!;
  const css = outputs.find((p) => /\/styles-.*\.css$/.test(p))!;
  // Fonts are referenced as /fonts/…; make them relative to /assets/ so any base path works.
  const cssFile = resolve(outDir, css.slice(1));
  writeFileSync(cssFile, readFileSync(cssFile, 'utf8').replace(/url\((['"]?)\/fonts\//g, 'url($1../fonts/'));

  // server bundle (CommonJS, for require())
  const serverOut = resolve(ROOT, '.build/entry-server.cjs');
  await build({
    entryPoints: [resolve(ROOT, 'src/entry-server.tsx')], bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic',
    outfile: serverOut, define, logLevel: 'error', external: [],
  });
  delete require.cache[serverOut];
  const { prerender } = require(serverOut) as typeof import('../src/entry-server.tsx');

  // data snapshot, content-hashed
  const json = readFileSync(snapshotPath, 'utf8');
  const dataUrl = `/data/snapshot-${hash(json)}.json`;
  writeFileSync(resolve(outDir, dataUrl.slice(1)), json);

  const snapshot = JSON.parse(json);
  const site = prerender(snapshot, basePath);
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const page = (path: string, html: string, meta: { title: string; description: string }) => `<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<link rel="canonical" href="${siteUrl}${path === '/' ? '/' : path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Base">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${siteUrl}${path}">
<meta property="og:image" content="${siteUrl}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FFFFFF">
<link rel="icon" href="${at('/favicon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${at('/apple-touch-icon.png')}">
<link rel="preload" href="${at('/fonts/poppins-500.woff')}" as="font" type="font/woff" crossorigin>
<link rel="preload" href="${at('/fonts/inter-400.woff')}" as="font" type="font/woff" crossorigin>
<link rel="preload" href="${at(dataUrl)}" as="fetch" crossorigin>
<link rel="stylesheet" href="${at(css)}">
<script>window.__BASE_DATA_URL__=${JSON.stringify(at(dataUrl))};window.__BASE_PATH__=${JSON.stringify(basePath)}${path === '/404' ? ';window.__BASE_NOT_FOUND__=true' : ''}</script>
<script type="module" src="${at(js)}"></script>
</head>
<body>
<div id="root">${html}</div>
</body>
</html>
`;

  let pages = 0;
  for (const path of site.paths) {
    const { html, meta } = site.render(path);
    const file = resolve(outDir, path === '/' ? 'index.html' : `${path.slice(1)}/index.html`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, page(path, html, meta));
    pages++;
  }
  const nf = site.render('/__not-found__');
  writeFileSync(resolve(outDir, '404.html'), page('/404', nf.html, nf.meta));
  return { pages: pages + 1, outDir };
}
