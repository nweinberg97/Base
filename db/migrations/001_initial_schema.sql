-- 001 — Initial schema for Base.
--
-- Two ideas run through every table:
--   1. A SUPPLIER is where food (or a price) comes from. A SOURCE is where a piece of
--      information comes from. They are separate tables and never collapsed.
--   2. Every externally sourced datum carries a source_id and a verification_status:
--        verified  — directly supported by the cited source
--        estimated — a reasonable estimate from a documented method
--        demo      — placeholder data that only demonstrates the interface
--        derived   — calculated by Base from other data
--
-- Units: money is CAD; weights are grams unless a column says otherwise.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Information sources and suppliers
-- ---------------------------------------------------------------------------

CREATE TABLE sources (
  id            INTEGER PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  source_url    TEXT NOT NULL CHECK (length(trim(source_url)) > 0),
  source_type   TEXT NOT NULL CHECK (source_type IN (
                  'government_statistics', 'nutrition_database', 'editorial',
                  'demo_model', 'internal_spec', 'community')),
  region        TEXT NOT NULL,
  retrieved_at  TEXT NOT NULL,                 -- ISO date the information was collected
  description   TEXT,
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
  id                  INTEGER PRIMARY KEY,
  slug                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  region              TEXT NOT NULL,
  website             TEXT,
  supplier_type       TEXT NOT NULL CHECK (supplier_type IN ('farm', 'producer', 'distributor', 'wholesaler')),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'estimated', 'demo')),
  notes               TEXT
);

-- ---------------------------------------------------------------------------
-- Ingredients
-- ---------------------------------------------------------------------------

