// npm run data:export — write the storefront's data snapshot from SQLite.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openDb, ROOT } from '../src/data/sqlite/connection.ts';
import { exportSnapshot } from '../src/data/sqlite/export.ts';
import { currentWeekOf, referenceMonth } from '../src/research/calendar.ts';

const db = openDb();
const snapshot = exportSnapshot(db, { weekOf: currentWeekOf(), referenceMonth: referenceMonth() });
db.close();
const dir = resolve(ROOT, 'src/data/generated');
mkdirSync(dir, { recursive: true });
const json = JSON.stringify(snapshot);
writeFileSync(resolve(dir, 'snapshot.json'), json);
console.log(`Exported snapshot: ${snapshot.ingredients.length} ingredients, ${snapshot.baskets.length} baskets, ${snapshot.recipes.length} recipes (${(json.length / 1024).toFixed(0)} KB).`);
