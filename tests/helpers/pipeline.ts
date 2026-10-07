// Builds a fresh, isolated research database for tests: migrate → seed → rank → baskets,
// exactly as `npm run data` does, but in a temp directory with a fixed week so results
// never depend on the date the tests run.
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { openDb, ROOT, type Db } from '../../src/data/sqlite/connection.ts';
import { exportSnapshot } from '../../src/data/sqlite/export.ts';
import type { DataSnapshot } from '../../src/data/types.ts';

export const TEST_WEEK = '2026-10-05';
export const TEST_MONTH = 10;

let cached: { dbPath: string; snapshot: DataSnapshot } | undefined;

export function runScript(script: string, env: Record<string, string>, args: string[] = []): string {
  return execFileSync(process.execPath, ['--disable-warning=ExperimentalWarning', resolve(ROOT, 'scripts', script), ...args], {
    cwd: ROOT,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

export function buildTestDatabase(): { dbPath: string; snapshot: DataSnapshot } {
  if (cached) return cached;
  const dbPath = join(mkdtempSync(join(tmpdir(), 'base-test-')), 'base.sqlite');
  const env = { BASE_DB_PATH: dbPath, BASE_WEEK_OF: TEST_WEEK, BASE_REFERENCE_MONTH: String(TEST_MONTH) };
  runScript('db-migrate.ts', env, ['--fresh']);
  runScript('db-seed.ts', env);
  runScript('research-rank.ts', env);
  runScript('research-baskets.ts', env);
  const db = openDb(dbPath);
  const snapshot = exportSnapshot(db, { weekOf: TEST_WEEK, referenceMonth: TEST_MONTH });
  db.close();
  cached = { dbPath, snapshot };
  return cached;
}

export function openTestDb(): Db {
  return openDb(buildTestDatabase().dbPath);
}
