// The route table, shared by the server prerender and the client router.
import type { ReactElement } from 'react';
import { matchPath, type Params } from './lib/router.tsx';
import {
  getBaskets, getBasketBySlug, getCurrentBase, getIngredientBySlug, getIngredients, getRecipeBySlug, getRecipes, NotFoundError,
} from './data/api.ts';
import { Home } from './pages/Home.tsx';
import { ThisWeek, BasketPage, BasketsIndex } from './pages/Basket.tsx';
import { IngredientsIndex, IngredientDetail } from './pages/Ingredients.tsx';
import { RecipesIndex, RecipeDetail } from './pages/Recipes.tsx';
import { AddOnsPage } from './pages/AddOns.tsx';
import { PickupPage } from './pages/Pickup.tsx';
import { HowItWorks } from './pages/HowItWorks.tsx';
import { ResearchPage, ResearchIngredients, ResearchData } from './pages/Research.tsx';
import { NotFound } from './pages/NotFound.tsx';
import { money } from './lib/format.ts';

export interface Meta { title: string; description: string }

interface Route {
  pattern: string;
  render: (p: Params) => ReactElement;
  meta: (p: Params) => Meta;
  /** Every concrete path for this route, for prerendering. */
  paths: () => string[];
}

const SITE = 'Base';
const t = (s: string) => `${s} | ${SITE}`;

export const ROUTES: Route[] = [
  { pattern: '/', render: () => <Home />, paths: () => ['/'],
    meta: () => {
      const b = getCurrentBase();
      return { title: `${SITE}: a better base for cooking`, description: `Seasonal ingredients, ready for the week. Pick up locally in Vancouver, cook whatever you want. This week: the ${b.basket.name}, ${b.lines.length} ingredients.` };
    } },
  { pattern: '/base', render: () => <ThisWeek />, paths: () => ['/base'],
    meta: () => {
      const b = getCurrentBase();
      return { title: t(`This week’s Base: ${b.basket.name}`), description: `${b.lines.map((l) => l.ingredient.name).join(', ')}. ${money(b.cost.foodPrice)} for the week, about ${b.plates} plates for two.` };
    } },
  { pattern: '/baskets', render: () => <BasketsIndex />, paths: () => ['/baskets'],
    meta: () => ({ title: t('Every Base'), description: 'This week’s Base, last week and next, a plant-forward version, and how the Base changes through the seasons.' }) },
  { pattern: '/baskets/:slug', render: (p) => <BasketPage view={getBasketBySlug(p.slug)} />, paths: () => getBaskets().map((b) => `/baskets/${b.slug}`),
    meta: (p) => { const b = getBasketBySlug(p.slug); return { title: t(`${b.basket.name}${b.weekLabel ? `, week of ${b.weekLabel}` : ''}`), description: b.basket.description }; } },
  { pattern: '/ingredients', render: () => <IngredientsIndex />, paths: () => ['/ingredients'],
    meta: () => ({ title: t('Ingredients'), description: 'Every ingredient Base considers: cost, culinary uses, BC seasonality, and whether it belongs in the Foundation.' }) },
  { pattern: '/ingredients/:slug', render: (p) => <IngredientDetail slug={p.slug} />,
    paths: () => [...getIngredients().map((i) => i.slug), 'canola-oil', 'salt'].map((s) => `/ingredients/${s}`),
    meta: (p) => { const i = getIngredientBySlug(p.slug); return { title: t(i.name), description: `${i.description} ${i.why}`.slice(0, 160) }; } },
  { pattern: '/recipes', render: () => <RecipesIndex />, paths: () => ['/recipes'],
    meta: () => ({ title: t('Community recipes'), description: 'Recipes built around this week’s Base, using only what you picked up plus oil and salt.' }) },
  { pattern: '/recipes/:slug', render: (p) => <RecipeDetail slug={p.slug} />, paths: () => getRecipes().map((r) => `/recipes/${r.slug}`),
    meta: (p) => { const r = getRecipeBySlug(p.slug); return { title: t(r.name), description: r.description }; } },
  { pattern: '/addons', render: () => <AddOnsPage />, paths: () => ['/addons'],
    meta: () => ({ title: t('Add-ons'), description: 'Base is enough. Expression makes it yours. Optional premium proteins, sauces, specialty ingredients and treats.' }) },
  { pattern: '/pickup', render: () => <PickupPage />, paths: () => ['/pickup'],
    meta: () => ({ title: t('Pickup and containers'), description: 'Collect your Base locally in reusable glass containers. How pickup, deposits and returns work.' }) },
  { pattern: '/how-it-works', render: () => <HowItWorks />, paths: () => ['/how-it-works'],
    meta: () => ({ title: t('How Base works'), description: 'Foundation, Expression, Community and Pickup: the weekly cycle behind Base, and why it can be affordable.' }) },
  { pattern: '/research', render: () => <ResearchPage />, paths: () => ['/research'],
    meta: () => ({ title: t('The Base Index: how we choose ingredients'), description: 'The open methodology behind every weekly Base: what we measure, where data comes from, and how baskets are built.' }) },
  { pattern: '/research/ingredients', render: () => <ResearchIngredients />, paths: () => ['/research/ingredients'],
    meta: () => ({ title: t('Ingredient rankings'), description: 'Every ingredient ranked by affordability, versatility, nutrition, availability and Base Score, by month.' }) },
  { pattern: '/research/data', render: () => <ResearchData />, paths: () => ['/research/data'],
    meta: () => ({ title: t('Data and provenance'), description: 'Where every number on Base comes from: sources, suppliers and verification states.' }) },
];

export function resolve(path: string): { element: ReactElement; meta: Meta; status: number } {
  for (const r of ROUTES) {
    const params = matchPath(r.pattern, path);
    if (!params) continue;
    try {
      return { element: r.render(params), meta: r.meta(params), status: 200 };
    } catch (err) {
      if (err instanceof NotFoundError) return notFound(err.message);
      throw err;
    }
  }
  return notFound();
}

function notFound(message?: string) {
  return { element: <NotFound message={message} />, meta: { title: t('Page not found'), description: 'This page could not be found.' }, status: 404 };
}

export function allPaths(): string[] {
  return ROUTES.flatMap((r) => r.paths());
}
