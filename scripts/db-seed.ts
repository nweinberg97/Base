// npm run db:seed — load db/seeds into the database (expects a freshly migrated database).
import { openDb } from '../src/data/sqlite/connection.ts';
import { seed } from '../src/data/sqlite/seed.ts';

const db = openDb();
const counts = seed(db);
console.log('Seeded:', Object.entries(counts).map(([t, n]) => `${t} ${n}`).join(' · '));
db.close();
