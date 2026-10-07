// npm run research:baskets — build the weekly Bases from the derived scores.
//
// Builds, in order:
//   last week (archived) → this week (current) → next week (upcoming), each rotating
//   against the week before; a plant-forward variant of this week; and seasonal
//   previews for the other three seasons. Then plans containers, suggests add-ons and
//   links recipes. Deterministic: same database + same week → same baskets.
import { all, openDb, transaction, type Db } from '../src/data/sqlite/connection.ts';
import { buildBasket, BUILDER_VERSION, BUILDER_RULES, peakSeasonBonus, type Candidate, type Diet } from '../src/research/basket-builder.ts';
import { planContainers, type ContainerSpec } from '../src/research/containers.ts';
import { recipeFit, suggestAddOns } from '../src/research/matching.ts';
import { addDays, currentWeekOf, MONTH_NAMES, SEASON_LABEL, seasonOf, type Season } from '../src/research/calendar.ts';

const REGION = 'BC';

function candidates(db: Db, month: number): (Candidate & { needsContainer: boolean; prepForm: string })[] {
  const rows = all<{
    id: number; slug: string; name: string; category: string; family: string; shelf_life_days: number; serving_size_g: number;
    price_per_kg: number; base_score: number; availability_score: number; classification: Candidate['classification'];
    needs_container: number; prep_form: string;
  }>(db, `
    SELECT i.id, i.slug, i.name, i.category, i.family, i.shelf_life_days, i.serving_size_g, i.needs_container, i.prep_form,
           v.price_per_kg, d.base_score, d.availability_score, d.classification
    FROM ingredients i
    JOIN v_price_per_kg v ON v.ingredient_id = i.id AND v.region = ?
    JOIN derived_scores d ON d.ingredient_id = i.id AND d.region = ? AND d.reference_month = ?
    WHERE i.is_pantry_basic = 0`, REGION, REGION, month);
  if (!rows.length) throw new Error(`No derived scores for month ${month}. Run npm run research:rank first.`);
  const seasons = all<{ ingredient_id: number; availability_score: number }>(db,
    'SELECT ingredient_id, availability_score FROM seasonality WHERE region = ? ORDER BY ingredient_id, month', REGION);
  const curve = (id: number) => seasons.filter((s) => s.ingredient_id === id).map((s) => s.availability_score);
  return rows.map((r) => ({
    peakBonus: peakSeasonBonus(curve(r.id), month),
    id: r.id, slug: r.slug, name: r.name, category: r.category, family: r.family, shelfLifeDays: r.shelf_life_days,
    servingG: r.serving_size_g, pricePerKg: r.price_per_kg, baseScore: r.base_score, availability: r.availability_score,
    classification: r.classification, needsContainer: r.needs_container === 1, prepForm: r.prep_form,
  }));
}

const db = openDb();
const containerSpecs: ContainerSpec[] = all<{ slug: string; name: string; capacity_g: number; deposit_amount: number; purchase_price: number }>(
  db, 'SELECT slug, name, capacity_g, deposit_amount, purchase_price FROM containers ORDER BY capacity_g',
).map((c) => ({ slug: c.slug, name: c.name, capacityG: c.capacity_g, deposit: c.deposit_amount, purchasePrice: c.purchase_price,
  kind: c.slug.includes('jar') ? 'jar' : 'glass' }));

const addOns = all<{ id: number; slug: string; category: string; seasons: string; status: string; pairs_with: string | null; price: number }>(
  db, 'SELECT id, slug, category, seasons, status, pairs_with, price FROM add_ons');
// pairing lists live in the seed catalog; re-read them so suggestions are data-driven
const { ADD_ONS } = await import('../db/seeds/catalog.ts');
const addOnShapes = addOns.map((a) => ({
  slug: a.slug, category: a.category, seasons: a.seasons.split(','), status: a.status, price: a.price,
  pairs: ADD_ONS.find((x) => x.slug === a.slug)?.pairs ?? [],
}));

const recipes = all<{ id: number; slug: string }>(db, 'SELECT id, slug FROM recipes');
const recipeIngredients = all<{ recipe_id: number; slug: string; is_optional: number; is_pantry_basic: number }>(db, `
  SELECT ri.recipe_id, i.slug, ri.is_optional, i.is_pantry_basic
  FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id`);

interface Plan { slug: string; name: string; description: string; type: 'weekly' | 'seasonal' | 'variant'; status: string;
  month: number; weekOf: string | null; diet: Diet; previous: string[] }

function describe(season: Season, month: number, count: number, diet: Diet, type: Plan['type']): string {
  const lead = type === 'seasonal'
    ? `A preview of a ${SEASON_LABEL[season].toLowerCase()} Base, built from what is good in BC in ${MONTH_NAMES[month - 1]}.`
    : `${count} ingredients selected for a flexible week of cooking, built from what is good in BC in ${MONTH_NAMES[month - 1]}.`;
  return diet === 'plant_forward' ? `${lead} Plant-forward: no meat, with tofu, eggs and legumes for protein.` : lead;
}

