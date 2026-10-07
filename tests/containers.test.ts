import { test } from 'node:test';
import assert from 'node:assert/strict';
import { containerBalance, COOKED_LEGUME_FACTOR, depositFor, planContainers, plannedWeight, purchaseCostFor, type ContainerSpec } from '../src/research/containers.ts';

const SPECS: ContainerSpec[] = [
  { slug: 'glass-500', name: 'Small', capacityG: 450, deposit: 3, purchasePrice: 9, kind: 'glass' },
  { slug: 'glass-1000', name: 'Medium', capacityG: 900, deposit: 4, purchasePrice: 12, kind: 'glass' },
  { slug: 'glass-2000', name: 'Large', capacityG: 1800, deposit: 5, purchasePrice: 16, kind: 'glass' },
  { slug: 'glass-jar-750', name: 'Jar', capacityG: 900, deposit: 2, purchasePrice: 6, kind: 'jar' },
];
const need = (quantityG: number, extra: Partial<{ category: string; prepForm: string; needsContainer: boolean }> = {}) =>
  ({ slug: 'x', quantityG, needsContainer: true, category: 'vegetable', prepForm: 'washed', ...extra });

test('each ingredient goes into the smallest container that fits', () => {
  const c = planContainers([need(300), need(800), need(1500)], SPECS);
  assert.deepEqual(Object.fromEntries(c), { 'glass-500': 1, 'glass-1000': 1, 'glass-2000': 1 });
});

test('cooked legumes are planned at their cooked weight', () => {
  assert.equal(plannedWeight(need(350, { category: 'legume', prepForm: 'cooked from dry' })), 350 * COOKED_LEGUME_FACTOR);
  const c = planContainers([need(350, { category: 'legume', prepForm: 'cooked from dry' })], SPECS);
  assert.deepEqual(Object.fromEntries(c), { 'glass-1000': 1 });
});

test('dairy goes in jars; items that need no container are skipped; oversize items split', () => {
  const c = planContainers([
    need(500, { category: 'dairy' }),
    need(600, { needsContainer: false }),
    need(4000),
  ], SPECS);
  assert.deepEqual(Object.fromEntries(c), { 'glass-jar-750': 1, 'glass-2000': 3 });
});

test('deposit and purchase cost', () => {
  const c = new Map([['glass-500', 2], ['glass-2000', 1]]);
  assert.equal(depositFor(c, SPECS), 11);
  assert.equal(purchaseCostFor(c, SPECS), 34);
  assert.throws(() => depositFor(new Map([['mystery', 1]]), SPECS), /Unknown container/);
});

test('container balance: active containers and the deposit held', () => {
  const b = containerBalance([
    { containerSlug: 'glass-500', borrowed: 6, returned: 2, owned: 0 },
    { containerSlug: 'glass-1000', borrowed: 3, returned: 3, owned: 1 },
  ], SPECS);
  assert.equal(b.active, 4);
  assert.equal(b.owned, 1);
  assert.equal(b.depositHeld, 4 * 3);
  assert.throws(() => containerBalance([{ containerSlug: 'glass-500', borrowed: 1, returned: 2, owned: 0 }], SPECS), /Returned more/);
});
