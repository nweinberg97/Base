// Loads the seed data in db/seeds into a migrated database. Idempotent only in the
// sense that it expects an empty database: run `npm run db:reset` to start over.
import type { Db } from './connection.ts';
import { transaction } from './connection.ts';
import { INGREDIENTS } from '../../../db/seeds/ingredients.ts';
import {
  ADD_ONS, CONTAINERS, CONTAINER_CAPABILITY, CONTAINER_MATERIAL, DEMO_CONTAINER_ACCOUNT,
  PICKUP_LOCATIONS, SOURCES, SUPPLIERS, USE_CASES,
} from '../../../db/seeds/catalog.ts';
import { RECIPES } from '../../../db/seeds/recipes.ts';
import { priceHistory } from '../../../db/seeds/price-history.ts';

export const REGION = 'BC';
export const SEED_DATE = '2026-10-05';          // when the seed data was assembled
const HISTORY_END = { year: 2026, month: 10 };   // last price observation month

export function seed(db: Db): Record<string, number> {
  return transaction(db, () => {
    const id = (table: string, slug: string): number => {
      const row = db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(slug) as { id: number } | undefined;
      if (!row) throw new Error(`Seed references unknown ${table} slug "${slug}"`);
      return row.id;
    };

    // sources
    const insSource = db.prepare(`INSERT INTO sources (slug, name, source_url, source_type, region, retrieved_at, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)`);
    for (const s of SOURCES) insSource.run(s.slug, s.name, s.url, s.type, s.region, s.retrieved, s.description);
    const SRC = Object.fromEntries(SOURCES.map((s) => [s.slug, id('sources', s.slug)]));

    // suppliers
    const insSupplier = db.prepare(`INSERT INTO suppliers (slug, name, region, website, supplier_type, verification_status, notes)
      VALUES (?, ?, ?, NULL, ?, 'demo', ?)`);
    for (const s of SUPPLIERS) insSupplier.run(s.slug, s.name, s.region, s.type, s.notes);

    // use cases
    const insUse = db.prepare('INSERT INTO use_cases (slug, name, use_group) VALUES (?, ?, ?)');
    for (const u of USE_CASES) insUse.run(u.slug, u.name, u.group);

    // ingredients + everything hanging off them
    const insIng = db.prepare(`INSERT INTO ingredients (slug, name, description, category, family, default_unit, storage_type,
      shelf_life_days, serving_size_g, purchase_form, prep_form, needs_container, is_pantry_basic, editorial_why,
      visual_color, visual_accent, visual_texture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insConv = db.prepare('INSERT INTO unit_conversions (ingredient_id, unit, grams) VALUES (?, ?, ?)');
    const insIngSrc = db.prepare(`INSERT INTO ingredient_sources (ingredient_id, source_id, datum_type, verification_status, collected_at, notes)
      VALUES (?, ?, ?, ?, ?, ?)`);
    const insNut = db.prepare(`INSERT INTO nutrition (ingredient_id, serving_size, serving_size_g, calories, protein_g, carbohydrates_g,
      fat_g, fiber_g, sodium_mg, source_id, verification_status, collected_at, notes)
      VALUES (?, '100 g', 100, ?, ?, ?, ?, ?, ?, ?, 'estimated', ?, ?)`);
    const insPrice = db.prepare(`INSERT INTO prices (ingredient_id, supplier_id, source_id, region, price, unit, currency, price_date,
      verification_status, notes) VALUES (?, ?, ?, ?, ?, ?, 'CAD', ?, 'estimated', ?)`);
    const insHist = db.prepare(`INSERT INTO price_history (ingredient_id, source_id, region, price, unit, currency, observed_on,
      verification_status) VALUES (?, ?, ?, ?, ?, 'CAD', ?, 'demo')`);
    const insSeason = db.prepare(`INSERT INTO seasonality (ingredient_id, region, month, availability_score, is_local, source_id,
      verification_status) VALUES (?, ?, ?, ?, ?, ?, 'estimated')`);
    const insIngUse = db.prepare(`INSERT INTO ingredient_use_cases (ingredient_id, use_case_id, source_id, verification_status)
      VALUES (?, ?, ?, 'estimated')`);

    for (const g of INGREDIENTS) {
      if (g.season.length !== 12 || !/^\d{12}$/.test(g.season)) throw new Error(`Bad season string for ${g.slug}`);
      insIng.run(g.slug, g.name, g.description, g.category, g.family, g.unit, g.storage, g.shelf, g.serving, g.purchase,
        g.prep, g.container ? 1 : 0, g.pantryBasic ? 1 : 0, g.why, g.visual[0], g.visual[1], g.visual[2]);
      const ing = id('ingredients', g.slug);
      for (const [unit, grams] of Object.entries(g.conversions ?? {})) insConv.run(ing, unit, grams);

      const [kcal, p, c, f, fib, na] = g.n;
      insNut.run(ing, kcal, p, c, f, fib, na, SRC['usda-fdc-sr-legacy'], SEED_DATE, `Per 100 g, ${g.purchase}.`);
      insIngSrc.run(ing, SRC['usda-fdc-sr-legacy'], 'nutrition', 'estimated', SEED_DATE, `Approximate reference values for ${g.purchase}.`);

      const supplier = id('suppliers', g.supplier);
      insPrice.run(ing, supplier, SRC['base-bc-price-estimates'], REGION, g.price[0], g.price[1], SEED_DATE,
        'Typical BC retail level, estimated. Not a quote and not real-time.');
      insIngSrc.run(ing, SRC['base-bc-price-estimates'], 'price', 'estimated', SEED_DATE, null);

      for (const h of priceHistory(g, HISTORY_END.year, HISTORY_END.month)) {
        insHist.run(ing, SRC['base-price-history-model'], REGION, h.price, g.price[1], h.observed_on);
      }
      insIngSrc.run(ing, SRC['base-price-history-model'], 'price_history', 'demo', SEED_DATE, 'Synthetic, for demonstrating the stability method.');

      for (let m = 1; m <= 12; m++) {
        const digit = Number(g.season[m - 1]);
        insSeason.run(ing, REGION, m, Math.round((digit / 9) * 1000) / 1000, g.bcGrown && digit >= 5 ? 1 : 0, SRC['base-bc-seasonality']);
      }
      insIngSrc.run(ing, SRC['base-bc-seasonality'], 'seasonality', 'estimated', SEED_DATE, null);

      for (const u of g.uses) insIngUse.run(ing, id('use_cases', u), SRC['base-use-case-catalogue']);
      if (g.uses.length) insIngSrc.run(ing, SRC['base-use-case-catalogue'], 'use_cases', 'estimated', SEED_DATE, null);
    }

    // add-ons
    const insAdd = db.prepare(`INSERT INTO add_ons (slug, name, description, category, price, unit, ingredient_id, seasons, status,
      source_id, verification_status, pairs_with) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'demo', ?)`);
    for (const a of ADD_ONS) {
      insAdd.run(a.slug, a.name, a.description, a.category, a.price, a.unit, a.ingredient ? id('ingredients', a.ingredient) : null,
        a.seasons, a.status, SRC['base-add-on-catalogue'], a.pairsNote);
    }

    // containers
    const insCont = db.prepare(`INSERT INTO containers (slug, name, size_ml, capacity_g, material, ownership_model, deposit_amount,
      purchase_price, cooking_capability, spec_status, source_id, verification_status, notes)
      VALUES (?, ?, ?, ?, ?, 'borrow_or_own', ?, ?, ?, 'pending', ?, 'demo', ?)`);
    for (const c of CONTAINERS) {
      insCont.run(c.slug, c.name, c.size, c.capacity, CONTAINER_MATERIAL, c.deposit, c.purchase, CONTAINER_CAPABILITY,
        SRC['base-container-spec'], c.notes);
    }

    // pickup
    const insLoc = db.prepare(`INSERT INTO pickup_locations (slug, name, neighbourhood, city, is_demo, description) VALUES (?, ?, ?, ?, 1, ?)`);
    const insWin = db.prepare('INSERT INTO pickup_windows (location_id, weekday, start_time, end_time, notes) VALUES (?, ?, ?, ?, ?)');
    for (const l of PICKUP_LOCATIONS) {
      insLoc.run(l.slug, l.name, l.neighbourhood, l.city, l.description);
      const loc = id('pickup_locations', l.slug);
      for (const w of l.windows) insWin.run(loc, w.weekday, w.start, w.end, w.notes);
    }

    // demo container account
    db.prepare(`INSERT INTO container_accounts (member_ref, is_demo, next_pickup_date) VALUES (?, 1, NULL)`).run(DEMO_CONTAINER_ACCOUNT.member);
    const acct = (db.prepare('SELECT id FROM container_accounts WHERE member_ref = ?').get(DEMO_CONTAINER_ACCOUNT.member) as { id: number }).id;
    const insLine = db.prepare('INSERT INTO container_account_lines (account_id, container_id, borrowed, returned, owned) VALUES (?, ?, ?, ?, ?)');
    for (const l of DEMO_CONTAINER_ACCOUNT.lines) insLine.run(acct, id('containers', l.container), l.borrowed, l.returned, l.owned);

    // recipes
    const insRecipe = db.prepare(`INSERT INTO recipes (slug, name, description, creator_name, creator_is_demo, status, prep_time_minutes,
      difficulty, servings, tags, upgrade_note, verification_status) VALUES (?, ?, ?, ?, 1, 'published', ?, ?, ?, ?, ?, 'demo')`);
    const insStep = db.prepare('INSERT INTO recipe_steps (recipe_id, position, text) VALUES (?, ?, ?)');
    const insRI = db.prepare(`INSERT INTO recipe_ingredients (recipe_id, ingredient_id, add_on_id, quantity, unit, is_optional, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)`);
    for (const r of RECIPES) {
      insRecipe.run(r.slug, r.name, r.description, r.creator, r.prep, r.difficulty, r.servings, r.tags.join(','), r.upgrade ?? null);
      const rid = id('recipes', r.slug);
      r.steps.forEach((t, i) => insStep.run(rid, i + 1, t));
      for (const [slug, qty, unit, optional, note] of r.ingredients) {
        insRI.run(rid, id('ingredients', slug), null, qty, unit, optional ? 1 : 0, note ?? null);
      }
      for (const [slug, note] of r.addOns ?? []) insRI.run(rid, null, id('add_ons', slug), null, null, 1, note);
    }

    const count = (t: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n;
    return Object.fromEntries(['sources', 'suppliers', 'ingredients', 'nutrition', 'prices', 'price_history', 'seasonality',
      'use_cases', 'ingredient_use_cases', 'add_ons', 'containers', 'pickup_locations', 'recipes'].map((t) => [t, count(t)]));
  });
}