CREATE TABLE ingredients (
  id               INTEGER PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  category         TEXT NOT NULL CHECK (category IN (
                     'protein', 'legume', 'grain', 'vegetable', 'green', 'aromatic',
                     'fruit', 'dairy', 'pantry', 'herb')),
  family           TEXT NOT NULL,              -- botanical/culinary family, used for variety rules
  default_unit     TEXT NOT NULL CHECK (default_unit IN ('g', 'kg', 'each', 'bunch', 'dozen', 'ml', 'l')),
  storage_type     TEXT NOT NULL CHECK (storage_type IN ('pantry', 'cool_dark', 'fridge', 'freezer')),
  shelf_life_days  INTEGER NOT NULL CHECK (shelf_life_days > 0),
  serving_size_g   REAL NOT NULL CHECK (serving_size_g > 0),   -- one serving, in the form it is sold
  purchase_form    TEXT NOT NULL,              -- the form prices and nutrition refer to, e.g. 'dry', 'raw'
  prep_form        TEXT NOT NULL,              -- how Base hands it over, e.g. 'washed and cut into wedges'
  needs_container  INTEGER NOT NULL DEFAULT 1 CHECK (needs_container IN (0, 1)),
  is_pantry_basic  INTEGER NOT NULL DEFAULT 0 CHECK (is_pantry_basic IN (0, 1)),
  editorial_why    TEXT NOT NULL,              -- 'Why Base likes it' — editorial, not data
  visual_color     TEXT NOT NULL,              -- for the bowl-from-above illustration
  visual_accent    TEXT NOT NULL,
  visual_texture   TEXT NOT NULL CHECK (visual_texture IN (
                     'grains', 'beans', 'chunks', 'wedges', 'leaves', 'rings', 'slices',
                     'florets', 'cream', 'cubes', 'strands', 'berries', 'cloves', 'whole', 'shreds')),
  created_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Weight of non-gram units ('a dozen eggs', 'a bunch of kale') for cost normalisation.
CREATE TABLE unit_conversions (
  ingredient_id  INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  unit           TEXT NOT NULL,
  grams          REAL NOT NULL CHECK (grams > 0),
  PRIMARY KEY (ingredient_id, unit)
);

-- Which sources inform which facts about an ingredient.
CREATE TABLE ingredient_sources (
  ingredient_id        INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  source_id            INTEGER NOT NULL REFERENCES sources(id),
  datum_type           TEXT NOT NULL CHECK (datum_type IN ('nutrition', 'price', 'price_history', 'seasonality', 'use_cases', 'description')),
  verification_status  TEXT NOT NULL CHECK (verification_status IN ('verified', 'estimated', 'demo')),
  collected_at         TEXT NOT NULL,
  notes                TEXT,
  PRIMARY KEY (ingredient_id, source_id, datum_type)
);

-- Nutrition per serving_size_g (100 g) of the ingredient in its purchase_form.
CREATE TABLE nutrition (
  id                   INTEGER PRIMARY KEY,
  ingredient_id        INTEGER NOT NULL UNIQUE REFERENCES ingredients(id) ON DELETE CASCADE,
  serving_size         TEXT NOT NULL DEFAULT '100 g',
  serving_size_g       REAL NOT NULL DEFAULT 100 CHECK (serving_size_g > 0),
  calories             REAL NOT NULL CHECK (calories BETWEEN 0 AND 900),
  protein_g            REAL NOT NULL CHECK (protein_g >= 0),
  carbohydrates_g      REAL NOT NULL CHECK (carbohydrates_g >= 0),
  fat_g                REAL NOT NULL CHECK (fat_g >= 0),
  fiber_g              REAL CHECK (fiber_g >= 0),
  sodium_mg            REAL CHECK (sodium_mg >= 0),
  source_id            INTEGER NOT NULL REFERENCES sources(id),
  verification_status  TEXT NOT NULL CHECK (verification_status IN ('verified', 'estimated', 'demo')),
  collected_at         TEXT NOT NULL,
  notes                TEXT,
  -- protein + carbohydrate + fat cannot exceed the serving weight
  CHECK (protein_g + carbohydrates_g + fat_g <= serving_size_g * 1.02)
);

-- ---------------------------------------------------------------------------
-- Prices (current) and price history (observations over time) — kept separate
-- ---------------------------------------------------------------------------

CREATE TABLE prices (
  id                   INTEGER PRIMARY KEY,
  ingredient_id        INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  supplier_id          INTEGER REFERENCES suppliers(id),
  source_id            INTEGER NOT NULL REFERENCES sources(id),
  region               TEXT NOT NULL,
  price                REAL NOT NULL CHECK (price > 0),
  unit                 TEXT NOT NULL CHECK (unit IN ('kg', 'dozen', 'bunch', 'each', 'l')),
  currency             TEXT NOT NULL DEFAULT 'CAD' CHECK (currency = 'CAD'),
  price_date           TEXT NOT NULL,
  verification_status  TEXT NOT NULL CHECK (verification_status IN ('verified', 'estimated', 'demo')),
  notes                TEXT,
  UNIQUE (ingredient_id, region)
);

CREATE TABLE price_history (
  id                   INTEGER PRIMARY KEY,
  ingredient_id        INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  source_id            INTEGER NOT NULL REFERENCES sources(id),
  region               TEXT NOT NULL,
  price                REAL NOT NULL CHECK (price > 0),
  unit                 TEXT NOT NULL,
  currency             TEXT NOT NULL DEFAULT 'CAD',
  observed_on          TEXT NOT NULL,
  verification_status  TEXT NOT NULL CHECK (verification_status IN ('verified', 'estimated', 'demo')),
  UNIQUE (ingredient_id, region, observed_on)
);

-- ---------------------------------------------------------------------------
-- Seasonality and culinary use
-- ---------------------------------------------------------------------------

CREATE TABLE seasonality (
  ingredient_id        INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  region               TEXT NOT NULL,
  month                INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  availability_score   REAL NOT NULL CHECK (availability_score BETWEEN 0 AND 1),
  is_local             INTEGER NOT NULL CHECK (is_local IN (0, 1)),  -- grown/produced in-region in this month
  source_id            INTEGER NOT NULL REFERENCES sources(id),
  verification_status  TEXT NOT NULL CHECK (verification_status IN ('verified', 'estimated', 'demo')),
  PRIMARY KEY (ingredient_id, region, month)
);

CREATE TABLE use_cases (
  id         INTEGER PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  use_group  TEXT NOT NULL CHECK (use_group IN ('meal', 'dish', 'technique'))
);

CREATE TABLE ingredient_use_cases (
  ingredient_id        INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  use_case_id          INTEGER NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  source_id            INTEGER NOT NULL REFERENCES sources(id),
  verification_status  TEXT NOT NULL CHECK (verification_status IN ('verified', 'estimated', 'demo')),
  PRIMARY KEY (ingredient_id, use_case_id)
);

-- ---------------------------------------------------------------------------
-- Baskets
-- ---------------------------------------------------------------------------

CREATE TABLE baskets (
  id              INTEGER PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  basket_type     TEXT NOT NULL CHECK (basket_type IN ('weekly', 'seasonal', 'variant')),
  region          TEXT NOT NULL,
  season          TEXT NOT NULL CHECK (season IN ('winter', 'spring', 'summer', 'fall')),
  reference_month INTEGER NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
  week_of         TEXT,                        -- Monday of the week, for weekly baskets
  status          TEXT NOT NULL CHECK (status IN ('current', 'upcoming', 'archived', 'template')),
  household_size  INTEGER NOT NULL DEFAULT 2 CHECK (household_size > 0),
  diet            TEXT NOT NULL DEFAULT 'omnivore' CHECK (diet IN ('omnivore', 'plant_forward')),
  generated_by    TEXT NOT NULL,               -- which builder version produced it
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE basket_items (
  basket_id           INTEGER NOT NULL REFERENCES baskets(id) ON DELETE CASCADE,
  ingredient_id       INTEGER NOT NULL REFERENCES ingredients(id),
  quantity            REAL NOT NULL CHECK (quantity > 0),
  unit                TEXT NOT NULL CHECK (unit IN ('g')),
  estimated_servings  REAL NOT NULL CHECK (estimated_servings > 0),
  slot                TEXT NOT NULL,           -- the role it fills: protein, legume, grain, ...
  position            INTEGER NOT NULL,
  selection_reason    TEXT NOT NULL,
  PRIMARY KEY (basket_id, ingredient_id)
);

-- ---------------------------------------------------------------------------
-- Expression: optional add-ons
-- ---------------------------------------------------------------------------

CREATE TABLE add_ons (
  id                   INTEGER PRIMARY KEY,
  slug                 TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  description          TEXT NOT NULL,
  category             TEXT NOT NULL CHECK (category IN ('premium_protein', 'flavor', 'specialty', 'treat')),
  price                REAL NOT NULL CHECK (price > 0),
  unit                 TEXT NOT NULL,          -- e.g. '300 g', '250 ml jar'
  ingredient_id        INTEGER REFERENCES ingredients(id),
  seasons              TEXT NOT NULL DEFAULT 'winter,spring,summer,fall',
  status               TEXT NOT NULL CHECK (status IN ('available', 'seasonal', 'sold_out')),
  source_id            INTEGER NOT NULL REFERENCES sources(id),
  verification_status  TEXT NOT NULL CHECK (verification_status IN ('verified', 'estimated', 'demo')),
  pairs_with           TEXT                    -- short editorial note
);

CREATE TABLE basket_add_ons (
  basket_id  INTEGER NOT NULL REFERENCES baskets(id) ON DELETE CASCADE,
  add_on_id  INTEGER NOT NULL REFERENCES add_ons(id),
  reason     TEXT NOT NULL,
  position   INTEGER NOT NULL,
  PRIMARY KEY (basket_id, add_on_id)
);

-- ---------------------------------------------------------------------------
-- Community recipes
-- ---------------------------------------------------------------------------

CREATE TABLE recipes (
  id                   INTEGER PRIMARY KEY,
  slug                 TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  description          TEXT NOT NULL,
  creator_name         TEXT NOT NULL,
  creator_is_demo      INTEGER NOT NULL DEFAULT 1 CHECK (creator_is_demo IN (0, 1)),
  status               TEXT NOT NULL CHECK (status IN ('published', 'draft')),
  prep_time_minutes    INTEGER NOT NULL CHECK (prep_time_minutes > 0),
  difficulty           TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'involved')),
  servings             INTEGER NOT NULL CHECK (servings > 0),
  tags                 TEXT NOT NULL DEFAULT '',  -- comma separated
  upgrade_note         TEXT,                      -- 'Add the herb sauce for an optional upgrade.'
  created_at           TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verification_status  TEXT NOT NULL CHECK (verification_status IN ('verified', 'estimated', 'demo'))
);