function insertBasket(plan: Plan): string[] {
  const season = seasonOf(plan.month);
  const cands = candidates(db, plan.month);
  const result = buildBasket(cands, { diet: plan.diet, previous: plan.previous });
  const description = describe(season, plan.month, result.picks.length, plan.diet, plan.type);

  db.prepare(`INSERT INTO baskets (slug, name, description, basket_type, region, season, reference_month, week_of, status,
    household_size, diet, generated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 2, ?, ?)`)
    .run(plan.slug, plan.name, description, plan.type, REGION, season, plan.month, plan.weekOf, plan.status, plan.diet, BUILDER_VERSION);
  const basketId = (db.prepare('SELECT id FROM baskets WHERE slug = ?').get(plan.slug) as { id: number }).id;

  const insItem = db.prepare(`INSERT INTO basket_items (basket_id, ingredient_id, quantity, unit, estimated_servings, slot, position,
    selection_reason) VALUES (?, ?, ?, 'g', ?, ?, ?, ?)`);
  result.picks.forEach((p, i) => insItem.run(basketId, p.candidate.id, p.quantityG, p.estimatedServings, p.slot, i + 1, p.reason));

  const byslug = new Map(cands.map((c) => [c.slug, c]));
  const counts = planContainers(result.picks.map((p) => ({
    slug: p.candidate.slug, quantityG: p.quantityG, needsContainer: byslug.get(p.candidate.slug)!.needsContainer,
    category: p.candidate.category, prepForm: byslug.get(p.candidate.slug)!.prepForm,
  })), containerSpecs);
  const insCont = db.prepare(`INSERT INTO basket_containers (basket_id, container_id, quantity)
    VALUES (?, (SELECT id FROM containers WHERE slug = ?), ?)`);
  for (const [slug, n] of counts) insCont.run(basketId, slug, n);

  const slugs = new Set(result.picks.map((p) => p.candidate.slug));
  const insAdd = db.prepare('INSERT INTO basket_add_ons (basket_id, add_on_id, reason, position) VALUES (?, ?, ?, ?)');
  suggestAddOns(addOnShapes, slugs, season).forEach((s, i) => {
    const names = s.matches.map((m) => byslug.get(m)?.name.toLowerCase()).filter(Boolean);
    const reason = names.length ? `Pairs with this week's ${names.slice(0, 2).join(' and ')}.` : 'A seasonal extra.';
    insAdd.run(basketId, addOns.find((a) => a.slug === s.addOn.slug)!.id, reason, i + 1);
  });

  const insRB = db.prepare('INSERT INTO recipe_baskets (recipe_id, basket_id, base_ingredients_used) VALUES (?, ?, ?)');
  for (const r of recipes) {
    const fit = recipeFit({
      slug: r.slug,
      ingredients: recipeIngredients.filter((x) => x.recipe_id === r.id)
        .map((x) => ({ slug: x.slug, optional: x.is_optional === 1, pantryBasic: x.is_pantry_basic === 1 })),
    }, slugs);
    if (fit) insRB.run(r.id, basketId, fit);
  }

  console.log(`\n${plan.name} [${plan.status}] — ${result.picks.length} items, ingredients ~$${result.ingredientCost.toFixed(2)}`);
  for (const p of result.picks) console.log(`  ${p.slot.padEnd(17)} ${p.candidate.name.padEnd(22)} ${String(p.quantityG).padStart(5)} g  ${p.reason}`);
  for (const l of result.log) console.log(`  · ${l}`);
  return result.picks.map((p) => p.candidate.slug);
}

const thisWeek = currentWeekOf();
const weeks = [
  { weekOf: addDays(thisWeek, -7), status: 'archived' },
  { weekOf: thisWeek, status: 'current' },
  { weekOf: addDays(thisWeek, 7), status: 'upcoming' },
];

transaction(db, () => {
  for (const t of ['recipe_baskets', 'basket_add_ons', 'basket_containers', 'basket_items', 'baskets']) db.exec(`DELETE FROM ${t}`);

  let previous: string[] = [];
  let currentPrevious: string[] = [];
  for (const w of weeks) {
    const month = Number(w.weekOf.slice(5, 7));
    const season = SEASON_LABEL[seasonOf(month)];
    if (w.status === 'current') currentPrevious = previous;
    previous = insertBasket({ slug: `${seasonOf(month)}-base-${w.weekOf}`, name: `${season} Base`, description: '',
      type: 'weekly', status: w.status, month, weekOf: w.weekOf, diet: 'omnivore', previous });
  }

  const currentMonth = Number(thisWeek.slice(5, 7));
  const currentSeason = seasonOf(currentMonth);
  insertBasket({ slug: `${currentSeason}-base-${thisWeek}-plant-forward`, name: `${SEASON_LABEL[currentSeason]} Base, plant-forward`,
    description: '', type: 'variant', status: 'current', month: currentMonth, weekOf: thisWeek, diet: 'plant_forward', previous: currentPrevious });

  const representative: Record<Season, number> = { winter: 1, spring: 5, summer: 8, fall: 10 };
  for (const season of ['winter', 'spring', 'summer', 'fall'] as Season[]) {
    if (season === currentSeason) continue;
    insertBasket({ slug: `${season}-base-preview`, name: `${SEASON_LABEL[season]} Base`, description: '', type: 'seasonal',
      status: 'template', month: representative[season], weekOf: null, diet: 'omnivore', previous: [] });
  }

  db.prepare('INSERT INTO research_runs (kind, methodology_version, parameters, ran_at) VALUES (?, ?, ?, ?)')
    .run('baskets', BUILDER_VERSION, JSON.stringify({ region: REGION, weekOf: thisWeek, rules: BUILDER_RULES }), new Date().toISOString());
});
db.close();
