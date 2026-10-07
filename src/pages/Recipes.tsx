import { useState } from 'react';
import { getAddOnById, getBasketsForRecipe, getCurrentBase, getIngredientById, getRecipeBySlug, getRecipes, recipeFitsBasket } from '../data/api.ts';
import { RecipeCard, AddOnCard } from '../components/cards.tsx';
import { BowlArt } from '../components/BowlArt.tsx';
import { EmptyState, Tabs } from '../components/ui.tsx';
import { StatusBadge } from '../components/data.tsx';
import { Link } from '../lib/router.tsx';
import { lowerName, minutes } from '../lib/format.ts';

export function RecipesIndex() {
  const base = getCurrentBase();
  const [tab, setTab] = useState<'week' | 'all'>('week');
  const all = getRecipes();
  return (
    <article className="page">
      <header className="page-head">
        <h1>Community recipes</h1>
        <p className="lede">Ideas from people cooking the same Base. Every recipe here is built around a weekly basket, so you can make it
          from what you picked up, plus oil and salt.</p>
        <p className="small"><StatusBadge status="demo" /> These are example recipes written by the Base team under demo creator names. Base has no members yet.</p>
      </header>
      <Tabs label="Which recipes" value={tab} onChange={setTab}
        tabs={[{ value: 'week', label: `This week’s Base (${base.recipes.length})` }, { value: 'all', label: `All recipes (${all.length})` }]} />
      <div role="tabpanel" className="tabpanel">
        {tab === 'week' ? (
          base.recipes.length ? (
            <>
              <p className="section-lede">You have {base.lines.length} ingredients. Here are {base.recipes.length} things people make with them.</p>
              <div className="recipe-grid">{base.recipes.map((r) => <RecipeCard key={r.recipe.id} recipe={r.recipe} used={r.baseIngredientsUsed} />)}</div>
            </>
          ) : <EmptyState title="No recipes for this week yet">Members’ recipes for this Base will appear here.</EmptyState>
        ) : (
          <div className="recipe-grid">
            {all.map((r) => {
              const fit = recipeFitsBasket(r, base.basket);
              return <RecipeCard key={r.id} recipe={r} used={fit ?? undefined} />;
            })}
          </div>
        )}
      </div>
    </article>
  );
}

export function RecipeDetail({ slug }: { slug: string }) {
  const r = getRecipeBySlug(slug);
  const base = getCurrentBase();
  const inBase = new Set(base.lines.map((l) => l.ingredient.id));
  const fit = recipeFitsBasket(r, base.basket);
  const baskets = getBasketsForRecipe(r.id);
  const ingLines = r.lines.filter((l) => l.ingredientId != null);
  const addOnLines = r.lines.filter((l) => l.addOnId != null);
  const main = ingLines.map((l) => getIngredientById(l.ingredientId!)).filter((g) => g && !g.isPantryBasic && !ingLines.find((x) => x.ingredientId === g.id)?.optional).slice(0, 4);

  return (
    <article className="page recipe-page">
      <header className="recipe-head">
        <div className="recipe-head-bowls" aria-hidden="true">
          {main.map((g, i) => g && <BowlArt key={g.slug} visual={g.visual} seed={`${g.slug}-${r.slug}-${i}`} size={150} photo={g.photo} />)}
        </div>
        <div>
          <h1>{r.name}</h1>
          <p className="recipe-card-by">by {r.creatorName}{r.creatorIsDemo && <span className="muted"> (demo creator)</span>}</p>
          <p className="lede">{r.description}</p>
          <dl className="facts">
            <div><dt>Time</dt><dd>{minutes(r.prepTimeMinutes)}</dd></div>
            <div><dt>Effort</dt><dd>{r.difficulty === 'easy' ? 'Easy' : r.difficulty === 'medium' ? 'Some effort' : 'Involved'}</dd></div>
            <div><dt>Serves</dt><dd>{r.servings}</dd></div>
          </dl>
          {fit ? <p className="uses-base strong">Uses {fit} ingredients from this week’s Base</p>
            : <p className="muted">Not a match for this week’s Base{baskets.length ? `; made for the ${baskets[0].name}` : ''}.</p>}
          {r.tags.length > 0 && <ul className="tags">{r.tags.map((t) => <li key={t}>{t.replace(/-/g, ' ')}</li>)}</ul>}
        </div>
      </header>

      <div className="recipe-body">
        <section aria-labelledby="ingredients">
          <h2 id="ingredients">Ingredients</h2>
          <ul className="recipe-ingredients">
            {ingLines.map((l, i) => {
              const g = getIngredientById(l.ingredientId!);
              if (!g) return null;
              const have = inBase.has(g.id);
              return (
                <li key={i} className={have ? 'in-base' : g.isPantryBasic ? 'pantry' : 'not-in-base'}>
                  <span className="qty">{l.quantity != null ? (l.unit === 'each' ? String(l.quantity) : `${l.quantity} ${l.unit ?? ''}`) : l.unit}</span>
                  <span>{g.isPantryBasic ? lowerName(g.name) : <Link href={`/ingredients/${g.slug}`}>{lowerName(g.name)}</Link>}
                    {l.optional && <span className="muted"> (optional)</span>}{l.note && <span className="muted">, {l.note}</span>}</span>
                  <span className="have">{have ? 'In this week’s Base' : g.isPantryBasic ? 'Pantry' : ''}</span>
                </li>
              );
            })}
          </ul>
          {r.upgradeNote && <p className="upgrade">{r.upgradeNote}</p>}
        </section>
        <section aria-labelledby="method">
          <h2 id="method">Method</h2>
          <ol className="steps">{r.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </section>
      </div>

      {addOnLines.length > 0 && (
        <section className="section" aria-labelledby="upgrades">
          <h2 id="upgrades">Optional upgrades</h2>
          <div className="addon-grid">{addOnLines.map((l) => {
            const a = getAddOnById(l.addOnId!);
            return a ? <AddOnCard key={a.id} addOn={a} reason={l.note ?? undefined} /> : null;
          })}</div>
        </section>
      )}

      {baskets.length > 0 && (
        <section className="section" aria-labelledby="fits">
          <h2 id="fits">Works with</h2>
          <ul className="plain inline-list">{baskets.map((b) => <li key={b.slug}><Link href={`/baskets/${b.slug}`}>{b.name}{b.weekOf ? `, week of ${b.weekOf}` : ''}{b.diet === 'plant_forward' ? ' (plant-forward)' : ''}</Link></li>)}</ul>
        </section>
      )}
      <p><Link href="/recipes">All recipes</Link></p>
    </article>
  );
}