CREATE TABLE recipe_steps (
  recipe_id  INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position   INTEGER NOT NULL,
  text       TEXT NOT NULL,
  PRIMARY KEY (recipe_id, position)
);

CREATE TABLE recipe_ingredients (
  id             INTEGER PRIMARY KEY,
  recipe_id      INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id  INTEGER REFERENCES ingredients(id),
  add_on_id      INTEGER REFERENCES add_ons(id),
  quantity       REAL,
  unit           TEXT,
  is_optional    INTEGER NOT NULL DEFAULT 0 CHECK (is_optional IN (0, 1)),
  note           TEXT,
  CHECK ((ingredient_id IS NULL) <> (add_on_id IS NULL))   -- exactly one of the two
);

-- Which recipes can be cooked from which basket (computed by the basket builder).
CREATE TABLE recipe_baskets (
  recipe_id               INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  basket_id               INTEGER NOT NULL REFERENCES baskets(id) ON DELETE CASCADE,
  base_ingredients_used   INTEGER NOT NULL CHECK (base_ingredients_used > 0),
  PRIMARY KEY (recipe_id, basket_id)
);

-- ---------------------------------------------------------------------------
-- Reusable containers
-- ---------------------------------------------------------------------------

CREATE TABLE containers (
  id                   INTEGER PRIMARY KEY,
  slug                 TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  size_ml              INTEGER NOT NULL CHECK (size_ml > 0),
  capacity_g           INTEGER NOT NULL CHECK (capacity_g > 0),  -- planning capacity for prepped food
  material             TEXT NOT NULL,
  ownership_model      TEXT NOT NULL CHECK (ownership_model IN ('borrow', 'own', 'borrow_or_own')),
  deposit_amount       REAL NOT NULL CHECK (deposit_amount >= 0),
  purchase_price       REAL NOT NULL CHECK (purchase_price > 0),
  cooking_capability   TEXT NOT NULL,          -- never a safety claim without a verified spec
  spec_status          TEXT NOT NULL CHECK (spec_status IN ('pending', 'verified')),
  source_id            INTEGER NOT NULL REFERENCES sources(id),
  verification_status  TEXT NOT NULL CHECK (verification_status IN ('verified', 'estimated', 'demo')),
  notes                TEXT
);

