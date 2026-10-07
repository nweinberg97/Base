import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { ROOT } from '../src/data/sqlite/connection.ts';
import {
  getAddOns, getBasketBySlug, getContainerInformation, getCurrentBase, getIngredientBySlug, getOrderSummary, getPickupInformation,
  getRecipes, NotFoundError, recipeFitsBasket, setSnapshot,
} from '../src/data/api.ts';
import { basketCost } from '../src/research/cost.ts';
import { buildTestDatabase } from './helpers/pipeline.ts';

const { snapshot } = buildTestDatabase();
setSnapshot(snapshot);

test('the current Base view is internally consistent', () => {
  const v = getCurrentBase();
  assert.equal(v.lines.length, v.basket.items.length);
  const recomputed = basketCost(v.lines.map((l) => ({
    pricePerKg: l.ingredient.price.pricePerKg, quantityG: l.item.quantityG, prepared: l.ingredient.prepForm !== 'whole',
  })), v.containerCount);
  assert.equal(v.cost.ingredientCost, recomputed.ingredientCost);
  assert.equal(v.cost.foodPrice, recomputed.foodPrice);
  assert.equal(v.containerCount, v.containers.reduce((s, c) => s + c.quantity, 0));
  assert.equal(v.deposit, v.containers.reduce((s, c) => s + c.container.deposit * c.quantity, 0));
  assert.ok(v.plates > 0);
  for (const r of v.recipes) assert.equal(recipeFitsBasket(r.recipe, v.basket), r.baseIngredientsUsed);
});

test('order summary keeps food, add-ons and the deposit apart', () => {
  const v = getCurrentBase();
  const addOn = getAddOns()[0];
  const borrow = getOrderSummary(v, [addOn.id], 'borrow');
  assert.equal(borrow.foodPrice, v.cost.foodPrice);
  assert.equal(borrow.addOns, addOn.price);
  assert.equal(borrow.depositRefundable, v.deposit);
  assert.equal(borrow.totalToday, Math.round((v.cost.foodPrice + addOn.price + v.deposit) * 100) / 100);
  assert.equal(getOrderSummary(v, [], 'own').containerPurchase, v.containerPurchase);
});

test('lookups throw NotFoundError for unknown slugs', () => {
  assert.throws(() => getBasketBySlug('nope'), NotFoundError);
  assert.throws(() => getIngredientBySlug('nope'), NotFoundError);
});

test('pickup and container information', () => {
  const p = getPickupInformation();
  assert.ok(p.locations.length >= 1);
  assert.ok(p.locations.every((l) => /demo/i.test(l.name)), 'pickup locations are labelled demo');
  const c = getContainerInformation();
  assert.ok(c.containers.length >= 3);
  assert.ok(c.containers.every((x) => x.deposit > 0 && x.purchasePrice > x.deposit));
});

test('every recipe credits a demo creator and has steps', () => {
  for (const r of getRecipes()) {
    assert.equal(r.creatorIsDemo, true);
    assert.ok(r.steps.length > 0, r.slug);
  }
});

// ------------------------------------------------------------------ rendering
async function loadPrerender() {
  const out = join(mkdtempSync(join(tmpdir(), 'base-ssr-')), 'entry-server.cjs');
  await build({
    entryPoints: [resolve(ROOT, 'src/entry-server.tsx')], bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic',
    outfile: out, logLevel: 'error', define: { 'process.env.NODE_ENV': '"production"' },
  });
  return (createRequire(import.meta.url)(out) as typeof import('../src/entry-server.tsx')).prerender;
}

const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, ' ');

test('every route renders, with one h1, a title and no unsupported claims', async () => {
  const prerender = await loadPrerender();
  const site = prerender(snapshot);
  for (const p of ['/', '/base', '/baskets', '/ingredients', '/recipes', '/addons', '/pickup', '/research', '/research/ingredients',
    '/research/data', '/how-it-works']) assert.ok(site.paths.includes(p), `missing route ${p}`);
  assert.ok(site.paths.length > 50, 'detail pages are generated');

  const forbidden = [
    /\bbuy now\b/i, /\bcheckout\b/i, /\badd to cart\b/i, /\bcook-ready\b/i, /\boven[- ]safe\b/i, /\bdishwasher[- ]safe\b/i,
    /\bfreezer[- ]safe\b/i, /\bmicrowave[- ]safe\b/i, /\bsave \$\d/i, /\byou(?:'|’)ll save\b/i, /\bour (?:farm|supplier) partners?\b/i,
    /\b\d(?:\.\d)? stars?\b/i, /\bcustomer reviews?\b/i, /\bhealthiest\b/i, /\bcures?\b/i,
  ];
  for (const path of site.paths) {
    const { html, meta, status } = site.render(path);
    assert.equal(status, 200, path);
    assert.ok(meta.title && meta.description, `${path} has meta`);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${path} has exactly one h1`);
    const text = strip(html);
    for (const re of forbidden) assert.doesNotMatch(text, re, `${path} contains ${re}`);
    assert.doesNotMatch(html, /<img(?![^>]*\balt=)/, `${path} has an image without alt text`);
  }
  assert.equal(site.render('/ingredients/not-a-thing').status, 404);
  assert.equal(site.render('/nowhere').status, 404);
});

test('the reserve action is clearly a prototype', async () => {
  const prerender = await loadPrerender();
  const html = strip(prerender(snapshot).render('/base').html);
  assert.match(html, /prototype/i);
});

test('under a sub-path (GitHub Pages), every internal link carries the prefix', async () => {
  const prerender = await loadPrerender();
  const site = prerender(snapshot, '/Base');
  try {
    for (const path of ['/', '/base', '/recipes', '/research/ingredients']) {
      const hrefs = [...site.render(path).html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      const internal = hrefs.filter((h) => h.startsWith('/'));
      assert.ok(internal.length > 5, `${path} has internal links`);
      for (const h of internal) assert.ok(h === '/Base/' || h.startsWith('/Base/'), `${path}: ${h} is missing the base path`);
    }
  } finally {
    prerender(snapshot, '');
  }
});
