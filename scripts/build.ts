// npm run build — data pipeline (run by the npm script first), then bundle + prerender.
import { buildSite } from './build-lib.ts';

const t0 = Date.now();
const { pages, outDir } = await buildSite();
console.log(`Built ${pages} pages into ${outDir} in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
