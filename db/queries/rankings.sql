-- Ranking queries for the Base Index. Each query is named with "-- name:" and takes two
-- parameters in order: :region and :month. Run them all with `npm run research:report`.
-- They read derived_scores, which `npm run research:rank` rebuilds from source data.
-- Ties always break by ingredient name, so results are deterministic.

-- name: most_affordable
-- 1. Which ingredients are most affordable? (cheapest per serving within their group)
SELECT i.name, i.category, round(d.cost_per_serving, 2) AS cost_per_serving, d.affordability_score
FROM derived_scores d JOIN ingredients i ON i.id = d.ingredient_id
WHERE d.region = ? AND d.reference_month = ?
ORDER BY d.affordability_score DESC, d.cost_per_serving ASC, i.name
LIMIT 10;

-- name: most_versatile
-- 2. Which are most versatile?
SELECT i.name, d.versatility_score,
       (SELECT COUNT(*) FROM ingredient_use_cases u WHERE u.ingredient_id = i.id) AS use_cases
FROM derived_scores d JOIN ingredients i ON i.id = d.ingredient_id
WHERE d.region = ? AND d.reference_month = ?
ORDER BY d.versatility_score DESC, i.name
LIMIT 10;

-- name: strongest_nutrition
-- 3. Which have the strongest nutrition profile (protein and fibre per 100 kcal, less sodium)?
SELECT i.name, d.nutrition_score, n.protein_g, n.fiber_g, n.calories
FROM derived_scores d JOIN ingredients i ON i.id = d.ingredient_id JOIN nutrition n ON n.ingredient_id = i.id
WHERE d.region = ? AND d.reference_month = ?
ORDER BY d.nutrition_score DESC, i.name
LIMIT 10;

-- name: strongest_base_score
-- 4. Which have the strongest overall Base Score?
SELECT i.name, d.base_score, d.classification, d.confidence
FROM derived_scores d JOIN ingredients i ON i.id = d.ingredient_id
WHERE d.region = ? AND d.reference_month = ?
ORDER BY d.base_score DESC, i.name
LIMIT 10;

-- name: affordable_and_versatile
-- 5. Strongest combination of affordability + versatility (simple mean of the two).
SELECT i.name, round((d.affordability_score + d.versatility_score) / 2.0, 1) AS combined,
       d.affordability_score, d.versatility_score
FROM derived_scores d JOIN ingredients i ON i.id = d.ingredient_id
WHERE d.region = ? AND d.reference_month = ?
ORDER BY combined DESC, i.name
LIMIT 10;

-- name: most_stable_price
-- 6. Which are most stable in price? (demo price history; NULL means not enough history)
SELECT i.name, d.price_stability_score
FROM derived_scores d JOIN ingredients i ON i.id = d.ingredient_id
WHERE d.region = ? AND d.reference_month = ? AND d.price_stability_score IS NOT NULL
ORDER BY d.price_stability_score DESC, i.name
LIMIT 10;

-- name: most_seasonal_now
-- 7. Which are most seasonally appropriate this month? Local and at peak first.
SELECT i.name, d.availability_score, s.is_local
FROM derived_scores d
JOIN ingredients i ON i.id = d.ingredient_id
JOIN seasonality s ON s.ingredient_id = i.id AND s.region = d.region AND s.month = d.reference_month
WHERE d.region = ? AND d.reference_month = ?
ORDER BY s.is_local DESC, d.availability_score DESC, i.name
LIMIT 10;

-- name: next_base_candidates
-- 8. Strong candidates for the next weekly Base: Foundation-class and in season.
SELECT i.name, i.category, d.base_score
FROM derived_scores d JOIN ingredients i ON i.id = d.ingredient_id
WHERE d.region = ? AND d.reference_month = ?
  AND d.classification = 'foundation' AND d.availability_score >= 55
ORDER BY d.base_score DESC, i.name
LIMIT 15;

-- name: expression_not_foundation
-- 9. Which should be optional premium add-ons rather than Foundation ingredients?
SELECT i.name, round(d.cost_per_serving, 2) AS cost_per_serving, d.affordability_score, d.nutrition_score,
       n.fat_g, n.sodium_mg
FROM derived_scores d JOIN ingredients i ON i.id = d.ingredient_id JOIN nutrition n ON n.ingredient_id = i.id
WHERE d.region = ? AND d.reference_month = ? AND d.classification = 'expression'
ORDER BY d.affordability_score ASC, i.name;
