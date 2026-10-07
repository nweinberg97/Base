import { test } from 'node:test';
import assert from 'node:assert/strict';
import { basketCost, COST_RULES, estimatePlates, ingredientCost, orderSummary } from '../src/research/cost.ts';

test('ingredient cost is price per kg × grams, rounded to cents', () => {
  assert.equal(ingredientCost([{ pricePerKg: 4.4, quantityG: 500, prepared: true }]), 2.2);
  assert.equal(ingredientCost([
    { pricePerKg: 13.2, quantityG: 1100, prepared: true },
    { pricePerKg: 2.2, quantityG: 350, prepared: false },
  ]), 15.29); // 14.52 + 0.77
});

test('ingredient cost rejects non-positive prices and quantities', () => {
  assert.throws(() => ingredientCost([{ pricePerKg: 0, quantityG: 100, prepared: true }]), /positive/);
  assert.throws(() => ingredientCost([{ pricePerKg: 3, quantityG: -1, prepared: true }]), /positive/);
});

test('basket cost adds prep per prepared item, washing per container and the margin', () => {
  const lines = [
    { pricePerKg: 10, quantityG: 1000, prepared: true },   // $10.00
    { pricePerKg: 4, quantityG: 500, prepared: true },     //  $2.00
    { pricePerKg: 8, quantityG: 250, prepared: false },    //  $2.00
  ];
  const c = basketCost(lines, 3);
  assert.equal(c.ingredientCost, 14);
  assert.equal(c.prepHandling, 2 * COST_RULES.prepPerItem + 3 * COST_RULES.washPerContainer); // 1.50 + 1.20
  assert.equal(c.estimatedCost, 16.7);
  assert.equal(c.margin, Math.round(16.7 * COST_RULES.operatingMargin * 100) / 100);
  assert.equal(c.foodPrice, Math.ceil(c.estimatedCost + c.margin));
  assert.ok(Number.isInteger(c.foodPrice), 'food price is a whole dollar');
});

test('the deposit is never part of the food price', () => {
  const s = orderSummary(71, [], { deposit: 38, purchase: 116 }, 'borrow');
  assert.equal(s.foodPrice, 71);
  assert.equal(s.depositRefundable, 38);
  assert.equal(s.containerPurchase, 0);
  assert.equal(s.totalToday, 109);
});

test('order summary: owning replaces the deposit with a purchase; returning pays neither', () => {
  const own = orderSummary(71, [6.5, 8], { deposit: 38, purchase: 116 }, 'own');
  assert.deepEqual(own, { foodPrice: 71, addOns: 14.5, depositRefundable: 0, containerPurchase: 116, totalToday: 201.5 });
  const back = orderSummary(71, [6.5], { deposit: 38, purchase: 116 }, 'returning');
  assert.equal(back.depositRefundable, 0);
  assert.equal(back.containerPurchase, 0);
  assert.equal(back.totalToday, 77.5);
});

test('order summary rejects invalid add-on prices and negative container amounts', () => {
  assert.throws(() => orderSummary(71, [0], { deposit: 38, purchase: 116 }, 'borrow'));
  assert.throws(() => orderSummary(71, [], { deposit: -1, purchase: 116 }, 'borrow'));
});

test('plates count servings of protein-providing slots only', () => {
  assert.equal(estimatePlates([
    { slot: 'protein', estimatedServings: 7.3 },
    { slot: 'everyday-protein', estimatedServings: 6 },
    { slot: 'legume', estimatedServings: 7 },
    { slot: 'grain', estimatedServings: 10 },
    { slot: 'vegetable', estimatedServings: 4 },
  ]), 20);
});
