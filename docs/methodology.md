# Base research methodology

Version: **base-index-v1** (scores) · **basket-builder-v1** (weekly baskets) · region: **British Columbia** · reference week in the seed: **2026-10-05**

Base chooses each week's ingredients from data, not taste alone. This document says where that data comes from, how much to trust it, and exactly how the scores and baskets are computed. The code is the authority: `src/research/scoring.ts`, `src/research/basket-builder.ts`, `src/research/cost.ts` and `src/research/containers.ts`. Tests in `tests/` pin the behaviour described here.

## Verification states

Every datum shown on the site carries one of four states. The schema enforces them (`CHECK` constraints) and `npm run data:validate` fails if any external datum is missing a source or a state.

| State | Meaning |
| --- | --- |
| **Verified** | Directly supported by the cited source, checked value by value. *No data in the current seed is verified.* |
| **Estimated** | A reasonable estimate from a documented method. Not checked against a primary source value by value. |
| **Base-derived** | Calculated by Base from other data using this methodology. A ranking aid, not an objective measure. |
| **Demo** | Placeholder data that exists only to demonstrate the interface. |

Promotion to Verified requires a primary source URL, a retrieval date and a value-by-value check. Nothing is promoted automatically.

## Sources

### Nutrition

Per-100 g values for each ingredient in its purchase form (dry chickpeas, raw potatoes, raw chicken thighs), entered as approximate reference values from [USDA FoodData Central, SR Legacy](https://fdc.nal.usda.gov/). They have not yet been re-checked entry by entry, so every nutrition row is **Estimated**. Canadian Nutrient File values would be the preferred replacement for BC.

### Prices

<a id="prices"></a>

Each price is Base's estimate of a typical 2026 BC retail price, in the unit it is usually sold (kg, dozen, bunch, each). Unit conversions to grams live in `unit_conversions` (for example a dozen eggs = 600 g, a bunch of kale = 300 g). Prices are **Estimated**: they are not supplier quotes and not real-time. The planned calibration reference is Statistics Canada table 18-10-0245-01 (monthly average retail prices, British Columbia). Suppliers attached to prices are **Demo** placeholders; Base has no supplier relationships.

### Price history

<a id="price-history"></a>

Base has no real price series yet. To demonstrate the price-stability method, `db/seeds/price-history.ts` generates twelve monthly observations per ingredient ending at the current estimate:

```
factor(m) = 1 + volatility(category) × (meanAvailability − availability(m)) + noise(slug, m)
price(m)  = currentPrice × factor(m) / factor(lastMonth)
```

Produce gets cheaper in season and dearer out of season; staples barely move. The noise term is a fixed hash, so every run is identical. Every history row is **Demo**, and price-stability scores built on it inherit that weakness (see Confidence).

### Seasonality

<a id="seasonality"></a>

A month-by-month availability estimate for BC on a 0–9 scale (stored as 0–1), including storage crops such as potatoes, onions and apples, and a flag for whether the ingredient is locally grown in that month. Estimated from general knowledge of BC growing seasons; to be replaced by a sourced growers' calendar. **Estimated.**

### Versatility

<a id="versatility"></a>

An editorial catalogue of 29 use cases in three groups — meals (breakfast, lunch, dinner), dishes (soup, salad, bowl, stir-fry, curry…) and techniques (roast, braise, raw, pickle…) — and which ingredients are commonly used in each. Judgement-based, so **Estimated**.

### Add-ons

<a id="add-ons"></a>

An illustrative catalogue of 17 optional products: premium proteins, sauces, spice blends, specialty and seasonal treats. Products, units and prices are **Demo**. Nothing can be bought.

### Community

<a id="community"></a>

Sixteen example recipes written by the Base team under demo creator names (Maya, Daniel, Sarah…) to show how the community layer works. They were not submitted by real members, and the site says so on every recipe. There are no ratings or reviews.

## Scores

All scores are 0–100, computed for every ingredient for every month (`derived_scores`), and are **Base-derived**. Pantry basics (cooking oil, salt) are not scored.

### Cost per serving

`cost per serving = price per kg × serving size (g) ÷ 1000`. Serving sizes are per ingredient in purchase form (for example 130 g chicken thighs, 60 g dry chickpeas, 100 g carrots).

### Affordability (30%)

Log-scaled position of an ingredient's cost per serving between the cheapest (100) and most expensive (0) ingredient **in its comparison group**, so beans are compared with chicken, not with onions:

| Group | Categories |
| --- | --- |
| protein-foods | protein, legume, dairy |
| staples | grain |
| produce | vegetable, green, aromatic, fruit, herb, pantry |

Log scale because $0.30 → $0.60 per serving matters as much as $2 → $4.

### Versatility (25%)

`60% × breadth + 40% × coverage`, where breadth is the number of documented uses relative to the most versatile ingredient, and coverage is how well those uses span the three groups, with full marks at 3 meals, 6 dishes and 4 techniques.

### Nutrition (20%)

Nutrient density per 100 kcal: half protein (full marks at 10 g per 100 kcal), half fibre (full marks at 5 g per 100 kcal), minus up to 25 points for sodium (full penalty at 600 mg per 100 kcal). It rewards foods that deliver protein or fibre for their calories. It does **not** say a food is healthy or unhealthy, and the site makes no health claims from it.

### Availability (15%)

The seasonal availability estimate for the month, ×100.

### Price stability (10%)

`100 × (1 − coefficient of variation ÷ 0.25)`, clamped to 0–100, from at least six price observations; otherwise not scored and the weight is redistributed.

### Base Score

The weighted mean of the five components. If a component is missing, the remaining weights are renormalised.

### Confidence

The mean of the input states (verified 1.0, estimated/derived 0.7, demo 0.4) across price, nutrition, seasonality, use cases and price history: **high** ≥ 0.85, **medium** ≥ 0.6, otherwise **low**. With the current seed, every ingredient is *medium* — honest, given nothing is verified and the history is demo.

### Classification: Foundation, Supporting, Expression

Not everything good belongs in the Base.

- **Expression** — premium per serving (affordability < 15) or rich (more than 65% of calories from fat, or more than 400 mg sodium per 100 g). Wonderful, but better as an optional add-on.
- **Foundation** — Base Score ≥ 60 and versatility ≥ 40.
- **Supporting** — everything else: useful, and rotates in when the season is right.

Sodium is judged per 100 g for this rule (not per 100 kcal) so very low-calorie foods such as canned tomatoes are not flagged as rich.

## Weekly basket construction

`buildBasket()` is deterministic: the same data and the same previous week always produce the same Base.

1. **Eligibility.** Exclude Expression ingredients and anything below 55% availability (about 5/9) this month. Plant-forward variants also exclude meat.
2. **Slots.** Fill twelve slots for a household of two for a week:

   | Slot | Count | Servings | Rotates |
   | --- | --- | --- | --- |
   | Protein (meat; tofu for plant-forward) | 1 | 8 | no |
   | Everyday protein (eggs or soy) | 1 | 6 | yes |
   | Legume | 1 | 6 | yes |
   | Grain | 1 | 8 | no |
   | Aromatics | 2 | 8 | no |
   | Greens | 1 | 6 | yes |
   | Vegetables (distinct families) | 3 | 6 | yes |
   | Fresh flavour (herb or citrus) | 1 | 8 | yes |
   | Flavour builder (dairy or pantry) | 1 | 6 | yes |

3. **Ranking.** Within a slot, candidates are ranked by Base Score, plus a **peak-season bonus** in fresh-produce slots (`12 × (max − min yearly availability)` when this month is at peak, ≥ 8/9), minus a **rotation penalty** of 8 points in rotating slots if the ingredient was in last week's Base. Ties break by slug.
4. **Storage rule.** At least one vegetable must keep 7 days or more.
5. **Season rule.** At least one vegetable must be a *signature* seasonal vegetable (yearly availability spread ≥ 0.6, at its peak now), so a summer Base looks like summer.
6. **Budget rule.** If the estimated ingredient cost is over $52, swap the priciest rotating pick for the next cheaper option until it fits, or flag the basket as over budget.
7. **Quantities.** `servings × serving size`, rounded to 50 g above 200 g and to 10 g below.

Each pick stores a one-line reason, shown on the basket page.

`npm run research:baskets` builds last week (archived), this week (current), next week (upcoming), a plant-forward variant, and seasonal previews for January, May, August and October.

### Plates

A plate is one serving of a protein-providing ingredient (protein, everyday protein or legume) plus sides from the rest of the Base. Plates = the rounded sum of those servings.

## Cost model

All amounts are CAD and labelled on the site.

| Line | Rule | State |
| --- | --- | --- |
| Ingredients | Σ price per kg × quantity | Estimated |
| Prep and handling | $0.75 per prepared ingredient + $0.40 per container washed | Estimated |
| Operating margin | 15% of the above | Demo |
| Food price | ingredients + prep + margin, rounded up to the dollar | Estimated |
| Container deposit | per container, refundable, never part of the food price | Demo |

Base publishes no savings claims. The pickup-first model should lower last-mile cost, but that has not been measured.

## Recipe fit and add-on suggestions

A recipe fits a Base if every required, non-pantry ingredient is in it; the fit is the number of Base ingredients it uses. Add-ons are suggested when they are available this season and not sold out, ranked by how many Base ingredients they pair with, then price, keeping at least one per category where possible.

## Known limitations

- No verified data. Prices, nutrition and seasonality are estimates; price history is synthetic.
- One region (BC) and one household size (two).
- Weights are editorial choices. They are published so they can be argued with.
- Price stability is computed on demo data and should not be read as real volatility.
