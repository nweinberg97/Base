// Number formatting. Estimates never get more precision than they deserve.

const cad = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', currencyDisplay: 'narrowSymbol' });

/** $4.18 — exact amounts (prices we set). */
export function money(n: number): string {
  return cad.format(n);
}

/** $56 — whole-dollar amounts. */
export function dollars(n: number): string {
  return cad.format(Math.round(n)).replace(/\.00$/, '');
}

/** ~$4.18 — estimates. */
export function approx(n: number): string {
  return `~${money(n)}`;
}

export function grams(g: number): string {
  if (g >= 1000) return `${(Math.round(g / 100) / 10).toLocaleString('en-CA')} kg`;
  return `${Math.round(g)} g`;
}

export function score(n: number | null | undefined): string {
  return n == null ? '—' : String(Math.round(n));
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function minutes(n: number): string {
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function time12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hr = h % 12 || 12;
  return m ? `${hr}:${String(m).padStart(2, '0')} ${suffix}` : `${hr} ${suffix}`;
}

export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const CATEGORY_LABEL: Record<string, string> = {
  protein: 'Protein', legume: 'Legume', grain: 'Grain', vegetable: 'Vegetable', green: 'Greens', aromatic: 'Aromatic',
  fruit: 'Fruit', dairy: 'Dairy', pantry: 'Pantry', herb: 'Herb',
};

export const STORAGE_LABEL: Record<string, string> = {
  pantry: 'Pantry', cool_dark: 'Cool, dark place', fridge: 'Fridge', freezer: 'Freezer',
};

export const ADD_ON_CATEGORY_LABEL: Record<string, string> = {
  premium_protein: 'Premium protein', flavor: 'Flavour', specialty: 'Specialty', treat: 'Treat',
};

export const CLASS_LABEL: Record<string, string> = {
  foundation: 'Foundation', supporting: 'Supporting', expression: 'Expression',
};

/** Lower-cases the first letter only, so "Greek yogurt" becomes "greek yogurt" but proper nouns inside survive. */
const KEEP_CAPITAL = /^(Greek|Brussels|Swiss|Dijon|Italian|Thai|Japanese)\b/;
export function lowerName(name: string): string {
  if (KEEP_CAPITAL.test(name)) return name;
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/** Capitalises the first letter of a sentence. */
export function sentence(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "a", "a and b", "a, b and c". */
export function joinList(items: readonly string[], conjunction = 'and'): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`;
}
