# Food photos

Photos come from [Wikimedia Commons](https://commons.wikimedia.org/) and [Openverse](https://openverse.org/) (mostly Flickr), under free licences only: public domain, CC0, CC BY and CC BY-SA. Each is credited on the site (on its page and under *Data and sources → Photo credits*) with its author, licence and a link to the original.

- **Ingredients** are shown the way they come in a Base wherever a good photo exists: cooked chickpeas and lentils, diced onion, carrot sticks, sliced leeks, peeled ginger and so on.
- **Recipes** show a similar finished dish, captioned "A similar dish, for illustration". They are not photos of the exact recipe.
- **Add-ons** show the product.

How they were chosen:

1. `queries.ts` holds search terms: `PHOTO_QUERIES` (the ingredient), `PREP_QUERIES` (prepped form) and `DISH_QUERIES` (finished recipes).
2. The **Fetch photo candidates** workflow (Actions tab; inputs `source` = commons|openverse, `set` = main|prep|dish) runs `candidates.ts`. It keeps only freely licensed images, excludes AI-generated ones, and pushes candidates to the `photo-candidates` branch.
3. Every candidate was reviewed by eye. `select.py` records the pick for each item, its alt text and any crop (including a square crop so the food fills the round bowls). It writes `public/photos/<slug>.webp` and `<slug>-sq.webp`, plus the credits that go into `db/seeds/photos.ts`.

Pantry basics (oil, salt) and parsnips keep the drawn bowl illustration.