CREATE TABLE basket_containers (
  basket_id     INTEGER NOT NULL REFERENCES baskets(id) ON DELETE CASCADE,
  container_id  INTEGER NOT NULL REFERENCES containers(id),
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (basket_id, container_id)
);

-- ---------------------------------------------------------------------------
-- Pickup
-- ---------------------------------------------------------------------------

CREATE TABLE pickup_locations (
  id            INTEGER PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  city          TEXT NOT NULL,
  is_demo       INTEGER NOT NULL DEFAULT 1 CHECK (is_demo IN (0, 1)),
  description   TEXT NOT NULL
);

CREATE TABLE pickup_windows (
  id           INTEGER PRIMARY KEY,
  location_id  INTEGER NOT NULL REFERENCES pickup_locations(id) ON DELETE CASCADE,
  weekday      INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),   -- 0 = Sunday
  start_time   TEXT NOT NULL,
  end_time     TEXT NOT NULL,
  notes        TEXT
);

-- ---------------------------------------------------------------------------
-- Derived research outputs. Never edited by hand: written only by
-- scripts/research-rank.ts using src/research/scoring.ts.
-- ---------------------------------------------------------------------------

CREATE TABLE derived_scores (
  ingredient_id          INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  region                 TEXT NOT NULL,
  reference_month        INTEGER NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
  cost_per_serving       REAL NOT NULL,
  affordability_score    REAL NOT NULL CHECK (affordability_score BETWEEN 0 AND 100),
  versatility_score      REAL NOT NULL CHECK (versatility_score BETWEEN 0 AND 100),
  nutrition_score        REAL NOT NULL CHECK (nutrition_score BETWEEN 0 AND 100),
  availability_score     REAL NOT NULL CHECK (availability_score BETWEEN 0 AND 100),
  price_stability_score  REAL,                 -- NULL when there is not enough history
  base_score             REAL NOT NULL CHECK (base_score BETWEEN 0 AND 100),
  confidence             TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  classification         TEXT NOT NULL CHECK (classification IN ('foundation', 'supporting', 'expression')),
  methodology_version    TEXT NOT NULL,
  computed_at            TEXT NOT NULL,
  PRIMARY KEY (ingredient_id, region, reference_month)
);

CREATE TABLE research_runs (
  id                   INTEGER PRIMARY KEY,
  kind                 TEXT NOT NULL CHECK (kind IN ('rank', 'baskets')),
  methodology_version  TEXT NOT NULL,
  parameters           TEXT NOT NULL,          -- JSON
  ran_at               TEXT NOT NULL
);

CREATE INDEX idx_prices_ingredient ON prices(ingredient_id);
CREATE INDEX idx_price_history_ingredient ON price_history(ingredient_id, observed_on);
CREATE INDEX idx_seasonality_month ON seasonality(region, month);
CREATE INDEX idx_basket_items_ingredient ON basket_items(ingredient_id);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
