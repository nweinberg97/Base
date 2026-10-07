// Data access for the storefront. Components never read the snapshot directly;
// they call these functions. Derived calculations come from src/research.
//
// Backend boundary: today the store is a static snapshot exported from SQLite. A
// hosted backend would implement the same functions over HTTP; no page changes.

import type {
  AddOn, Basket, BasketItem, Container, DataSnapshot, DataStatus, Ingredient, MonthScore, PickupLocation, Recipe, Source,
} from './types.ts';
import { basketCost, estimatePlates, orderSummary, type BasketCost } from '../research/cost.ts';
import { containerBalance, depositFor, purchaseCostFor, type ContainerSpec } from '../research/containers.ts';
import { recipeFit } from '../research/matching.ts';
import { BASE_SCORE_WEIGHTS } from '../research/scoring.ts';
import { MONTH_NAMES, SEASON_LABEL, seasonOf, type Season } from '../research/calendar.ts';

let store: DataSnapshot | null = null;

export function setSnapshot(snapshot: DataSnapshot): void {
  store = snapshot;
}

export function snapshot(): DataSnapshot {
  if (!store) throw new DataUnavailableError('The Base data has not loaded.');
  return store;
}

export class DataUnavailableError extends Error {}
export class NotFoundError extends Error {}

// ------------------------------------------------------------------ lookups

const byId = <T extends { id: number }>(list: T[], id: number | null | undefined): T | undefined =>
  id == null ? undefined : list.find((x) => x.id === id);

export function getSource(id: number | null | undefined): Source | undefined {
  return byId(snapshot().sources, id);
}
export function getSources(): Source[] {
  return snapshot().sources;
}
export function getSupplier(id: number | null | undefined) {
  return byId(snapshot().suppliers, id);
}
export function getIngredientById(id: number): Ingredient | undefined {
  return byId(snapshot().ingredients, id);
}
export function getAddOnById(id: number): AddOn | undefined {
  return byId(snapshot().addOns, id);
}
export function getRecipeById(id: number): Recipe | undefined {
  return byId(snapshot().recipes, id);
}
export function getUseCase(slug: string) {
  return snapshot().useCases.find((u) => u.slug === slug);
}

export function referenceMonth(): number {
  return snapshot().referenceMonth;
}
export function currentSeason(): Season {
  return seasonOf(snapshot().referenceMonth);
}

/** The score for an ingredient in a given month (default: the reference month). */
export function scoreFor(ing: Ingredient, month = snapshot().referenceMonth): MonthScore | undefined {
  return ing.scores.find((s) => s.month === month);
}

// ------------------------------------------------------------------ baskets

export interface BasketLine {
  item: BasketItem;
  ingredient: Ingredient;
  score: MonthScore | undefined;
  cost: number;                    // estimated ingredient cost of this line
}

export interface BasketView {
  basket: Basket;
  lines: BasketLine[];
  cost: BasketCost;
  plates: number;
  containers: { container: Container; quantity: number }[];
  containerCount: number;
  deposit: number;
  containerPurchase: number;
  addOns: { addOn: AddOn; reason: string }[];
  recipes: { recipe: Recipe; baseIngredientsUsed: number }[];
  seasonLabel: string;
  monthLabel: string;
  weekLabel: string | null;
}

function containerSpecs(): ContainerSpec[] {
  return snapshot().containers.map((c) => ({
    slug: c.slug, name: c.name, capacityG: c.capacityG, deposit: c.deposit, purchasePrice: c.purchasePrice,
    kind: c.slug.includes('jar') ? 'jar' : 'glass',
  }));
}

