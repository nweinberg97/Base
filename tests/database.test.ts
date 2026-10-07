import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/data/sqlite/connection.ts';
import { migrate } from '../src/data/sqlite/migrate.ts';
import { loadNamedQueries } from '../src/data/sqlite/queries.ts';
import { loadValidationData } from '../src/data/sqlite/validation-data.ts';
import { validate } from '../src/research/validation.ts';
import { getRankingAnswers, setSnapshot } from '../src/data/api.ts';
import { buildTestDatabase, openTestDb, TEST_MONTH } from './helpers/pipeline.ts';

const { snapshot } = buildTestDatabase();
setSnapshot(snapshot);

test('migrations apply cleanly to an empty database and are idempotent', () => {
  const db = openDb(':memory:');
  const first = migrate(db);
  assert.ok(first.length >= 3);
  assert.deepEqual(migrate(db), [], 'a second run applies nothing');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => (r as { name: string }).name);
  for (const t of ['ingredients', 'nutrition', 'prices', 'price_history', 'seasonality', 'use_cases', 'baskets', 'basket_items',
    'add_ons', 'recipes', 'recipe_ingredients', 'containers', 'pickup_locations', 'pickup_windows', 'derived_scores', 'sources', 'suppliers']) {
    assert.ok(tables.includes(t), `missing table ${t}`);
  }
  db.close();
});

test('the schema rejects bad data', () => {
  const db = openTestDb();
  db.exec('BEGIN');
  try {
    const ing = (db.prepare('SELECT id FROM ingredients LIMIT 1').get() as { id: number }).id;
    const src = (db.prepare('SELECT id FROM sources LIMIT 1').get() as { id: number }).id;
    const insertPrice = (price: number, unit: string, status: string, currency = 'CAD') => db.prepare(
      `INSERT INTO prices (ingredient_id, source_id, region, price, unit, currency, price_date, verification_status)
       VALUES (?, ?, 'TEST', ?, ?, ?, '2026-10-05', ?)`).run(ing, src, price, unit, currency, status);
    assert.throws(() => insertPrice(-1, 'kg', 'estimated'), /CHECK/, 'negative price');
    assert.throws(() => insertPrice(3, 'handful', 'estimated'), /CHECK/, 'unknown unit');
    assert.throws(() => insertPrice(3, 'kg', 'probably'), /CHECK/, 'unknown verification status');
    assert.throws(() => insertPrice(3, 'kg', 'estimated', 'USD'), /CHECK/, 'non-CAD currency');
    assert.throws(() => db.exec(`INSERT INTO sources (slug, name, source_url, source_type, region, retrieved_at)
      VALUES ('blank', 'Blank', '  ', 'editorial', 'BC', '2026-10-05')`), /CHECK/, 'blank source URL');
    assert.throws(() => db.prepare(`INSERT INTO prices (ingredient_id, source_id, region, price, unit, price_date, verification_status)
      VALUES (?, 99999, 'TEST2', 3, 'kg', '2026-10-05', 'estimated')`).run(ing), /FOREIGN KEY/, 'unknown source');
  } finally {
    db.exec('ROLLBACK');
    db.close();
  }
});

test('the seeded research data passes validation with no errors', () => {
  const db = openTestDb();
  const issues = validate(loadValidationData(db));
  db.close();
  assert.deepEqual(issues.filter((i) => i.level === 'error'), []);
});

test('provenance cannot silently disappear: removing a source or status is caught', () => {
  const db = openTestDb();
  const data = loadValidationData(db);
  db.close();
  const broken = structuredClone(data);
  broken.prices[0].source_id = null;
  broken.nutrition[0].verification_status = null;
  broken.seasonality = broken.seasonality.filter((s) => s.ingredient_id !== broken.ingredients.find((i) => !i.is_pantry_basic)!.id);
  const checks = new Set(validate(broken).filter((i) => i.level === 'error').map((i) => i.check));
  assert.ok(checks.has('provenance'), 'missing price source is an error');
  assert.ok(checks.has('verification-status'), 'missing status is an error');
  assert.ok(checks.size >= 3, `expected a seasonality error too, got ${[...checks].join(', ')}`);
});

test('every external datum in the snapshot carries a source and a verification state', () => {
  const sourceIds = new Set(snapshot.sources.map((s) => s.id));
  for (const i of snapshot.ingredients) {
    for (const d of [i.nutrition, i.price, i.seasonality]) {
      assert.ok(sourceIds.has(d.sourceId), `${i.slug}: unknown source`);
      assert.ok(['verified', 'estimated', 'demo', 'derived'].includes(d.status), `${i.slug}: bad status`);
    }
    assert.ok(i.provenance.length >= 3, `${i.slug}: provenance list is incomplete`);
  }
  for (const s of snapshot.suppliers) assert.equal(s.status, 'demo', `supplier ${s.name} must be labelled demo`);
  for (const r of snapshot.recipes) assert.equal(r.creatorIsDemo, true, `recipe ${r.slug} must credit a demo creator`);
});

test('nothing in the seed claims to be verified without a primary source', () => {
  for (const i of snapshot.ingredients) {
    for (const d of [i.price, i.seasonality]) assert.notEqual(d.status, 'verified', `${i.slug} claims verified price/seasonality`);
  }
});

test('SQL ranking queries and the storefront rankings agree', () => {
  const db = openTestDb();
  const answers = new Map(getRankingAnswers(TEST_MONTH).map((a) => [a.key, a.rows.map((r) => r.ingredient.name)]));
  const queries = loadNamedQueries();
  assert.equal(queries.size, 9);
  for (const [name, q] of queries) {
    const sqlNames = (db.prepare(q.sql).all('BC', TEST_MONTH) as { name: string }[]).map((r) => r.name);
    assert.ok(sqlNames.length > 0, `${name} returned nothing`);
    assert.deepEqual(answers.get(name), sqlNames, `${name} differs`);
  }
  db.close();
});

test('ranking queries are deterministic', () => {
  const db = openTestDb();
  for (const [, q] of loadNamedQueries()) {
    const a = JSON.stringify(db.prepare(q.sql).all('BC', TEST_MONTH));
    const b = JSON.stringify(db.prepare(q.sql).all('BC', TEST_MONTH));
    assert.equal(a, b);
  }
  db.close();
});
