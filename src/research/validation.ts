// Data validation. Runs on every build (npm run data:validate) and fails loudly.
// The schema's CHECK constraints catch most single-row problems; this catches the
// cross-table ones: missing provenance, impossible nutrition, units without
// conversions, baskets that aren't useful, recipes with no ingredients.

export type Status = 'verified' | 'estimated' | 'demo' | 'derived';
const STATUSES = new Set(['verified', 'estimated', 'demo']);
const PRICE_UNITS = new Set(['kg', 'dozen', 'bunch', 'each', 'l']);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface ValidationData {
  sources: { id: number; slug: string; name: string; source_url: string; source_type: string; retrieved_at: string }[];
  ingredients: { id: number; slug: string; name: string; category: string; is_pantry_basic: number; serving_size_g: number }[];
  conversions: { ingredient_id: number; unit: string; grams: number }[];
  nutrition: { ingredient_id: number; calories: number; protein_g: number; carbohydrates_g: number; fat_g: number; fiber_g: number | null; sodium_mg: number | null; source_id: number | null; verification_status: string | null }[];
  prices: { ingredient_id: number; price: number; unit: string; source_id: number | null; verification_status: string | null }[];
  history: { ingredient_id: number; price: number; source_id: number | null; verification_status: string | null }[];
  seasonality: { ingredient_id: number; month: number; availability_score: number; source_id: number | null; verification_status: string | null }[];
  useCases: { ingredient_id: number; source_id: number | null; verification_status: string | null }[];
  provenance: { ingredient_id: number; source_id: number; datum_type: string; verification_status: string | null }[];
  baskets: { id: number; slug: string; status: string }[];
  basketItems: { basket_id: number; ingredient_id: number; quantity: number; estimated_servings: number; slot: string }[];
  recipes: { id: number; slug: string; prep_time_minutes: number }[];
  recipeIngredients: { recipe_id: number; ingredient_id: number | null; add_on_id: number | null }[];
  recipeSteps: { recipe_id: number }[];
  addOns: { id: number; slug: string; price: number; category: string; seasons: string; source_id: number | null; verification_status: string | null }[];
  containers: { id: number; slug: string; deposit_amount: number; purchase_price: number; capacity_g: number; cooking_capability: string; spec_status: string }[];
  derivedScores: { ingredient_id: number; reference_month: number; base_score: number }[];
}

export interface Issue { level: 'error' | 'warning'; check: string; message: string }

