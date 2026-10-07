// npm run preview — serve the production build in dist/.
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { serve } from './serve.ts';

const dir = resolve(import.meta.dirname, '../dist');
if (!existsSync(dir)) { console.error('No build found. Run `npm run build` first.'); process.exit(1); }
serve(dir, Number(process.env.PORT) || 4173);
