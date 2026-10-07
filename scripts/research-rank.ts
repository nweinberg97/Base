// npm run research:rank — recompute every derived score from the source data.
// Writes derived_scores for all 12 reference months. Never edit that table by hand.
import { openDb, transaction } from '../src/data/sqlite/connection.ts';
import { loadScoringInputs } from '../src/data/sqlite/research-inputs.ts';
import { METHODOLOGY_VERSION, scoreAll, BASE_SCORE_WEIGHTS } from '../src/research/scoring.ts';
import { referenceMonth } from '../src/research/calendar.ts';

const REGION = 'BC';
const db = openDb();
const inputs = loadScoringInputs(db, REGION);
const computedAt = new Date().toISOString();

transaction(db, () => {
  db.prepare('DELETE FROM derived_scores WHERE region = ?').run(REGION);
  const ins = db.prepare(`INSERT INTO derived_scores (ingredient_id, region, reference_month, cost_per_serving, affordability_score,
    versatility_score, nutrition_score, availability_score, price_stability_score, base_score, confidence, classification,
    methodology_version, computed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (let month = 1; month <= 12; month++) {
    for (const s of scoreAll(inputs, month)) {
      ins.run(s.id, REGION, month, s.costPerServing, s.affordability, s.versatility, s.nutrition, s.availability,
        s.priceStability, s.baseScore, s.confidence, s.classification, METHODOLOGY_VERSION, computedAt);
    }
  }
  db.prepare('INSERT INTO research_runs (kind, methodology_version, parameters, ran_at) VALUES (?, ?, ?, ?)')
    .run('rank', METHODOLOGY_VERSION, JSON.stringify({ region: REGION, weights: BASE_SCORE_WEIGHTS, ingredients: inputs.length }), computedAt);
});

const month = referenceMonth();
const top = scoreAll(inputs, month).slice(0, 12);
console.log(`Scored ${inputs.length} ingredients × 12 months (${METHODOLOGY_VERSION}). Top for month ${month}:`);
for (const s of top) {
  console.log(`  ${s.baseScore.toFixed(1).padStart(5)}  ${s.slug.padEnd(20)} afford ${s.affordability.toFixed(0).padStart(3)}  vers ${s.versatility.toFixed(0).padStart(3)}  nutr ${s.nutrition.toFixed(0).padStart(3)}  avail ${s.availability.toFixed(0).padStart(3)}  stab ${String(s.priceStability?.toFixed(0) ?? '—').padStart(3)}  ${s.classification}`);
}
db.close();
