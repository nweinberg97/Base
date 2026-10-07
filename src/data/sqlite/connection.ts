// SQLite connection for scripts and tests. Uses Node's built-in driver (node:sqlite),
// so there is no native module to install. The storefront never talks to SQLite
// directly: it reads the exported snapshot through src/data/api.ts.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type Db = DatabaseSync;

export const ROOT = resolve(import.meta.dirname, '../../..');

export function dbPath(): string {
  return resolve(ROOT, process.env.BASE_DB_PATH || 'db/base.sqlite');
}

export function openDb(path: string = dbPath()): Db {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

/** Run fn inside a transaction; roll back and rethrow on any error. */
export function transaction<T>(db: Db, fn: () => T): T {
  db.exec('BEGIN');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function all<T>(db: Db, sql: string, ...params: (string | number | null)[]): T[] {
  return db.prepare(sql).all(...params) as T[];
}

export function get<T>(db: Db, sql: string, ...params: (string | number | null)[]): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}
