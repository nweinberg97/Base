// Reads the research inputs for every scorable ingredient (pantry basics excluded).
import { all, type Db } from './connection.ts';
import type { ScoringInput, Status } from '../../research/scoring.ts';

export function loadScoringInputs(db: Db, region = 'BC'): ScoringInput[] {
  const rows = all<{
    id: number; slug: string; name: string; category: string; serving_size_g: number;
    price_per_kg: number; price_status: Status;
    calories: number; protein_g: number; fat_g: number; fiber_g: number | null; sodium_mg: number | null; nutrition_status: Status;
  }>(db, `
    SELECT i.id, i.slug, i.name, i.category, i.serving_size_g,
           v.price_per_kg, v.verification_status AS price_status,
           n.calories, n.protein_g, n.fat_g, n.fiber_g, n.sodium_mg, n.verification_status AS nutrition_status
    FROM ingredients i
    JOIN v_price_per_kg v ON v.ingredient_id = i.id AND v.region = ?
    JOIN nutrition n ON n.ingredient_id = i.id
    WHERE i.is_pantry_basic = 0
    ORDER BY i.slug`, region);

  const uses = all<{ ingredient_id: number; slug: string; use_group: 'meal' | 'dish' | 'technique'; verification_status: Status }>(db, `
    SELECT iu.ingredient_id, u.slug, u.use_group, iu.verification_status
    FROM ingredient_use_cases iu JOIN use_cases u ON u.id = iu.use_case_id ORDER BY u.slug`);
  const seasons = all<{ ingredient_id: number; month: number; availability_score: number; verification_status: Status }>(db, `
    SELECT ingredient_id, month, availability_score, verification_status FROM seasonality WHERE region = ? ORDER BY month`, region);
  const history = all<{ ingredient_id: number; price: number; verification_status: Status }>(db, `
    SELECT ingredient_id, price, verification_status FROM price_history WHERE region = ? ORDER BY observed_on`, region);

  return rows.map((r) => {
    const u = uses.filter((x) => x.ingredient_id === r.id);
    const s = seasons.filter((x) => x.ingredient_id === r.id);
    const h = history.filter((x) => x.ingredient_id === r.id);
    if (s.length !== 12) throw new Error(`${r.slug}: expected 12 seasonality rows, found ${s.length}`);
    return {
      id: r.id, slug: r.slug, name: r.name, category: r.category, servingG: r.serving_size_g,
      pricePerKg: r.price_per_kg, priceStatus: r.price_status,
      nutrition: { kcal: r.calories, protein: r.protein_g, fat: r.fat_g, fiber: r.fiber_g, sodium: r.sodium_mg, status: r.nutrition_status },
      uses: u.map((x) => ({ slug: x.slug, group: x.use_group })),
      usesStatus: u[0]?.verification_status ?? 'estimated',
      availability: s.map((x) => x.availability_score),
      seasonalityStatus: s[0].verification_status,
      history: h.map((x) => x.price),
      historyStatus: h[0]?.verification_status ?? 'demo',
    };
  });
}
