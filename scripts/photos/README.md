# Food photos

Photos of ingredients and add-ons come from [Wikimedia Commons](https://commons.wikimedia.org/) under free licences only (public domain, CC0, CC BY, CC BY-SA). Each is credited on the site (ingredient pages and *Data and sources → Photo credits*) with its author, licence and a link to the original.

How they were chosen:

1. `queries.ts` lists search terms per ingredient, most accurate first (the food as Base hands it over, then the plain ingredient).
2. The **Fetch photo candidates** workflow (`.github/workflows/photo-candidates.yml`, run from the Actions tab) runs `candidates.ts`, which searches Commons, keeps only freely licensed real photographs (AI-generated images are excluded) and pushes the candidates to the `photo-candidates` branch.
3. Every candidate was reviewed by eye; `select.py` records the pick for each item, its alt text and any crop, writes `public/photos/<slug>.webp` (960 px) and `<slug>-sq.webp` (360 px square), and the credits that go into `db/seeds/photos.ts`.

Items with no accurate free photo (parsnips, whole wheat pasta, and the pantry basics) keep the drawn bowl illustration. The photos are representative: they show the ingredient, not Base's own food.
