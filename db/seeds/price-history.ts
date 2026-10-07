// Deterministic synthetic price history (DEMO data).
//
// Base has no real price series yet. To demonstrate the price-stability method,
// this model generates twelve monthly observations per ingredient, ending at the
// current estimate:
//
//   factor(m) = 1 + volatility × (meanAvailability − availability(m)) + noise(slug, m)
//   price(m)  = currentPrice × factor(m) / factor(lastMonth)
//
// Produce gets cheaper when it is in season and dearer when it is not; staples
// barely move. noise is a fixed hash of slug and month, so every run is identical.
// All rows are stored with verification_status = 'demo'.

import type { IngredientSeed } from './ingredients.ts';

const VOLATILITY: Record<string, number> = {
  vegetable: 0.32, green: 0.3, herb: 0.28, fruit: 0.3, aromatic: 0.18,
  protein: 0.05, legume: 0.03, grain: 0.03, pantry: 0.03, dairy: 0.02,
};

function hashNoise(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 2001) / 1000 - 1; // -1 .. 1
}

export function availability(season: string, month: number): number {
  return Number(season[month - 1]) / 9;
}

/** Months (YYYY-MM-01) of the 12 observations ending at endYear/endMonth inclusive. */
export function historyMonths(endYear: number, endMonth: number): { iso: string; month: number }[] {
  const out: { iso: string; month: number }[] = [];
  for (let k = 11; k >= 0; k--) {
    const d = new Date(Date.UTC(endYear, endMonth - 1 - k, 1));
    out.push({ iso: d.toISOString().slice(0, 10), month: d.getUTCMonth() + 1 });
  }
  return out;
}

export function priceHistory(ing: IngredientSeed, endYear: number, endMonth: number): { observed_on: string; price: number }[] {
  const vol = ing.slug === 'chanterelles' ? 0.5 : (VOLATILITY[ing.category] ?? 0.05);
  const noiseAmp = vol > 0.1 ? 0.03 : 0.012;
  const mean = [...ing.season].reduce((s, d) => s + Number(d) / 9, 0) / 12;
  const factor = (month: number, iso: string) =>
    1 + vol * (mean - availability(ing.season, month)) + noiseAmp * hashNoise(`${ing.slug}:${iso}`);
  const months = historyMonths(endYear, endMonth);
  const last = months[months.length - 1];
  const fLast = factor(last.month, last.iso);
  return months.map(({ iso, month }) => ({
    observed_on: iso,
    price: Math.round((ing.price[0] * factor(month, iso) / fLast) * 100) / 100,
  }));
}
