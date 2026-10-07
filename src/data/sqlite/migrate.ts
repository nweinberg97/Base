// Minimal migration runner: applies db/migrations/NNN_name.sql files in order and
// records each one in schema_migrations, so running it twice is a no-op.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { type Db, ROOT, transaction } from './connection.ts';

export const MIGRATIONS_DIR = resolve(ROOT, 'db/migrations');

export function migrate(db: Db, dir: string = MIGRATIONS_DIR): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`);
  const applied = new Set(
    (db.prepare('SELECT name FROM schema_migrations').all() as { name: string }[]).map((r) => r.name),
  );
  const files = readdirSync(dir).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
  const ran: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(resolve(dir, file), 'utf8');
    transaction(db, () => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
    });
    ran.push(file);
  }
  return ran;
}
