// Loads the named SQL queries in db/queries/*.sql.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT } from './connection.ts';

export function loadNamedQueries(file = 'db/queries/rankings.sql'): Map<string, { sql: string; question: string }> {
  const text = readFileSync(resolve(ROOT, file), 'utf8');
  const out = new Map<string, { sql: string; question: string }>();
  for (const block of text.split(/^-- name: /m).slice(1)) {
    const [nameLine, ...rest] = block.split('\n');
    const question = (rest.find((l) => /^-- \d+\./.test(l)) ?? '').replace(/^-- /, '');
    const sql = rest.filter((l) => !l.startsWith('--')).join('\n').trim().replace(/;$/, '');
    out.set(nameLine.trim(), { sql, question });
  }
  return out;
}
