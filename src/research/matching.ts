// Connecting baskets to recipes and add-ons.

export interface RecipeShape {
  slug: string;
  ingredients: { slug: string; optional: boolean; pantryBasic: boolean }[];
}

/**
 * A recipe "uses this week's Base" when every required, non-pantry ingredient is in
 * the basket. Returns how many basket ingredients it uses, or null if it doesn't fit.
 */
export function recipeFit(recipe: RecipeShape, basketSlugs: Set<string>): number | null {
  const required = recipe.ingredients.filter((i) => !i.optional && !i.pantryBasic);
  if (!required.length) return null;
  if (!required.every((i) => basketSlugs.has(i.slug))) return null;
  return new Set(recipe.ingredients.filter((i) => basketSlugs.has(i.slug)).map((i) => i.slug)).size;
}

export interface AddOnShape { slug: string; category: string; seasons: string[]; status: string; pairs: string[]; price: number }

/**
 * Suggest add-ons for a basket: in season, ranked by how many basket ingredients they
 * pair with, keeping at least one per category where possible.
 */
export function suggestAddOns(addOns: AddOnShape[], basketSlugs: Set<string>, season: string, limit = 6) {
  const scored = addOns
    .filter((a) => a.seasons.includes(season) && a.status !== 'sold_out')
    .map((a) => ({ addOn: a, matches: a.pairs.filter((p) => basketSlugs.has(p)) }))
    .sort((x, y) => y.matches.length - x.matches.length || x.addOn.price - y.addOn.price || x.addOn.slug.localeCompare(y.addOn.slug));
  const picked: typeof scored = [];
  for (const cat of ['premium_protein', 'flavor', 'specialty', 'treat']) {
    const first = scored.find((s) => s.addOn.category === cat);
    if (first) picked.push(first);
  }
  for (const s of scored) {
    if (picked.length >= limit) break;
    if (!picked.includes(s)) picked.push(s);
  }
  const order = (s: (typeof scored)[number]) => scored.indexOf(s);
  return picked.slice(0, limit).sort((a, b) => order(a) - order(b));
}
