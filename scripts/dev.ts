// npm run dev — build once (running the data pipeline if there is no snapshot yet),
// serve it, and rebuild whenever src/ changes. Refresh the browser after a rebuild.
import { existsSync, watch } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { buildSite } from './build-lib.ts';
import { serve } from './serve.ts';
import { ROOT } from '../src/data/sqlite/connection.ts';

if (!existsSync(resolve(ROOT, 'src/data/generated/snapshot.json'))) execSync('npm run data', { stdio: 'inherit', cwd: ROOT });
const outDir = resolve(ROOT, '.build/dev');
const port = Number(process.env.PORT) || 5173;
await buildSite({ outDir, minify: false, siteUrl: `http://localhost:${port}` });
serve(outDir, port);

let timer: NodeJS.Timeout | undefined;
watch(resolve(ROOT, 'src'), { recursive: true }, (_e, file) => {
  if (file?.includes('generated')) return;
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try { await buildSite({ outDir, minify: false, siteUrl: `http://localhost:${port}` }); console.log(`Rebuilt after change to ${file}.`); }
    catch (err) { console.error((err as Error).message); }
  }, 150);
});
