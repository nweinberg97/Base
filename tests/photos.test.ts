import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT } from '../src/data/sqlite/connection.ts';
import { PHOTOS } from '../db/seeds/photos.ts';
import { buildTestDatabase } from './helpers/pipeline.ts';

const { snapshot } = buildTestDatabase();
const FREE = /^(CC0|Public domain|CC BY \d|CC BY-SA \d)/;

test('every photo is freely licensed, credited and on disk', () => {
  for (const [slug, p] of Object.entries(PHOTOS)) {
    assert.match(p.license, FREE, `${slug}: licence ${p.license} is not a free licence`);
    assert.ok(p.author.trim() && !/^unknown$/i.test(p.author.trim()), `${slug}: no author to credit`);
    assert.match(p.sourceUrl, /^https:\/\/(commons\.wikimedia\.org|www\.flickr\.com|www\.rawpixel\.com)\//, `${slug}: source must link to the original`);
    assert.ok(p.alt.trim().length > 3, `${slug}: needs alt text`);
    assert.doesNotMatch(`${p.title} ${p.author}`, /craiyon|stable diffusion|dall-?e|midjourney/i, `${slug}: AI-generated image`);
    for (const f of [`public/photos/${slug}.webp`, `public/photos/${slug}-sq.webp`]) assert.ok(existsSync(resolve(ROOT, f)), `missing ${f}`);
  }
});

test('photos reach the snapshot for ingredients and add-ons', () => {
  const withPhoto = [...snapshot.ingredients, ...snapshot.addOns, ...snapshot.recipes].filter((x) => x.photo);
  assert.equal(withPhoto.length, Object.keys(PHOTOS).length);
  for (const x of withPhoto) {
    assert.match(x.photo!.src, /^\/photos\/[a-z0-9-]+\.webp$/);
    assert.ok(snapshot.sources.some((s) => s.id === x.photo!.sourceId), `${x.slug}: photo source missing`);
  }
  for (const r of snapshot.recipes) assert.ok(r.photo, `recipe ${r.slug} has no dish photo`);
  const current = snapshot.baskets.find((b) => b.status === 'current' && b.type === 'weekly')!;
  for (const item of current.items) {
    const ing = snapshot.ingredients.find((i) => i.id === item.ingredientId)!;
    assert.ok(ing.photo, `this week's ${ing.slug} has no photo`);
  }
});