export function validate(d: ValidationData): Issue[] {
  const issues: Issue[] = [];
  const err = (check: string, message: string) => issues.push({ level: 'error', check, message });
  const warn = (check: string, message: string) => issues.push({ level: 'warning', check, message });
  const sourceIds = new Set(d.sources.map((s) => s.id));
  const ingName = new Map(d.ingredients.map((i) => [i.id, i.slug]));
  const scored = d.ingredients.filter((i) => !i.is_pantry_basic);

  // Sources --------------------------------------------------------------
  for (const s of d.sources) {
    if (!s.source_url?.trim()) err('source-url', `Source "${s.slug}" has no source URL.`);
    else if (!/^https?:\/\//.test(s.source_url)) err('source-url', `Source "${s.slug}" URL is not http(s): ${s.source_url}`);
    if (!/^\d{4}-\d{2}-\d{2}/.test(s.retrieved_at ?? '')) err('source-date', `Source "${s.slug}" has no valid retrieved_at date.`);
  }

  // Provenance on every external datum ------------------------------------
  const checkProv = (table: string, rows: { source_id: number | null; verification_status: string | null }[], label: (r: never) => string) => {
    for (const r of rows) {
      if (r.source_id == null || !sourceIds.has(r.source_id)) err('provenance', `${table}: ${label(r as never)} has no valid source.`);
      if (!r.verification_status || !STATUSES.has(r.verification_status)) err('verification-status', `${table}: ${label(r as never)} has a missing or invalid verification status.`);
    }
  };
  checkProv('nutrition', d.nutrition, (r: { ingredient_id: number }) => ingName.get(r.ingredient_id) ?? `#${r.ingredient_id}`);
  checkProv('prices', d.prices, (r: { ingredient_id: number }) => ingName.get(r.ingredient_id) ?? `#${r.ingredient_id}`);
  checkProv('price_history', d.history, (r: { ingredient_id: number }) => ingName.get(r.ingredient_id) ?? `#${r.ingredient_id}`);
  checkProv('seasonality', d.seasonality, (r: { ingredient_id: number; month: number }) => `${ingName.get(r.ingredient_id)} month ${r.month}`);
  checkProv('ingredient_use_cases', d.useCases, (r: { ingredient_id: number }) => ingName.get(r.ingredient_id) ?? `#${r.ingredient_id}`);
  checkProv('add_ons', d.addOns, (r: { slug: string }) => r.slug);

  // Slugs ----------------------------------------------------------------
  for (const [table, rows] of [['ingredients', d.ingredients], ['baskets', d.baskets], ['recipes', d.recipes], ['add_ons', d.addOns], ['sources', d.sources]] as const) {
    const seen = new Set<string>();
    for (const r of rows as { slug: string }[]) {
      if (!SLUG.test(r.slug)) err('slug', `${table}: invalid slug "${r.slug}".`);
      if (seen.has(r.slug)) err('slug', `${table}: duplicate slug "${r.slug}".`);
      seen.add(r.slug);
    }
  }

  // Ingredients have everything they need ----------------------------------
  for (const i of scored) {
    if (!d.nutrition.some((n) => n.ingredient_id === i.id)) err('ingredient-data', `${i.slug} has no nutrition record.`);
    if (!d.prices.some((p) => p.ingredient_id === i.id)) err('ingredient-data', `${i.slug} has no price.`);
    const months = d.seasonality.filter((s) => s.ingredient_id === i.id).length;
    if (months !== 12) err('ingredient-data', `${i.slug} has ${months} seasonality months (expected 12).`);
    if (!d.useCases.some((u) => u.ingredient_id === i.id)) err('ingredient-data', `${i.slug} has no culinary use cases.`);
    for (const datum of ['nutrition', 'price', 'seasonality', 'use_cases']) {
      if (!d.provenance.some((p) => p.ingredient_id === i.id && p.datum_type === datum)) {
        err('provenance', `${i.slug} has no ingredient_sources row for ${datum}.`);
      }
    }
    if (d.history.filter((h) => h.ingredient_id === i.id).length < 6) warn('price-history', `${i.slug} has fewer than 6 price observations; stability will not be scored.`);
  }

  // Prices and units ------------------------------------------------------
  for (const p of d.prices) {
    const slug = ingName.get(p.ingredient_id);
    if (!(p.price > 0)) err('price', `${slug}: price must be positive (got ${p.price}).`);
    if (!PRICE_UNITS.has(p.unit)) err('unit', `${slug}: invalid price unit "${p.unit}".`);
    if (!['kg', 'l'].includes(p.unit) && !d.conversions.some((c) => c.ingredient_id === p.ingredient_id && c.unit === p.unit && c.grams > 0)) {
      err('unit', `${slug}: priced per ${p.unit} but has no gram conversion for that unit.`);
    }
  }
  for (const h of d.history) if (!(h.price > 0)) err('price', `${ingName.get(h.ingredient_id)}: negative or zero price in history.`);

  // Nutrition plausibility --------------------------------------------------
  for (const n of d.nutrition) {
    const slug = ingName.get(n.ingredient_id);
    const fields = [n.calories, n.protein_g, n.carbohydrates_g, n.fat_g, n.fiber_g ?? 0, n.sodium_mg ?? 0];
    if (fields.some((x) => x < 0 || Number.isNaN(x))) { err('nutrition', `${slug}: negative or missing nutrient value.`); continue; }
    if (n.protein_g + n.carbohydrates_g + n.fat_g > 102) err('nutrition', `${slug}: macronutrients exceed 100 g per 100 g.`);
    if ((n.fiber_g ?? 0) > n.carbohydrates_g + 0.5) err('nutrition', `${slug}: fibre exceeds total carbohydrate.`);
    const atwater = 4 * n.protein_g + 4 * n.carbohydrates_g + 9 * n.fat_g;
    if (n.calories > 40 && Math.abs(atwater - n.calories) / n.calories > 0.3) {
      err('nutrition', `${slug}: calories (${n.calories}) inconsistent with macronutrients (~${Math.round(atwater)} kcal).`);
    }
  }

  // Seasonality range -------------------------------------------------------
  for (const s of d.seasonality) {
    if (s.month < 1 || s.month > 12 || s.availability_score < 0 || s.availability_score > 1) {
      err('seasonality', `${ingName.get(s.ingredient_id)}: invalid seasonality row (month ${s.month}, score ${s.availability_score}).`);
    }
  }

  // Baskets ---------------------------------------------------------------
  for (const b of d.baskets) {
    const items = d.basketItems.filter((i) => i.basket_id === b.id);
    if (items.length < 10 || items.length > 12) err('basket', `${b.slug}: has ${items.length} items (a Base has 10–12).`);
    for (const i of items) {
      const ing = d.ingredients.find((x) => x.id === i.ingredient_id);
      if (!ing) { err('basket', `${b.slug}: references a missing ingredient.`); continue; }
      if (!(i.quantity > 0)) err('basket', `${b.slug}: ${ing.slug} has an invalid quantity.`);
      if (Math.abs(i.quantity / ing.serving_size_g - i.estimated_servings) > 0.06) {
        err('basket', `${b.slug}: ${ing.slug} servings (${i.estimated_servings}) don't match quantity ÷ serving size.`);
      }
      if (ing.is_pantry_basic) err('basket', `${b.slug}: pantry basic ${ing.slug} should not be in a Base.`);
    }
    const cats = new Set(items.map((i) => d.ingredients.find((x) => x.id === i.ingredient_id)?.category));
    for (const need of ['grain', 'vegetable', 'aromatic']) if (!cats.has(need)) err('basket-composition', `${b.slug}: no ${need} — not a useful Base.`);
    if (!cats.has('protein') && !cats.has('legume')) err('basket-composition', `${b.slug}: no protein or legume — not a useful Base.`);
  }
  if (!d.baskets.some((b) => b.status === 'current')) err('basket', 'There is no current basket.');

  // Recipes ---------------------------------------------------------------
  for (const r of d.recipes) {
    const ings = d.recipeIngredients.filter((x) => x.recipe_id === r.id);
    if (!ings.some((x) => x.ingredient_id != null)) err('recipe', `${r.slug}: has no ingredients.`);
    if (!d.recipeSteps.some((s) => s.recipe_id === r.id)) err('recipe', `${r.slug}: has no steps.`);
    if (!(r.prep_time_minutes > 0)) err('recipe', `${r.slug}: invalid prep time.`);
    for (const x of ings) {
      if ((x.ingredient_id == null) === (x.add_on_id == null)) err('recipe', `${r.slug}: an ingredient line must reference exactly one ingredient or add-on.`);
    }
  }

  // Add-ons ----------------------------------------------------------------
  for (const a of d.addOns) {
    if (!(a.price > 0) || a.price > 200) err('add-on', `${a.slug}: implausible price ${a.price}.`);
    if (!['premium_protein', 'flavor', 'specialty', 'treat'].includes(a.category)) err('add-on', `${a.slug}: invalid category.`);
    if (!a.seasons.split(',').every((s) => ['winter', 'spring', 'summer', 'fall'].includes(s))) err('add-on', `${a.slug}: invalid seasons "${a.seasons}".`);
  }

  // Containers -------------------------------------------------------------
  for (const c of d.containers) {
    if (!(c.deposit_amount >= 0)) err('container', `${c.slug}: deposit cannot be negative.`);
    if (!(c.purchase_price > c.deposit_amount)) err('container', `${c.slug}: purchase price should exceed the deposit.`);
    if (!(c.capacity_g > 0)) err('container', `${c.slug}: capacity must be positive.`);
    if (c.spec_status !== 'verified' && /oven[- ]safe|microwave[- ]safe|dishwasher[- ]safe/i.test(c.cooking_capability) && !/pending/i.test(c.cooking_capability)) {
      err('container-claims', `${c.slug}: makes a safety claim without a verified specification.`);
    }
  }

  // Derived scores ----------------------------------------------------------
  for (const i of scored) {
    const n = d.derivedScores.filter((s) => s.ingredient_id === i.id).length;
    if (n !== 12) err('derived-scores', `${i.slug}: has ${n} derived score months (expected 12). Run npm run research:rank.`);
  }

  return issues;
}
