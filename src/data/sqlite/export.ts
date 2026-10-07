// SQLite → DataSnapshot. The only place that knows both the table layout and the
// snapshot shape. Swapping SQLite for a hosted database means rewriting this file
// (or replacing it with an API), not the storefront.
import { all, get, type Db } from './connection.ts';
import type {
  AddOn, Photo, Basket, Container, ContainerAccount, DataSnapshot, Ingredient, MonthScore, PickupLocation, Recipe, ResearchRun,
  Source, Supplier, UseCase, VerificationStatus,
} from '../types.ts';
import { METHODOLOGY_VERSION } from '../../research/scoring.ts';
import { BUILDER_VERSION } from '../../research/basket-builder.ts';

type Row = Record<string, any>;

export function exportSnapshot(db: Db, opts: { region?: string; weekOf: string; referenceMonth: number }): DataSnapshot {
  const region = opts.region ?? 'BC';

  const sources: Source[] = all<Row>(db, 'SELECT * FROM sources ORDER BY id').map((s) => ({
    id: s.id, slug: s.slug, name: s.name, url: s.source_url, type: s.source_type, region: s.region,
    retrievedAt: s.retrieved_at, description: s.description ?? '',
  }));

  const suppliers: Supplier[] = all<Row>(db, 'SELECT * FROM suppliers ORDER BY id').map((s) => ({
    id: s.id, slug: s.slug, name: s.name, region: s.region, type: s.supplier_type, status: s.verification_status, notes: s.notes ?? '',
  }));

  const useCases: UseCase[] = all<Row>(db, 'SELECT slug, name, use_group FROM use_cases ORDER BY id')
    .map((u) => ({ slug: u.slug, name: u.name, group: u.use_group }));

  const nutrition = new Map(all<Row>(db, 'SELECT * FROM nutrition').map((n) => [n.ingredient_id, n]));
  const prices = new Map(all<Row>(db, `SELECT p.*, v.price_per_kg FROM prices p
    JOIN v_price_per_kg v ON v.ingredient_id = p.ingredient_id AND v.region = p.region WHERE p.region = ?`, region)
    .map((p) => [p.ingredient_id, p]));
  const history = all<Row>(db, 'SELECT * FROM price_history WHERE region = ? ORDER BY observed_on', region);
  const seasons = all<Row>(db, 'SELECT * FROM seasonality WHERE region = ? ORDER BY month', region);
  const uses = all<Row>(db, `SELECT iu.ingredient_id, iu.source_id, u.slug FROM ingredient_use_cases iu
    JOIN use_cases u ON u.id = iu.use_case_id ORDER BY u.id`);
  const prov = all<Row>(db, 'SELECT * FROM ingredient_sources ORDER BY datum_type');
  const scores = all<Row>(db, 'SELECT * FROM derived_scores WHERE region = ? ORDER BY reference_month', region);

  const photoRows = all<Row>(db, 'SELECT * FROM photos');
  const toPhoto = (r: Row | undefined): Photo | null => (r ? {
    src: `/${r.file}`, srcSquare: `/${r.file_square}`, width: r.width, height: r.height, alt: r.alt, title: r.title,
    author: r.author, license: r.license, licenseUrl: r.license_url, sourceUrl: r.source_url, sourceId: r.source_id,
  } : null);

  const ingredients: Ingredient[] = all<Row>(db, 'SELECT * FROM ingredients ORDER BY name').map((i) => {
    const n = nutrition.get(i.id);
    const p = prices.get(i.id);
    if (!n || !p) throw new Error(`Ingredient ${i.slug} is missing nutrition or price`);
    const h = history.filter((x) => x.ingredient_id === i.id);
    const s = seasons.filter((x) => x.ingredient_id === i.id);
    const u = uses.filter((x) => x.ingredient_id === i.id);
    const sc: MonthScore[] = scores.filter((x) => x.ingredient_id === i.id).map((x) => ({
      month: x.reference_month, costPerServing: x.cost_per_serving, affordability: x.affordability_score,
      versatility: x.versatility_score, nutrition: x.nutrition_score, availability: x.availability_score,
      priceStability: x.price_stability_score, baseScore: x.base_score, confidence: x.confidence, classification: x.classification,
    }));
    return {
      id: i.id, slug: i.slug, name: i.name, description: i.description, category: i.category, family: i.family,
      defaultUnit: i.default_unit, storageType: i.storage_type, shelfLifeDays: i.shelf_life_days, servingSizeG: i.serving_size_g,
      purchaseForm: i.purchase_form, prepForm: i.prep_form, needsContainer: i.needs_container === 1,
      isPantryBasic: i.is_pantry_basic === 1, why: i.editorial_why,
      visual: { color: i.visual_color, accent: i.visual_accent, texture: i.visual_texture },
      photo: toPhoto(photoRows.find((x) => x.ingredient_id === i.id)),
      nutrition: {
        calories: n.calories, protein: n.protein_g, carbohydrates: n.carbohydrates_g, fat: n.fat_g, fiber: n.fiber_g,
        sodium: n.sodium_mg, sourceId: n.source_id, status: n.verification_status, notes: n.notes,
      },
      price: {
        price: p.price, unit: p.unit, pricePerKg: Math.round(p.price_per_kg * 100) / 100, date: p.price_date,
        supplierId: p.supplier_id, sourceId: p.source_id, status: p.verification_status, notes: p.notes,
      },
      history: h.map((x) => ({ date: x.observed_on, price: x.price })),
      historyStatus: (h[0]?.verification_status ?? 'demo') as VerificationStatus,
      historySourceId: h[0]?.source_id ?? 0,
      seasonality: {
        availability: s.map((x) => x.availability_score), local: s.map((x) => x.is_local === 1),
        sourceId: s[0]?.source_id ?? 0, status: (s[0]?.verification_status ?? 'estimated') as VerificationStatus,
      },
      useCases: u.map((x) => x.slug),
      useCasesSourceId: u[0]?.source_id ?? null,
      provenance: prov.filter((x) => x.ingredient_id === i.id).map((x) => ({
        datumType: x.datum_type, sourceId: x.source_id, status: x.verification_status, collectedAt: x.collected_at, notes: x.notes,
      })),
      scores: sc,
    };
  });

  const items = all<Row>(db, 'SELECT * FROM basket_items ORDER BY position');
  const bconts = all<Row>(db, 'SELECT * FROM basket_containers ORDER BY container_id');
  const badds = all<Row>(db, 'SELECT * FROM basket_add_ons ORDER BY position');
  const brecipes = all<Row>(db, 'SELECT * FROM recipe_baskets ORDER BY base_ingredients_used DESC, recipe_id');
  const statusOrder = "CASE status WHEN 'current' THEN 0 WHEN 'upcoming' THEN 1 WHEN 'archived' THEN 2 ELSE 3 END";
  const baskets: Basket[] = all<Row>(db, `SELECT * FROM baskets ORDER BY ${statusOrder}, basket_type, week_of, id`).map((b) => ({
    id: b.id, slug: b.slug, name: b.name, description: b.description, type: b.basket_type, region: b.region, season: b.season,
    referenceMonth: b.reference_month, weekOf: b.week_of, status: b.status, householdSize: b.household_size, diet: b.diet,
    generatedBy: b.generated_by,
    items: items.filter((x) => x.basket_id === b.id).map((x) => ({
      ingredientId: x.ingredient_id, quantityG: x.quantity, estimatedServings: x.estimated_servings, slot: x.slot,
      position: x.position, reason: x.selection_reason,
    })),
    containers: bconts.filter((x) => x.basket_id === b.id).map((x) => ({ containerId: x.container_id, quantity: x.quantity })),
    addOns: badds.filter((x) => x.basket_id === b.id).map((x) => ({ addOnId: x.add_on_id, reason: x.reason })),
    recipes: brecipes.filter((x) => x.basket_id === b.id).map((x) => ({ recipeId: x.recipe_id, baseIngredientsUsed: x.base_ingredients_used })),
  }));

  const addOns: AddOn[] = all<Row>(db, 'SELECT * FROM add_ons ORDER BY id').map((a) => ({
    id: a.id, slug: a.slug, name: a.name, description: a.description, category: a.category, price: a.price, unit: a.unit,
    ingredientId: a.ingredient_id, seasons: a.seasons.split(','), status: a.status, sourceId: a.source_id,
    verificationStatus: a.verification_status, pairsWith: a.pairs_with,
    photo: toPhoto(photoRows.find((x) => x.add_on_id === a.id)),
  }));

  const lines = all<Row>(db, 'SELECT * FROM recipe_ingredients ORDER BY id');
  const steps = all<Row>(db, 'SELECT * FROM recipe_steps ORDER BY position');
  const recipes: Recipe[] = all<Row>(db, 'SELECT * FROM recipes ORDER BY id').map((r) => ({
    id: r.id, slug: r.slug, name: r.name, description: r.description, creatorName: r.creator_name,
    creatorIsDemo: r.creator_is_demo === 1, prepTimeMinutes: r.prep_time_minutes, difficulty: r.difficulty, servings: r.servings,
    tags: r.tags ? r.tags.split(',') : [], upgradeNote: r.upgrade_note, verificationStatus: r.verification_status,
    lines: lines.filter((x) => x.recipe_id === r.id).map((x) => ({
      ingredientId: x.ingredient_id, addOnId: x.add_on_id, quantity: x.quantity, unit: x.unit, optional: x.is_optional === 1, note: x.note,
    })),
    steps: steps.filter((x) => x.recipe_id === r.id).map((x) => x.text),
  }));

  const containers: Container[] = all<Row>(db, 'SELECT * FROM containers ORDER BY size_ml').map((c) => ({
    id: c.id, slug: c.slug, name: c.name, sizeMl: c.size_ml, capacityG: c.capacity_g, material: c.material,
    ownershipModel: c.ownership_model, deposit: c.deposit_amount, purchasePrice: c.purchase_price,
    cookingCapability: c.cooking_capability, specStatus: c.spec_status, sourceId: c.source_id,
    verificationStatus: c.verification_status, notes: c.notes,
  }));

  const windows = all<Row>(db, 'SELECT * FROM pickup_windows ORDER BY weekday = 0, weekday, start_time');
  const pickupLocations: PickupLocation[] = all<Row>(db, 'SELECT * FROM pickup_locations ORDER BY id').map((l) => ({
    id: l.id, slug: l.slug, name: l.name, neighbourhood: l.neighbourhood, city: l.city, isDemo: l.is_demo === 1,
    description: l.description,
    windows: windows.filter((w) => w.location_id === l.id).map((w) => ({ weekday: w.weekday, start: w.start_time, end: w.end_time, notes: w.notes })),
  }));

  const acct = get<Row>(db, 'SELECT * FROM container_accounts ORDER BY id LIMIT 1');
  const containerAccount: ContainerAccount | null = acct ? {
    memberRef: acct.member_ref, isDemo: acct.is_demo === 1,
    lines: all<Row>(db, 'SELECT * FROM container_account_lines WHERE account_id = ?', acct.id)
      .map((l) => ({ containerId: l.container_id, borrowed: l.borrowed, returned: l.returned, owned: l.owned })),
  } : null;

  const researchRuns: ResearchRun[] = all<Row>(db, 'SELECT * FROM research_runs ORDER BY id DESC').map((r) => ({
    kind: r.kind, methodologyVersion: r.methodology_version, parameters: JSON.parse(r.parameters), ranAt: r.ran_at,
  }));

  const count = (t: string) => (get<{ n: number }>(db, `SELECT COUNT(*) AS n FROM ${t}`)?.n ?? 0);
  const counts = Object.fromEntries(['ingredients', 'sources', 'suppliers', 'prices', 'price_history', 'nutrition', 'seasonality',
    'ingredient_use_cases', 'baskets', 'add_ons', 'recipes', 'containers', 'derived_scores'].map((t) => [t, count(t)]));

  return {
    generatedAt: new Date().toISOString(), region, weekOf: opts.weekOf, referenceMonth: opts.referenceMonth,
    methodologyVersion: METHODOLOGY_VERSION, builderVersion: BUILDER_VERSION,
    sources, suppliers, useCases, ingredients, baskets, addOns, recipes, containers, pickupLocations, containerAccount,
    researchRuns, counts,
  };
}
