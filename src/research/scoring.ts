// Base-derived scores. Everything here is a methodology choice made by Base, not an
// objective measure: the interface labels each score "Base-derived". The weights and
// formulas are documented in docs/methodology.md and must be changed there too.
//
// Pure functions only: no database, no clock, no randomness. Same input, same output.

export const METHODOLOGY_VERSION = 'base-index-v1';

export type Status = 'verified' | 'estimated' | 'demo' | 'derived';

export interface ScoringInput {
  id: number;
  slug: string;
  name: string;
  category: string;
  servingG: number;
  pricePerKg: number;
  priceStatus: Status;
  nutrition: { kcal: number; protein: number; fat: number; fiber: number | null; sodium: number | null; status: Status };
  uses: { slug: string; group: 'meal' | 'dish' | 'technique' }[];
  usesStatus: Status;
  availability: number[];          // 12 values, 0..1, Jan..Dec
  seasonalityStatus: Status;
  history: number[];               // prices in chronological order
  historyStatus: Status;
}

export interface ScoreResult {
  id: number;
  slug: string;
  month: number;
  costPerServing: number;
  affordability: number;
  versatility: number;
  nutrition: number;
  availability: number;
  priceStability: number | null;
  baseScore: number;
  confidence: 'high' | 'medium' | 'low';
  classification: 'foundation' | 'supporting' | 'expression';
}

// --------------------------------------------------------------------- weights
export const BASE_SCORE_WEIGHTS = {
  affordability: 0.3,
  versatility: 0.25,
  nutrition: 0.2,
  availability: 0.15,
  priceStability: 0.1,
} as const;

/** Affordability is compared within groups of foods that do the same job on a plate. */
export const COMPARISON_GROUPS: Record<string, string> = {
  protein: 'protein-foods', legume: 'protein-foods', dairy: 'protein-foods',
  grain: 'staples',
  vegetable: 'produce', green: 'produce', aromatic: 'produce', fruit: 'produce', herb: 'produce',
  pantry: 'produce',   // canned tomatoes and similar compete with fresh produce
};

/** How many uses in each group count as "full coverage" for versatility. */
export const VERSATILITY_TARGETS = { meal: 3, dish: 6, technique: 4 } as const;

const round1 = (x: number) => Math.round(x * 10) / 10;
const clamp = (x: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, x));

export function costPerServing(pricePerKg: number, servingG: number): number {
  if (!(pricePerKg > 0) || !(servingG > 0)) throw new Error('price and serving must be positive');
  return (pricePerKg * servingG) / 1000;
}

/**
 * Affordability: log-scaled position of an ingredient's cost per serving between the
 * cheapest (100) and most expensive (0) ingredient in its comparison group.
 * Log scale, because a $0.30 vs $0.60 serving matters as much as $2 vs $4.
 */
export function affordabilityScores(costs: { slug: string; group: string; cost: number }[]): Map<string, number> {
  const out = new Map<string, number>();
  const groups = new Map<string, number[]>();
  for (const c of costs) groups.set(c.group, [...(groups.get(c.group) ?? []), c.cost]);
  for (const c of costs) {
    const vals = groups.get(c.group)!;
    const lo = Math.log(Math.min(...vals));
    const hi = Math.log(Math.max(...vals));
    out.set(c.slug, hi === lo ? 100 : round1(clamp((100 * (hi - Math.log(c.cost))) / (hi - lo))));
  }
  return out;
}

/**
 * Versatility: 60% breadth (number of documented uses relative to the most versatile
 * ingredient) + 40% diversity (how well the uses cover meals, dishes and techniques).
 */
export function versatilityScore(uses: ScoringInput['uses'], maxUses: number): number {
  if (maxUses <= 0 || uses.length === 0) return 0;
  const count = { meal: 0, dish: 0, technique: 0 };
  for (const u of uses) count[u.group]++;
  const coverage =
    (Math.min(count.meal / VERSATILITY_TARGETS.meal, 1) +
      Math.min(count.dish / VERSATILITY_TARGETS.dish, 1) +
      Math.min(count.technique / VERSATILITY_TARGETS.technique, 1)) / 3;
  return round1(100 * (0.6 * Math.min(uses.length / maxUses, 1) + 0.4 * coverage));
}

/**
 * Nutrition: nutrient density per 100 kcal. Half protein (full marks at 10 g per
 * 100 kcal), half fibre (full marks at 5 g per 100 kcal), minus up to 25 points for
 * sodium (full penalty at 600 mg per 100 kcal). It rewards foods that deliver protein
 * or fibre for their calories; it does not say a food is "healthy" or "unhealthy".
 */
