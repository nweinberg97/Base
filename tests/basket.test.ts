import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBasket, BUILDER_RULES, peakSeasonBonus, quantityFor, roundQuantity, slotsFor, type Candidate } from '../src/research/basket-builder.ts';
import type { DataSnapshot } from '../src/data/types.ts';
import { buildTestDatabase } from './helpers/pipeline.ts';

const { snapshot } = buildTestDatabase();

/** Builder candidates for a month, from the exported research data. */
function candidatesFor(s: DataSnapshot, month: number): Candidate[] {
  return s.ingredients.filter((i) => !i.isPantryBasic).map((i) => {
    const sc = i.scores[month - 1];
    return {
      id: i.id, slug: i.slug, name: i.name, category: i.category, family: i.family, shelfLifeDays: i.shelfLifeDays,
      servingG: i.servingSizeG, pricePerKg: i.price.pricePerKg, baseScore: sc.baseScore, availability: sc.availability,
      peakBonus: peakSeasonBonus(i.seasonality.availability, month), classification: sc.classification,
    };
  });
}

const totalSlots = slotsFor('omnivore').reduce((s, x) => s + x.count, 0);

for (const month of [1, 5, 8, 10]) {
  test(`month ${month}: the Base satisfies every construction rule`, () => {
    const r = buildBasket(candidatesFor(snapshot, month));
    const picks = r.picks;
    assert.equal(picks.length, totalSlots, 'every slot is filled');
    assert.equal(new Set(picks.map((p) => p.candidate.slug)).size, picks.length, 'no ingredient twice');
    for (const p of picks) {
      assert.notEqual(p.candidate.classification, 'expression', `${p.candidate.slug} is Expression`);
      assert.ok(p.candidate.availability >= BUILDER_RULES.minAvailability, `${p.candidate.slug} is out of season`);
      assert.ok(p.quantityG > 0 && p.estimatedServings > 0);
    }
    const vegs = picks.filter((p) => p.slot === 'vegetable');
    assert.equal(new Set(vegs.map((p) => p.candidate.family)).size, vegs.length, 'vegetables come from distinct families');
    assert.ok(vegs.some((p) => p.candidate.shelfLifeDays >= BUILDER_RULES.longKeepingDays), 'one vegetable keeps all week');
    assert.ok(r.ingredientCost <= BUILDER_RULES.budget || r.overBudget, 'over-budget baskets are flagged');
    assert.equal(r.overBudget, r.ingredientCost > BUILDER_RULES.budget);
  });
}

test('basket construction is deterministic, regardless of input order', () => {
  const c = candidatesFor(snapshot, 10);
  const a = buildBasket(c).picks.map((p) => [p.slot, p.candidate.slug, p.quantityG]);
  const b = buildBasket([...c].reverse()).picks.map((p) => [p.slot, p.candidate.slug, p.quantityG]);
  assert.deepEqual(a, b);
});

test('seasonal selection: summer and winter Bases differ in their produce', () => {
  const produce = (m: number) => new Set(buildBasket(candidatesFor(snapshot, m)).picks
    .filter((p) => ['vegetable', 'green', 'fresh-flavor'].includes(p.slot)).map((p) => p.candidate.slug));
  const summer = produce(8);
  const winter = produce(1);
  const shared = [...summer].filter((s) => winter.has(s));
  assert.ok(shared.length < summer.size / 2, `summer and winter share too much produce: ${shared.join(', ')}`);
});

test('rotation: repeating last week costs a rotating pick its place when a close alternative exists', () => {
  const c = candidatesFor(snapshot, 10);
  const first = buildBasket(c).picks;
  const next = buildBasket(c, { previous: first.map((p) => p.candidate.slug) }).picks;
  const rotating = (ps: typeof first) => ps.filter((p) => slotsFor('omnivore').find((s) => s.slot === p.slot)!.rotate).map((p) => p.candidate.slug);
  assert.notDeepEqual(rotating(next).sort(), rotating(first).sort());
  // non-rotating slots (protein, grain, aromatics) are allowed to stay
});

test('plant-forward Bases contain no meat', () => {
  const r = buildBasket(candidatesFor(snapshot, 10), { diet: 'plant_forward' });
  for (const p of r.picks) {
    assert.ok(!(p.candidate.category === 'protein' && !['eggs', 'soy'].includes(p.candidate.family)), `${p.candidate.slug} is meat`);
  }
});

test('peak-season bonus only applies at peak, and scales with seasonality', () => {
  const flat = Array(12).fill(1);
  const corn = [0, 0, 0, 0, 0, 0, 0.6, 1, 1, 0.4, 0, 0];
  assert.equal(peakSeasonBonus(flat, 8), 0, 'year-round items get nothing');
  assert.equal(peakSeasonBonus(corn, 8), BUILDER_RULES.peakBonusScale);
  assert.equal(peakSeasonBonus(corn, 10), 0);
});

test('quantities round to sensible pack sizes', () => {
  assert.equal(roundQuantity(1137), 1150);
  assert.equal(roundQuantity(183), 180);
  assert.equal(roundQuantity(3), 10);
  const q = quantityFor({ servingG: 120 } as Candidate, 6);
  assert.equal(q.quantityG, 700);
  assert.equal(q.estimatedServings, 5.8);
});

test('the stored current Base matches what the builder produces from the same data', () => {
  const current = snapshot.baskets.find((b) => b.status === 'current' && b.type === 'weekly');
  assert.ok(current, 'there is a current weekly Base');
  assert.equal(current.items.length, totalSlots);
  assert.equal(current.referenceMonth, 10);
  assert.equal(current.weekOf, '2026-10-05');
  const archived = snapshot.baskets.find((b) => b.status === 'archived' && b.type === 'weekly');
  assert.ok(archived, 'last week is kept');
  const expected = buildBasket(candidatesFor(snapshot, 10), {
    previous: archived.items.map((i) => snapshot.ingredients.find((x) => x.id === i.ingredientId)!.slug),
  }).picks.map((p) => p.candidate.id).sort();
  assert.deepEqual(current.items.map((i) => i.ingredientId).sort(), expected);
});
