-- 003 — Views the research queries build on.
--
-- v_price_per_kg normalises every current price to CAD per kilogram, using
-- unit_conversions for prices quoted per dozen, bunch or each.

CREATE VIEW v_price_per_kg AS
SELECT
  p.ingredient_id,
  p.region,
  CASE
    WHEN p.unit = 'kg' THEN p.price
    WHEN p.unit = 'l'  THEN p.price            -- litres treated as kilograms (water-like density)
    ELSE p.price / (uc.grams / 1000.0)
  END AS price_per_kg,
  p.verification_status,
  p.source_id
FROM prices p
LEFT JOIN unit_conversions uc
  ON uc.ingredient_id = p.ingredient_id AND uc.unit = p.unit;

-- Cost of one serving (serving_size_g in purchase form) for every priced ingredient.
CREATE VIEW v_cost_per_serving AS
SELECT
  i.id   AS ingredient_id,
  i.slug,
  v.region,
  v.price_per_kg * i.serving_size_g / 1000.0 AS cost_per_serving,
  v.verification_status
FROM ingredients i
JOIN v_price_per_kg v ON v.ingredient_id = i.id;