export function nutritionScore(n: ScoringInput['nutrition']): number {
  if (n.kcal <= 0) return 0;
  const per100 = 100 / n.kcal;
  const protein = Math.min((n.protein * per100) / 10, 1);
  const fiber = Math.min(((n.fiber ?? 0) * per100) / 5, 1);
  const sodiumPenalty = 25 * Math.min(((n.sodium ?? 0) * per100) / 600, 1);
  return round1(clamp(100 * (0.5 * protein + 0.5 * fiber) - sodiumPenalty));
}

/** Availability in a month: the estimated BC availability, 0..100. */
export function availabilityScore(availability: number[], month: number): number {
  if (availability.length !== 12) throw new Error('availability needs 12 months');
  return round1(clamp(100 * availability[month - 1]));
}

/**
 * Price stability: 100 when prices never move, 0 when the coefficient of variation
 * reaches 25%. Needs at least 6 observations, otherwise null (not scored).
 */
export function priceStabilityScore(history: number[]): number | null {
  if (history.length < 6) return null;
  const mean = history.reduce((s, x) => s + x, 0) / history.length;
  const sd = Math.sqrt(history.reduce((s, x) => s + (x - mean) ** 2, 0) / history.length);
  return round1(clamp(100 * (1 - sd / mean / 0.25)));
}

/** Weighted composite. Missing components are dropped and the weights renormalised. */
export function baseScore(parts: { affordability: number; versatility: number; nutrition: number; availability: number; priceStability: number | null }): number {
  let total = 0;
  let weight = 0;
  for (const [k, w] of Object.entries(BASE_SCORE_WEIGHTS) as [keyof typeof BASE_SCORE_WEIGHTS, number][]) {
    const v = parts[k];
    if (v === null || v === undefined) continue;
    total += v * w;
    weight += w;
  }
  return round1(total / weight);
}

const STATUS_WEIGHT: Record<Status, number> = { verified: 1, estimated: 0.7, derived: 0.7, demo: 0.4 };

/** Confidence: how much of the input data is verified rather than estimated or demo. */
export function confidence(statuses: Status[]): 'high' | 'medium' | 'low' {
  const mean = statuses.reduce((s, x) => s + STATUS_WEIGHT[x], 0) / statuses.length;
  return mean >= 0.85 ? 'high' : mean >= 0.6 ? 'medium' : 'low';
}

/**
 * Rich foods: more than 65% of calories from fat, or more than 400 mg sodium per 100 g.
 * (Sodium is judged per 100 g here, not per 100 kcal, so very low-calorie foods such as
 * canned tomatoes are not flagged just for having few calories.)
 */
export function isRich(n: ScoringInput['nutrition']): boolean {
  if (n.kcal <= 0) return false;
  const fatShare = (n.fat * 9) / n.kcal;
  return fatShare > 0.65 || (n.sodium ?? 0) > 400;
}

/**
 * Foundation vs Expression. Not every good ingredient belongs in the Base.
 *   expression  — premium per serving (affordability < 15) or rich (see isRich):
 *                 better as an optional add-on
 *   foundation  — base score >= 60, versatility >= 40 and affordability >= 15
 *   supporting  — everything else: useful, rotates in when the season is right
 */
export function classify(s: { affordability: number; versatility: number; baseScore: number }, rich: boolean): ScoreResult['classification'] {
  if (s.affordability < 15 || rich) return 'expression';
  if (s.baseScore >= 60 && s.versatility >= 40) return 'foundation';
  return 'supporting';
}

/** Score every ingredient for one reference month. Pantry basics are excluded upstream. */
export function scoreAll(inputs: ScoringInput[], month: number): ScoreResult[] {
  const costs = inputs.map((i) => ({
    slug: i.slug,
    group: COMPARISON_GROUPS[i.category] ?? i.category,
    cost: costPerServing(i.pricePerKg, i.servingG),
  }));
  const afford = affordabilityScores(costs);
  const maxUses = Math.max(...inputs.map((i) => i.uses.length));

  return inputs
    .map((i) => {
      const affordability = afford.get(i.slug)!;
      const versatility = versatilityScore(i.uses, maxUses);
      const nutrition = nutritionScore(i.nutrition);
      const availability = availabilityScore(i.availability, month);
      const priceStability = priceStabilityScore(i.history);
      const base = baseScore({ affordability, versatility, nutrition, availability, priceStability });
      return {
        id: i.id,
        slug: i.slug,
        month,
        costPerServing: costs.find((c) => c.slug === i.slug)!.cost,
        affordability,
        versatility,
        nutrition,
        availability,
        priceStability,
        baseScore: base,
        confidence: confidence([i.priceStatus, i.nutrition.status, i.seasonalityStatus, i.usesStatus, i.historyStatus]),
        classification: classify({ affordability, versatility, baseScore: base }, isRich(i.nutrition)),
      };
    })
    .sort((a, b) => b.baseScore - a.baseScore || a.slug.localeCompare(b.slug));
}
