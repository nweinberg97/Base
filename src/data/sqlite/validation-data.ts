import { all, type Db } from './connection.ts';
import type { ValidationData } from '../../research/validation.ts';

export function loadValidationData(db: Db): ValidationData {
  return {
    sources: all(db, 'SELECT id, slug, name, source_url, source_type, retrieved_at FROM sources'),
    ingredients: all(db, 'SELECT id, slug, name, category, is_pantry_basic, serving_size_g FROM ingredients'),
    conversions: all(db, 'SELECT ingredient_id, unit, grams FROM unit_conversions'),
    nutrition: all(db, 'SELECT ingredient_id, calories, protein_g, carbohydrates_g, fat_g, fiber_g, sodium_mg, source_id, verification_status FROM nutrition'),
    prices: all(db, 'SELECT ingredient_id, price, unit, source_id, verification_status FROM prices'),
    history: all(db, 'SELECT ingredient_id, price, source_id, verification_status FROM price_history'),
    seasonality: all(db, 'SELECT ingredient_id, month, availability_score, source_id, verification_status FROM seasonality'),
    useCases: all(db, 'SELECT ingredient_id, source_id, verification_status FROM ingredient_use_cases'),
    provenance: all(db, 'SELECT ingredient_id, source_id, datum_type, verification_status FROM ingredient_sources'),
    baskets: all(db, 'SELECT id, slug, status FROM baskets'),
    basketItems: all(db, 'SELECT basket_id, ingredient_id, quantity, estimated_servings, slot FROM basket_items'),
    recipes: all(db, 'SELECT id, slug, prep_time_minutes FROM recipes'),
    recipeIngredients: all(db, 'SELECT recipe_id, ingredient_id, add_on_id FROM recipe_ingredients'),
    recipeSteps: all(db, 'SELECT recipe_id FROM recipe_steps'),
    addOns: all(db, 'SELECT id, slug, price, category, seasons, source_id, verification_status FROM add_ons'),
    containers: all(db, 'SELECT id, slug, deposit_amount, purchase_price, capacity_g, cooking_capability, spec_status FROM containers'),
    derivedScores: all(db, 'SELECT ingredient_id, reference_month, base_score FROM derived_scores'),
  };
}