export function formatWeek(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export function viewBasket(basket: Basket): BasketView {
  const s = snapshot();
  const lines: BasketLine[] = basket.items.map((item) => {
    const ingredient = getIngredientById(item.ingredientId);
    if (!ingredient) throw new NotFoundError(`Basket ${basket.slug} references a missing ingredient.`);
    return {
      item, ingredient, score: scoreFor(ingredient, basket.referenceMonth),
      cost: Math.round(((ingredient.price.pricePerKg * item.quantityG) / 1000) * 100) / 100,
    };
  });
  const containers = basket.containers.map((c) => {
    const container = byId(s.containers, c.containerId);
    if (!container) throw new NotFoundError('Missing container');
    return { container, quantity: c.quantity };
  });
  const counts = new Map(containers.map((c) => [c.container.slug, c.quantity]));
  const containerCount = containers.reduce((n, c) => n + c.quantity, 0);
  const cost = basketCost(
    lines.map((l) => ({ pricePerKg: l.ingredient.price.pricePerKg, quantityG: l.item.quantityG, prepared: l.ingredient.prepForm !== 'whole' })),
    containerCount,
  );
  return {
    basket, lines, cost,
    plates: estimatePlates(lines.map((l) => ({ slot: l.item.slot, estimatedServings: l.item.estimatedServings }))),
    containers, containerCount,
    deposit: depositFor(counts, containerSpecs()),
    containerPurchase: purchaseCostFor(counts, containerSpecs()),
    addOns: basket.addOns.map((a) => ({ addOn: getAddOnById(a.addOnId)!, reason: a.reason })).filter((a) => a.addOn),
    recipes: basket.recipes.map((r) => ({ recipe: getRecipeById(r.recipeId)!, baseIngredientsUsed: r.baseIngredientsUsed })).filter((r) => r.recipe),
    seasonLabel: SEASON_LABEL[basket.season],
    monthLabel: MONTH_NAMES[basket.referenceMonth - 1],
    weekLabel: formatWeek(basket.weekOf),
  };
}

/** This week's Base: the current, omnivore weekly basket. */
export function getCurrentBase(): BasketView {
  const b = snapshot().baskets.find((x) => x.status === 'current' && x.type === 'weekly');
  if (!b) throw new NotFoundError('There is no current Base this week.');
  return viewBasket(b);
}

export function getBaskets(): Basket[] {
  return snapshot().baskets;
}

export function getBasketBySlug(slug: string): BasketView {
  const b = snapshot().baskets.find((x) => x.slug === slug);
  if (!b) throw new NotFoundError(`No basket called "${slug}".`);
  return viewBasket(b);
}

export function getBasketCost(slug: string): BasketCost {
  return getBasketBySlug(slug).cost;
}

export type ContainerMode = 'borrow' | 'own' | 'returning';

/** What the customer would pay today for a basket, chosen add-ons and a container mode. */
export function getOrderSummary(view: BasketView, addOnIds: number[], mode: ContainerMode) {
  const prices = addOnIds.map((id) => getAddOnById(id)?.price).filter((p): p is number => p !== undefined);
  return orderSummary(view.cost.foodPrice, prices, { deposit: view.deposit, purchase: view.containerPurchase }, mode);
}

// ------------------------------------------------------------------ ingredients

export interface IngredientFilter {
  category?: string;
  classification?: MonthScore['classification'];
  inSeason?: boolean;
  query?: string;
}

export function getIngredients(filter: IngredientFilter = {}): Ingredient[] {
  const month = snapshot().referenceMonth;
  const q = filter.query?.trim().toLowerCase();
  return snapshot().ingredients.filter((i) => {
    if (i.isPantryBasic) return false;
    const sc = scoreFor(i, month);
    if (filter.category && i.category !== filter.category) return false;
    if (filter.classification && sc?.classification !== filter.classification) return false;
    if (filter.inSeason && (i.seasonality.availability[month - 1] ?? 0) < 5 / 9) return false;
    if (q && !`${i.name} ${i.category} ${i.description}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function getIngredientBySlug(slug: string): Ingredient {
  const i = snapshot().ingredients.find((x) => x.slug === slug);
  if (!i) throw new NotFoundError(`No ingredient called "${slug}".`);
  return i;
}

/** Baskets an ingredient appears in. */
export function getBasketsForIngredient(id: number): Basket[] {
  return snapshot().baskets.filter((b) => b.items.some((i) => i.ingredientId === id));
}

export function getRecipesForIngredient(id: number): Recipe[] {
  return snapshot().recipes.filter((r) => r.lines.some((l) => l.ingredientId === id && !l.optional));
}

export type RankingKey = 'baseScore' | 'affordability' | 'versatility' | 'nutrition' | 'availability' | 'priceStability' | 'costPerServing';

export interface RankingRow { ingredient: Ingredient; score: MonthScore }

/**
 * Ingredient ranking for a month. Sorting is deterministic: ties break by name.
 * costPerServing sorts ascending (cheapest first); everything else descending.
 */
export function getIngredientRanking(opts: { by?: RankingKey; month?: number; category?: string; classification?: string } = {}): RankingRow[] {
  const by = opts.by ?? 'baseScore';
  const month = opts.month ?? snapshot().referenceMonth;
  const rows = snapshot().ingredients
    .filter((i) => !i.isPantryBasic && (!opts.category || i.category === opts.category))
    .map((i) => ({ ingredient: i, score: scoreFor(i, month)! }))
    .filter((r) => r.score && (!opts.classification || r.score.classification === opts.classification));
  const val = (r: RankingRow) => r.score[by] ?? -1;
  return rows.sort((a, b) => {
    const d = by === 'costPerServing' ? val(a) - val(b) : val(b) - val(a);
    return d !== 0 ? d : a.ingredient.name.localeCompare(b.ingredient.name);
  });
}

// ------------------------------------------------------------------ recipes

export function getRecipes(): Recipe[] {
  return snapshot().recipes;
}

export function getRecipeBySlug(slug: string): Recipe {
  const r = snapshot().recipes.find((x) => x.slug === slug);
  if (!r) throw new NotFoundError(`No recipe called "${slug}".`);
  return r;
}

export function getRecipesForBasket(basketId: number): { recipe: Recipe; baseIngredientsUsed: number }[] {
  const b = snapshot().baskets.find((x) => x.id === basketId);
  if (!b) throw new NotFoundError('No such basket.');
  return b.recipes.map((r) => ({ recipe: getRecipeById(r.recipeId)!, baseIngredientsUsed: r.baseIngredientsUsed })).filter((x) => x.recipe);
}

/** Does a recipe fit a basket? Recomputed client-side so "what can I make" stays honest. */
export function recipeFitsBasket(recipe: Recipe, basket: Basket): number | null {
  const slugs = new Set(basket.items.map((i) => getIngredientById(i.ingredientId)?.slug).filter(Boolean) as string[]);
  return recipeFit({
    slug: recipe.slug,
    ingredients: recipe.lines.filter((l) => l.ingredientId != null).map((l) => {
      const ing = getIngredientById(l.ingredientId!)!;
      return { slug: ing.slug, optional: l.optional, pantryBasic: ing.isPantryBasic };
    }),
  }, slugs);
}

/** Baskets a recipe can be made from. */
export function getBasketsForRecipe(recipeId: number): Basket[] {
  return snapshot().baskets.filter((b) => b.recipes.some((r) => r.recipeId === recipeId));
}

// ------------------------------------------------------------------ add-ons

export function getAddOns(opts: { season?: Season; category?: string } = {}): AddOn[] {
  return snapshot().addOns.filter((a) =>
    (!opts.season || a.seasons.includes(opts.season)) && (!opts.category || a.category === opts.category));
}

// ------------------------------------------------------------------ pickup + containers

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function getPickupInformation(): { locations: PickupLocation[]; nextPickup: { date: string; label: string; location: PickupLocation; window: PickupLocation['windows'][number] } | null } {
  const s = snapshot();
  const locations = s.pickupLocations;
  // next pickup: the first window on or after the Monday of the current week
  let best: { date: string; label: string; location: PickupLocation; window: PickupLocation['windows'][number] } | null = null;
  for (const location of locations) {
    for (const window of location.windows) {
      const monday = new Date(`${s.weekOf}T00:00:00Z`);
      const offset = (window.weekday + 6) % 7; // days after Monday
      const d = new Date(monday);
      d.setUTCDate(d.getUTCDate() + offset);
      const date = d.toISOString().slice(0, 10);
      if (!best || date < best.date) {
        best = { date, label: d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }), location, window };
      }
    }
  }
  return { locations, nextPickup: best };
}

export function getContainerInformation() {
  const s = snapshot();
  const account = s.containerAccount;
  const balance = account
    ? containerBalance(account.lines.map((l) => ({
        containerSlug: byId(s.containers, l.containerId)!.slug, borrowed: l.borrowed, returned: l.returned, owned: l.owned,
      })), containerSpecs())
    : null;
  return { containers: s.containers, account, balance };
}

// ------------------------------------------------------------------ research

export function statusOfScore(): DataStatus {
  return 'derived';
}

export function getResearchSummary() {
  const s = snapshot();
  const scorable = s.ingredients.filter((i) => !i.isPantryBasic);
  const statusCounts: Record<string, number> = { verified: 0, estimated: 0, demo: 0 };
  const tally = (st: string) => { statusCounts[st] = (statusCounts[st] ?? 0) + 1; };
  for (const i of scorable) {
    tally(i.nutrition.status); tally(i.price.status); tally(i.seasonality.status); tally(i.historyStatus);
  }
  const month = s.referenceMonth;
  const classes = { foundation: 0, supporting: 0, expression: 0 };
  for (const i of scorable) {
    const sc = scoreFor(i, month);
    if (sc) classes[sc.classification]++;
  }
  return {
    counts: s.counts,
    ingredientCount: scorable.length,
    statusCounts,
    classes,
    weights: BASE_SCORE_WEIGHTS,
    methodologyVersion: s.methodologyVersion,
    builderVersion: s.builderVersion,
    runs: s.researchRuns,
    generatedAt: s.generatedAt,
    month,
    monthLabel: MONTH_NAMES[month - 1],
  };
}

/** Seasonal calendar: ingredients at or near peak in each season (availability ≥ 8/9 in its months). */
export function getSeasonalCalendar(): Record<Season, Ingredient[]> {
  const out: Record<Season, Ingredient[]> = { winter: [], spring: [], summer: [], fall: [] };
  const months: Record<Season, number[]> = { winter: [12, 1, 2], spring: [3, 4, 5], summer: [6, 7, 8], fall: [9, 10, 11] };
  for (const i of snapshot().ingredients) {
    if (i.isPantryBasic) continue;
    const a = i.seasonality.availability;
    const spread = Math.max(...a) - Math.min(...a);
    if (spread < 0.3) continue; // year-round items are not 'seasonal'
    for (const season of Object.keys(months) as Season[]) {
      if (months[season].some((m) => a[m - 1] >= 8 / 9 - 1e-9)) out[season].push(i);
    }
  }
  // Most distinctly seasonal first: in-season availability above the item's own yearly mean.
  const strength = (i: Ingredient, s: Season) => {
    const a = i.seasonality.availability;
    const mean = a.reduce((x, y) => x + y, 0) / 12;
    return months[s].reduce((sum, m) => sum + a[m - 1], 0) / 3 - mean;
  };
  for (const k of Object.keys(out) as Season[]) {
    out[k].sort((x, y) => strength(y, k) - strength(x, k) || x.name.localeCompare(y.name));
  }
  return out;
}

/**
 * The nine questions from db/queries/rankings.sql, answered from the snapshot. Same
 * ordering rules as the SQL (tests check the two agree).
 */
export function getRankingAnswers(month = snapshot().referenceMonth) {
  const rows = snapshot().ingredients.filter((i) => !i.isPantryBasic)
    .map((i) => ({ ingredient: i, score: scoreFor(i, month)! })).filter((r) => r.score);
  const byName = (a: RankingRow, b: RankingRow) => a.ingredient.name.localeCompare(b.ingredient.name);
  const top = (list: RankingRow[], cmp: (a: RankingRow, b: RankingRow) => number, n = 10) =>
    [...list].sort((a, b) => cmp(a, b) || byName(a, b)).slice(0, n);
  const local = (r: RankingRow) => (r.ingredient.seasonality.local[month - 1] ? 1 : 0);
  return [
    { key: 'most_affordable', question: 'Which ingredients are most affordable?', metric: 'affordability' as const,
      rows: top(rows, (a, b) => b.score.affordability - a.score.affordability || a.score.costPerServing - b.score.costPerServing) },
    { key: 'most_versatile', question: 'Which are most versatile?', metric: 'versatility' as const,
      rows: top(rows, (a, b) => b.score.versatility - a.score.versatility) },
    { key: 'strongest_nutrition', question: 'Which have the strongest nutrition profile?', metric: 'nutrition' as const,
      rows: top(rows, (a, b) => b.score.nutrition - a.score.nutrition) },
    { key: 'strongest_base_score', question: 'Which have the strongest overall Base Score?', metric: 'baseScore' as const,
      rows: top(rows, (a, b) => b.score.baseScore - a.score.baseScore) },
    { key: 'affordable_and_versatile', question: 'Which combine affordability and versatility best?', metric: 'combined' as const,
      rows: top(rows, (a, b) => Math.round(((b.score.affordability + b.score.versatility) / 2) * 10) - Math.round(((a.score.affordability + a.score.versatility) / 2) * 10)) },
    { key: 'most_stable_price', question: 'Which are most stable in price?', metric: 'priceStability' as const,
      rows: top(rows.filter((r) => r.score.priceStability != null), (a, b) => b.score.priceStability! - a.score.priceStability!) },
    { key: 'most_seasonal_now', question: `Which are most seasonally appropriate in ${MONTH_NAMES[month - 1]}?`, metric: 'availability' as const,
      rows: top(rows, (a, b) => local(b) - local(a) || b.score.availability - a.score.availability) },
    { key: 'next_base_candidates', question: 'Which are strong candidates for the next weekly Base?', metric: 'baseScore' as const,
      rows: top(rows.filter((r) => r.score.classification === 'foundation' && r.score.availability >= 55), (a, b) => b.score.baseScore - a.score.baseScore, 15) },
    { key: 'expression_not_foundation', question: 'Which should be optional add-ons rather than Foundation?', metric: 'affordability' as const,
      rows: top(rows.filter((r) => r.score.classification === 'expression'), (a, b) => a.score.affordability - b.score.affordability, 50) },
  ];
}
