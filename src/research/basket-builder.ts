// Deterministic basket construction: turns ingredient scores into a weekly Base.
//
// A good Base is composed, not just "the top 12 scores". The builder fills named slots
// (a protein, a legume, a grain, aromatics, a green, three vegetables, flavour builders)
// so the basket is always useful on its own, then applies variety, storage, rotation and
// budget rules. Same inputs → same basket. Documented in docs/methodology.md.

export const BUILDER_VERSION = 'basket-builder-v1';

export interface Candidate {
  id: number;
  slug: string;
  name: string;
  category: string;
  family: string;
  shelfLifeDays: number;
  servingG: number;
  pricePerKg: number;
  baseScore: number;
  availability: number;       // 0..100 for the basket's month
  peakBonus: number;          // see peakSeasonBonus(); 0 when not at peak
  classification: 'foundation' | 'supporting' | 'expression';
}

export interface SlotDef {
  slot: string;
  label: string;
  count: number;
  servings: number;           // servings per pick for a household of two, for one week
  rotate: boolean;            // apply the rotation penalty for repeating last week
  seasonal?: boolean;         // apply the peak-season bonus (fresh produce slots)
  distinctFamily?: boolean;
  match: (c: Candidate) => boolean;
}

export type Diet = 'omnivore' | 'plant_forward';

export const BUILDER_RULES = {
  minAvailability: 55,        // in season: estimated availability of at least 5/9
  rotationPenalty: 8,         // points subtracted for repeating last week's pick in a rotating slot
  budget: 52,                 // CAD, estimated ingredient cost for a household of two
  longKeepingDays: 7,         // at least one vegetable must keep this long
  peakThreshold: 8 / 9,       // availability at or above this counts as peak season
  peakBonusScale: 12,         // bonus = scale × (max − min availability over the year)
  signatureSpread: 0.6,       // a 'signature' vegetable swings at least this much across the year
};

/**
 * Peak-season bonus: produce at its seasonal peak gets extra points in fresh-produce
 * slots, scaled by how seasonal it is (the spread between its best and worst month).
 * Year-round items such as mushrooms get nothing; a short-season crop at its peak
 * gets the most. This is what makes a summer Base look like summer.
 */
export function peakSeasonBonus(availability: number[], month: number): number {
  const a = availability[month - 1];
  if (a < BUILDER_RULES.peakThreshold - 1e-9) return 0;
  const spread = Math.max(...availability) - Math.min(...availability);
  return Math.round(BUILDER_RULES.peakBonusScale * spread * 10) / 10;
}

const isMeat = (c: Candidate) => c.category === 'protein' && !['eggs', 'soy'].includes(c.family);

export function slotsFor(diet: Diet): SlotDef[] {
  return [
    { slot: 'protein', label: 'Protein', count: 1, servings: 8, rotate: false,
      match: diet === 'omnivore' ? isMeat : (c) => c.category === 'protein' && c.family === 'soy' },
    { slot: 'everyday-protein', label: 'Everyday protein', count: 1, servings: 6, rotate: true,
      match: (c) => c.category === 'protein' && ['eggs', 'soy'].includes(c.family) },
    { slot: 'legume', label: 'Legume', count: 1, servings: 6, rotate: true, match: (c) => c.category === 'legume' },
    { slot: 'grain', label: 'Grain', count: 1, servings: 8, rotate: false, match: (c) => c.category === 'grain' },
    { slot: 'aromatic', label: 'Aromatics', count: 2, servings: 8, rotate: false, match: (c) => c.category === 'aromatic' },
    { slot: 'green', label: 'Greens', count: 1, servings: 6, rotate: true, seasonal: true, match: (c) => c.category === 'green' },
    { slot: 'vegetable', label: 'Vegetables', count: 3, servings: 6, rotate: true, seasonal: true, distinctFamily: true,
      match: (c) => c.category === 'vegetable' },
    { slot: 'fresh-flavor', label: 'Fresh flavour', count: 1, servings: 8, rotate: true, seasonal: true,
      match: (c) => c.category === 'herb' || (c.category === 'fruit' && c.family === 'citrus') },
    { slot: 'rich-flavor', label: 'Flavour builder', count: 1, servings: 6, rotate: true,
      match: (c) => c.category === 'dairy' || c.category === 'pantry' },
  ];
}

