import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  affordabilityScores, availabilityScore, BASE_SCORE_WEIGHTS, baseScore, classify, confidence, costPerServing, isRich,
  nutritionScore, priceStabilityScore, scoreAll, versatilityScore, type ScoringInput,
} from '../src/research/scoring.ts';

test('score weights sum to 1', () => {
  const sum = Object.values(BASE_SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
});

test('cost per serving uses the serving size', () => {
  assert.equal(costPerServing(10, 150), 1.5);
  assert.throws(() => costPerServing(0, 100));
});

test('affordability is a log scale within each comparison group', () => {
  const m = affordabilityScores([
    { slug: 'a', group: 'g', cost: 0.25 },
    { slug: 'b', group: 'g', cost: 0.5 },
    { slug: 'c', group: 'g', cost: 1 },
    { slug: 'solo', group: 'other', cost: 9 },
  ]);
  assert.equal(m.get('a'), 100);
  assert.equal(m.get('b'), 50); // halfway on a log scale
  assert.equal(m.get('c'), 0);
  assert.equal(m.get('solo'), 100, 'a group of one is not penalised');
});

test('versatility rewards breadth and coverage of meals, dishes and techniques', () => {
  const uses = (meal: number, dish: number, technique: number) => [
    ...Array.from({ length: meal }, (_, i) => ({ slug: `m${i}`, group: 'meal' as const })),
    ...Array.from({ length: dish }, (_, i) => ({ slug: `d${i}`, group: 'dish' as const })),
    ...Array.from({ length: technique }, (_, i) => ({ slug: `t${i}`, group: 'technique' as const })),
  ];
  assert.equal(versatilityScore(uses(3, 6, 4), 13), 100);
  assert.equal(versatilityScore([], 13), 0);
  assert.ok(versatilityScore(uses(0, 6, 0), 13) < versatilityScore(uses(2, 2, 2), 13), 'spread beats repetition');
});

test('nutrition: protein and fibre per 100 kcal, with a sodium penalty', () => {
  const base = { kcal: 100, protein: 10, fat: 1, fiber: 5, sodium: 0, status: 'estimated' as const };
  assert.equal(nutritionScore(base), 100);
  assert.equal(nutritionScore({ ...base, sodium: 600 }), 75);
  assert.equal(nutritionScore({ ...base, protein: 0, fiber: 0 }), 0);
  assert.equal(nutritionScore({ ...base, kcal: 0 }), 0);
});

test('availability and price stability', () => {
  const a = [0, 0, 0, 0, 0, 0, 1, 1, 1, 0.5, 0, 0];
  assert.equal(availabilityScore(a, 8), 100);
  assert.equal(availabilityScore(a, 10), 50);
  assert.throws(() => availabilityScore([1, 1], 1));
  assert.equal(priceStabilityScore([5, 5, 5, 5, 5, 5]), 100);
  assert.equal(priceStabilityScore([5, 5, 5]), null, 'too little history is not scored');
  assert.ok(priceStabilityScore([4, 6, 4, 6, 4, 6])! < 70);
});

test('base score renormalises when price stability is missing', () => {
  const all = baseScore({ affordability: 80, versatility: 80, nutrition: 80, availability: 80, priceStability: 80 });
  const missing = baseScore({ affordability: 80, versatility: 80, nutrition: 80, availability: 80, priceStability: null });
  assert.equal(all, 80);
  assert.equal(missing, 80);
});

test('classification: rich or premium foods are Expression', () => {
  assert.equal(classify({ affordability: 10, versatility: 90, baseScore: 90 }, false), 'expression');
  assert.equal(classify({ affordability: 80, versatility: 90, baseScore: 90 }, true), 'expression');
  assert.equal(classify({ affordability: 80, versatility: 60, baseScore: 70 }, false), 'foundation');
  assert.equal(classify({ affordability: 80, versatility: 30, baseScore: 70 }, false), 'supporting');
  assert.equal(classify({ affordability: 80, versatility: 60, baseScore: 50 }, false), 'supporting');
  assert.equal(isRich({ kcal: 400, protein: 25, fat: 33, fiber: 0, sodium: 620, status: 'estimated' }), true);  // aged cheddar
  assert.equal(isRich({ kcal: 32, protein: 1.6, fat: 0.3, fiber: 1.9, sodium: 186, status: 'estimated' }), false); // canned tomatoes
});

test('confidence reflects how much data is verified', () => {
  assert.equal(confidence(['verified', 'verified', 'verified']), 'high');
  assert.equal(confidence(['estimated', 'estimated', 'estimated']), 'medium');
  assert.equal(confidence(['demo', 'demo', 'estimated']), 'low');
});

test('scoreAll is deterministic and sorted by base score then slug', () => {
  const mk = (slug: string, price: number): ScoringInput => ({
    id: slug.length, slug, name: slug, category: 'legume', servingG: 100, pricePerKg: price, priceStatus: 'estimated',
    nutrition: { kcal: 120, protein: 8, fat: 1, fiber: 6, sodium: 5, status: 'estimated' },
    uses: [{ slug: 'soup', group: 'dish' }], usesStatus: 'estimated',
    availability: Array(12).fill(1), seasonalityStatus: 'estimated',
    history: [3, 3, 3, 3, 3, 3], historyStatus: 'demo',
  });
  const inputs = [mk('beans', 3), mk('lentils', 3), mk('caviar', 300)];
  const a = scoreAll(inputs, 10);
  const b = scoreAll([...inputs].reverse(), 10);
  assert.deepEqual(a, b);
  assert.deepEqual(a.map((r) => r.slug), ['beans', 'lentils', 'caviar']);
  assert.equal(a[2].classification, 'expression');
});
