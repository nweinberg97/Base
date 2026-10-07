// npm run db:migrate            apply pending migrations
// npm run db:migrate -- --fresh delete the database file first
import { existsSync, rmSync } from 'node:fs';
import { dbPath, openDb } from '../src/data/sqlite/connection.ts';
import { migrate } from '../src/data/sqlite/migrate.ts';

const path = dbPath();
if (process.argv.includes('--fresh')) {
  for (const f of [path, `${path}-wal`, `${path}-shm`]) if (existsSync(f)) rmSync(f);
}
const db = openDb(path);
const ran = migrate(db);
console.log(ran.length ? `Applied ${ran.length} migration(s): ${ran.join(', ')}` : 'Database is up to date.');
db.close();