export interface BasketPick {
  candidate: Candidate;
  slot: string;
  slotLabel: string;
  quantityG: number;
  estimatedServings: number;
  reason: string;
}

export interface BuildResult {
  picks: BasketPick[];
  ingredientCost: number;
  overBudget: boolean;
  log: string[];              // human-readable decisions, for the research page
}

/** Round a planned quantity to a sensible pack size. */
export function roundQuantity(grams: number): number {
  if (grams >= 200) return Math.round(grams / 50) * 50;
  return Math.max(10, Math.round(grams / 10) * 10);
}

export function quantityFor(c: Candidate, servings: number): { quantityG: number; estimatedServings: number } {
  const quantityG = roundQuantity(c.servingG * servings);
  return { quantityG, estimatedServings: Math.round((quantityG / c.servingG) * 10) / 10 };
}

const cost = (p: { candidate: Candidate; quantityG: number }) => (p.candidate.pricePerKg * p.quantityG) / 1000;

export function buildBasket(
  candidates: Candidate[],
  opts: { diet?: Diet; previous?: string[]; budget?: number } = {},
): BuildResult {
  const diet = opts.diet ?? 'omnivore';
  const previous = new Set(opts.previous ?? []);
  const budget = opts.budget ?? BUILDER_RULES.budget;
  const log: string[] = [];

  const eligible = candidates.filter((c) => {
    if (c.classification === 'expression') return false;
    if (c.availability < BUILDER_RULES.minAvailability) return false;
    if (diet === 'plant_forward' && isMeat(c)) return false;
    return true;
  });
  log.push(`${eligible.length} of ${candidates.length} ingredients are eligible (in season, not Expression${diet === 'plant_forward' ? ', no meat' : ''}).`);

  const slots = slotsFor(diet);
  const effective = (c: Candidate, s: SlotDef) =>
    c.baseScore + (s.seasonal ? c.peakBonus : 0) - (s.rotate && previous.has(c.slug) ? BUILDER_RULES.rotationPenalty : 0);
  const ranked = (s: SlotDef, taken: Set<string>) =>
    eligible
      .filter((c) => s.match(c) && !taken.has(c.slug))
      .sort((a, b) => effective(b, s) - effective(a, s) || a.slug.localeCompare(b.slug));

  const taken = new Set<string>();
  const picks: BasketPick[] = [];

  const makePick = (c: Candidate, s: SlotDef, note: string): BasketPick => {
    const q = quantityFor(c, s.servings);
    const peak = s.seasonal && c.peakBonus > 0 ? `, at its seasonal peak (+${c.peakBonus.toFixed(0)})` : '';
    const rotated = s.rotate && previous.has(c.slug) ? '; repeated from last week despite the rotation penalty' : '';
    return {
      candidate: c, slot: s.slot, slotLabel: s.label, ...q,
      reason: `${note}: Base Score ${c.baseScore.toFixed(0)}, ${c.availability.toFixed(0)}% seasonal availability${peak}${rotated}.`,
    };
  };

  for (const s of slots) {
    const pool = ranked(s, taken);
    const chosen: Candidate[] = [];
    for (const c of pool) {
      if (chosen.length >= s.count) break;
      if (s.distinctFamily && chosen.some((x) => x.family === c.family)) continue;
      chosen.push(c);
    }
    if (chosen.length < s.count) log.push(`Slot "${s.label}" could only be filled ${chosen.length}/${s.count} times.`);
    chosen.forEach((c, i) => {
      taken.add(c.slug);
      const note = s.count > 1 ? `${s.label} pick ${i + 1}` : `Strongest ${s.label.toLowerCase()} this week`;
      picks.push(makePick(c, s, note));
    });
    const skipped = pool.filter((c) => previous.has(c.slug) && s.rotate && !chosen.includes(c)).slice(0, 1);
    for (const c of skipped) log.push(`Rotated out ${c.name} (${s.label.toLowerCase()}) because it was in last week's Base.`);
  }

  // Storage rule: at least one vegetable that keeps a full week.
  const vegSlot = slots.find((s) => s.slot === 'vegetable')!;
  const vegs = picks.filter((p) => p.slot === 'vegetable');
  if (vegs.length && !vegs.some((p) => p.candidate.shelfLifeDays >= BUILDER_RULES.longKeepingDays)) {
    const keeper = ranked(vegSlot, taken).find((c) => c.shelfLifeDays >= BUILDER_RULES.longKeepingDays &&
      !vegs.slice(0, -1).some((p) => p.candidate.family === c.family));
    if (keeper) {
      const out = vegs[vegs.length - 1];
      picks[picks.indexOf(out)] = makePick(keeper, vegSlot, 'Swapped in to keep through the week');
      taken.delete(out.candidate.slug); taken.add(keeper.slug);
      log.push(`Swapped ${out.candidate.name} for ${keeper.name} so at least one vegetable keeps all week.`);
    }
  }

  // Season rule: at least one vegetable that is truly seasonal and at its peak now, so
  // every Base tastes of its season (spread across the year >= signatureSpread).
  const isSignature = (c: Candidate) => c.peakBonus >= BUILDER_RULES.peakBonusScale * BUILDER_RULES.signatureSpread;
  const vegsNow = picks.filter((p) => p.slot === 'vegetable');
  if (vegsNow.length && !vegsNow.some((p) => isSignature(p.candidate))) {
    const signature = ranked(vegSlot, taken).find(isSignature);
    if (signature) {
      // replace the vegetable from the same family if there is one, otherwise the last pick
      const out = vegsNow.find((p) => p.candidate.family === signature.family) ?? vegsNow[vegsNow.length - 1];
      picks[picks.indexOf(out)] = makePick(signature, vegSlot, 'Chosen as this season’s signature vegetable');
      taken.delete(out.candidate.slug); taken.add(signature.slug);
      log.push(`Swapped ${out.candidate.name} for ${signature.name} so the Base includes a vegetable at its seasonal peak.`);
    }
  }

  // Budget rule: swap the priciest rotating pick for the next cheaper option until within budget.
  let total = picks.reduce((s, p) => s + cost(p), 0);
  for (let guard = 0; total > budget && guard < 12; guard++) {
    let best: { index: number; replacement: Candidate; saving: number } | null = null;
    picks.forEach((p, index) => {
      const s = slots.find((x) => x.slot === p.slot)!;
      if (!s.rotate) return;
      const siblings = picks.filter((x) => x.slot === p.slot && x !== p);
      const alt = ranked(s, taken).find((c) =>
        (!s.distinctFamily || !siblings.some((x) => x.candidate.family === c.family)) &&
        cost({ candidate: c, quantityG: quantityFor(c, s.servings).quantityG }) < cost(p));
      if (!alt) return;
      const saving = cost(p) - cost({ candidate: alt, quantityG: quantityFor(alt, s.servings).quantityG });
      if (!best || saving > best.saving) best = { index, replacement: alt, saving };
    });
    if (!best) break;
    const { index, replacement } = best as { index: number; replacement: Candidate; saving: number };
    const out = picks[index];
    const s = slots.find((x) => x.slot === out.slot)!;
    picks[index] = makePick(replacement, s, 'Swapped in to stay within budget');
    taken.delete(out.candidate.slug); taken.add(replacement.slug);
    log.push(`Over budget: swapped ${out.candidate.name} for ${replacement.name}.`);
    total = picks.reduce((sum, p) => sum + cost(p), 0);
  }

  const ingredientCost = Math.round(total * 100) / 100;
  log.push(`Estimated ingredient cost $${ingredientCost.toFixed(2)} against a $${budget} budget.`);
  return { picks, ingredientCost, overBudget: total > budget, log };
}
