import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseBasePath, setBasePath, stripBase, withBase } from '../src/lib/base-path.ts';

test('base path normalisation', () => {
  assert.equal(normaliseBasePath(''), '');
  assert.equal(normaliseBasePath('/'), '');
  assert.equal(normaliseBasePath(undefined), '');
  assert.equal(normaliseBasePath('Base'), '/Base');
  assert.equal(normaliseBasePath('/Base/'), '/Base');
});

test('withBase and stripBase round-trip under a sub-path', () => {
  setBasePath('/Base');
  try {
    assert.equal(withBase('/'), '/Base/');
    assert.equal(withBase('/recipes/soup'), '/Base/recipes/soup');
    assert.equal(withBase('/research/ingredients?compare=eggs'), '/Base/research/ingredients?compare=eggs');
    assert.equal(withBase('https://fdc.nal.usda.gov/'), 'https://fdc.nal.usda.gov/');
    assert.equal(withBase('#main'), '#main');
    assert.equal(stripBase('/Base'), '/');
    assert.equal(stripBase('/Base/'), '/');
    assert.equal(stripBase('/Base/recipes/soup'), '/recipes/soup');
    assert.equal(stripBase('/Baseline'), '/Baseline', 'only a whole path segment is stripped');
  } finally {
    setBasePath('');
  }
});

test('at the root, paths are untouched', () => {
  setBasePath('');
  assert.equal(withBase('/recipes'), '/recipes');
  assert.equal(stripBase('/recipes'), '/recipes');
});
