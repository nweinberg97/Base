// npm run research:report — run every ranking query in db/queries/rankings.sql.
import { openDb } from '../src/data/sqlite/connection.ts';
import { loadNamedQueries } from '../src/data/sqlite/queries.ts';
import { referenceMonth } from '../src/research/calendar.ts';

const db = openDb();
const month = referenceMonth();
for (const [name, q] of loadNamedQueries()) {
  const rows = db.prepare(q.sql).all('BC', month) as Record<string, unknown>[];
  console.log(`\n${q.question || name}  [${name}, month ${month}]`);
  console.table(rows);
}
db.close();
