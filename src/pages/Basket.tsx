import { getBaskets, getCurrentBase, getPickupInformation, getSource, viewBasket, type BasketView } from '../data/api.ts';
import { Counter } from '../components/Counter.tsx';
import { AddOnCard, BasketCard, RecipeCard } from '../components/cards.tsx';
import { Button, ButtonLink, Details, EmptyState } from '../components/ui.tsx';
import { StatusBadge } from '../components/data.tsx';
import { Link } from '../lib/router.tsx';
import { useBuild } from '../lib/build-state.tsx';
import { approx, CATEGORY_LABEL, grams, joinList, lowerName, money, plural, time12 } from '../lib/format.ts';
import { batchProtocol } from '../research/protocol.ts';
import { BUILDER_RULES } from '../research/basket-builder.ts';
import { MONTH_NAMES } from '../research/calendar.ts';

const SLOT_LABEL: Record<string, string> = {
  protein: 'Protein', 'everyday-protein': 'Everyday protein', legume: 'Legume', grain: 'Grain', aromatic: 'Aromatic',
  green: 'Greens', vegetable: 'Vegetable', 'fresh-flavor': 'Fresh flavour', 'rich-flavor': 'Flavour builder',
};

export function ThisWeek() {
  return <BasketPage view={getCurrentBase()} />;
}

export function BasketPage({ view }: { view: BasketView }) {
  const build = useBuild();
  const b = view.basket;
  const isCurrent = b.status === 'current' && b.type === 'weekly';
  const pickup = getPickupInformation().nextPickup;
  const protocol = batchProtocol(view.lines.map((l) => ({
    name: l.ingredient.name, slot: l.item.slot, category: l.ingredient.category, prepForm: l.ingredient.prepForm, family: l.ingredient.family,
  })));

  // Totals for the nutrition overview (estimated inputs).
  const totals = view.lines.reduce((t, l) => {
    const k = l.item.quantityG / 100;
    return { kcal: t.kcal + l.ingredient.nutrition.calories * k, protein: t.protein + l.ingredient.nutrition.protein * k, fiber: t.fiber + (l.ingredient.nutrition.fiber ?? 0) * k };
  }, { kcal: 0, protein: 0, fiber: 0 });
  const uses = new Set(view.lines.flatMap((l) => l.ingredient.useCases));
  const dishes = ['soup', 'curry', 'bowl', 'stir-fry', 'sheet-pan', 'hash', 'salad', 'stew', 'pasta', 'wrap', 'grain-salad'].filter((u) => uses.has(u));

  // Compared with the week before
  const previous = b.weekOf ? getBaskets().find((x) => x.type === 'weekly' && x.weekOf && x.weekOf < b.weekOf! && x.status === 'archived') : undefined;
  const prevIds = new Set(previous?.items.map((i) => i.ingredientId) ?? []);
  const newThisWeek = previous ? view.lines.filter((l) => !prevIds.has(l.ingredient.id)) : [];

  const statuses = [...new Set(view.lines.flatMap((l) => [l.ingredient.price.status, l.ingredient.nutrition.status, l.ingredient.seasonality.status]))];

  return (
    <article className="page basket-page">
      <header className="basket-head">
        <div>
          <p className="kicker">{b.weekOf ? `Week of ${view.weekLabel}` : `Seasonal preview, built for ${view.monthLabel}`}
            {isCurrent && <span className="pill">This week</span>}{b.status === 'upcoming' && <span className="pill pill-quiet">Next week</span>}
            {b.status === 'archived' && <span className="pill pill-quiet">Last week</span>}</p>
          <h1>{b.name}</h1>
          <p className="lede">{b.description}</p>
          <dl className="facts">
            <div><dt>Ingredients</dt><dd>{view.lines.length}</dd></div>
            <div><dt>Serves</dt><dd>{b.householdSize} people, about {view.plates} plates</dd></div>
            <div><dt>Containers</dt><dd>{view.containerCount}</dd></div>
          </dl>
        </div>
        <aside className="price-box" aria-label="Price">
          <p className="price-big">{money(view.cost.foodPrice)}</p>
          <p className="muted">Food price for the week, prototype <StatusBadge status="estimated" /></p>
          <p className="price-per">{approx(view.cost.foodPrice / view.plates)} a plate</p>
          <dl className="ledger ledger-small">
            <div><dt>Container deposit, refundable</dt><dd>+{money(view.deposit)}</dd></div>
            <div><dt>Add-ons</dt><dd>Optional</dd></div>
          </dl>
          {isCurrent ? <Button className="btn-block" onClick={build.openBuilder}>Build my Base</Button>
            : <ButtonLink href="/base" variant="secondary" className="btn-block">See this week’s Base</ButtonLink>}
          {isCurrent && pickup && <p className="small">Pickup {pickup.label}, {time12(pickup.window.start)}–{time12(pickup.window.end)}</p>}
        </aside>
      </header>

      <Counter lines={view.lines} caption={`${b.name}${b.weekOf ? `, week of ${view.weekLabel}` : ''}: everything in the Base, sized by quantity.`} />

      <section className="section" aria-labelledby="foundation">
        <div className="section-head">
          <h2 id="foundation">The Foundation</h2>
          <p className="section-lede">Everything you need to cook all week. {previous && newThisWeek.length > 0 &&
            `New since last week: ${newThisWeek.map((l) => lowerName(l.ingredient.name)).join(', ')}.`}</p>
        </div>
        <div className="table-wrap">
          <table className="table foundation-table">
            <caption className="visually-hidden">Ingredients in {b.name}</caption>
            <thead><tr>
              <th scope="col">Ingredient</th><th scope="col">Role</th><th scope="col">Quantity</th>
              <th scope="col">Servings</th><th scope="col">How it comes</th><th scope="col" className="num">Est. cost</th>
            </tr></thead>
            <tbody>
              {view.lines.map((l) => (
                <tr key={l.ingredient.slug}>
                  <th scope="row"><Link href={`/ingredients/${l.ingredient.slug}`}>{l.ingredient.name}</Link></th>
                  <td>{SLOT_LABEL[l.item.slot] ?? l.item.slot}</td>
                  <td className="tabular">{grams(l.item.quantityG)}{l.ingredient.purchaseForm.startsWith('dry') ? ' dry' : ''}</td>
                  <td className="tabular">{l.item.estimatedServings}</td>
                  <td>{l.ingredient.prepForm}</td>
                  <td className="num tabular">{approx(l.cost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><th scope="row" colSpan={5}>Estimated ingredient cost</th><td className="num tabular">{approx(view.cost.ingredientCost)}</td></tr></tfoot>
          </table>
        </div>
        <Details summary="How the price is built">
          <dl className="ledger">
            <div><dt>Ingredients <StatusBadge status="estimated" /></dt><dd>{money(view.cost.ingredientCost)}</dd></div>
            <div><dt>Prep and container handling <StatusBadge status="estimated" /></dt><dd>{money(view.cost.prepHandling)}</dd></div>
            <div><dt>Estimated basket cost</dt><dd>{money(view.cost.estimatedCost)}</dd></div>
            <div><dt>Operating margin <StatusBadge status="demo" /></dt><dd>{money(view.cost.margin)}</dd></div>
            <div className="ledger-total"><dt>Food price, rounded up</dt><dd>{money(view.cost.foodPrice)}</dd></div>
          </dl>
          <p className="small muted">The refundable deposit, a container purchase and add-ons are always shown separately from the food price.</p>
        </Details>
      </section>

      <section className="section" aria-labelledby="protocol">
        <div className="section-head">
          <h2 id="protocol">Your week, roughly</h2>
          <p className="section-lede">Not a meal plan. A short Sunday prep, then mix and match.</p>
        </div>
        <div className="protocol">
          <div><h3>Sunday prep</h3><ul className="plain">{protocol.prep.map((p) => <li key={p}>{p}</li>)}</ul></div>
          <div><h3>During the week</h3><ul className="plain">{protocol.mixes.map((m) => <li key={m}>{m}</li>)}</ul></div>
        </div>
      </section>

      <section className="section" aria-labelledby="make">
        <div className="section-head">
          <h2 id="make">What you can make</h2>
          <p className="section-lede">{view.recipes.length
            ? `${plural(view.recipes.length, 'community recipe')} use only ingredients from this Base, plus oil and salt. Base can cover ${dishes.length} kinds of dish: ${dishes.join(', ').replace(/-/g, ' ')}.`
            : `Base can cover ${dishes.length} kinds of dish with this basket: ${dishes.join(', ').replace(/-/g, ' ')}.`}</p>
        </div>
        {view.recipes.length ? (
          <div className="recipe-grid">
            {view.recipes.map((r) => <RecipeCard key={r.recipe.id} recipe={r.recipe} used={r.baseIngredientsUsed} basketName={isCurrent ? undefined : `the ${b.name}`} />)}
          </div>
        ) : (
          <EmptyState title="No community recipes for this Base yet">Recipes appear here once members share them.</EmptyState>
        )}
      </section>

      <section className="section" aria-labelledby="addons">
        <div className="section-head">
          <h2 id="addons">Optional additions</h2>
          <p className="section-lede">You could stop at the Foundation and have everything you need. These are for when something sounds great.</p>
        </div>
        {view.addOns.length ? (
          <div className="addon-grid">{view.addOns.map((a) => <AddOnCard key={a.addOn.id} addOn={a.addOn} reason={a.reason} selectable={isCurrent} />)}</div>
        ) : <EmptyState title="No add-ons this week" />}
      </section>

      <section className="section two-col" aria-labelledby="nutrition">
        <div>
          <h2 id="nutrition">Nutrition overview</h2>
          <dl className="facts facts-stack">
            <div><dt>Energy, whole Base</dt><dd>~{Math.round(totals.kcal / 100) * 100} kcal</dd></div>
            <div><dt>Protein, whole Base</dt><dd>~{Math.round(totals.protein)} g</dd></div>
            <div><dt>Fibre, whole Base</dt><dd>~{Math.round(totals.fiber)} g</dd></div>
            <div><dt>Protein per plate</dt><dd>~{Math.round(totals.protein / view.plates)} g</dd></div>
          </dl>
          <p className="small"><StatusBadge status="estimated" /> Sums of estimated nutrient values, before cooking. A rough guide, not dietary advice.</p>
        </div>
        <div>
          <h2>Containers</h2>
          <ul className="plain">
            {view.containers.map((c) => <li key={c.container.slug}>{c.quantity} × {c.container.name.toLowerCase()} ({c.container.sizeMl} ml)</li>)}
          </ul>
          <p>Borrow them for a {money(view.deposit)} refundable deposit, or buy them for {money(view.containerPurchase)}.</p>
          <p className="small"><StatusBadge status="demo" /> Draft container specification. <Link href="/pickup">How containers work</Link></p>
        </div>
      </section>

      <section className="section" aria-labelledby="why">
        <div className="section-head">
          <h2 id="why">Why Base chose these</h2>
          <p className="section-lede">Every ingredient fills a role. The builder takes the strongest in-season option for each role, rotates
            away from last week, and keeps the basket under budget. These are its reasons, word for word.</p>
        </div>
        <ul className="reasons">
          {view.lines.map((l) => (
            <li key={l.ingredient.slug}><strong>{l.ingredient.name}</strong> <span className="muted">({CATEGORY_LABEL[l.ingredient.category].toLowerCase()})</span> {l.item.reason}</li>
          ))}
        </ul>
        <Details summary="Data confidence and method">
          <p>Inputs for this Base are {statuses.map((s) => s).join(' and ')} data: prices are Base estimates
            ({getSource(view.lines[0]?.ingredient.price.sourceId)?.name}), nutrition values are approximate reference values, and seasonality
            is Base’s estimate for BC in {MONTH_NAMES[b.referenceMonth - 1]}. Scores are Base-derived.</p>
          <p>Rules: in season means at least {BUILDER_RULES.minAvailability}% estimated availability; ingredients repeated from last week
            lose {BUILDER_RULES.rotationPenalty} points; the ingredient budget is ${BUILDER_RULES.budget} for a household of two.
            Built by {b.generatedBy}.</p>
          <p><Link href="/research">Read the full methodology</Link></p>
        </Details>
      </section>

      {!isCurrent && <p><Link href="/baskets">All Bases</Link></p>}
    </article>
  );
}

export function BasketsIndex() {
  const baskets = getBaskets();
  const weekly = baskets.filter((b) => b.type === 'weekly');
  const variants = baskets.filter((b) => b.type === 'variant');
  const seasonal = baskets.filter((b) => b.type === 'seasonal');
  const price = (slug: string) => viewBasket(baskets.find((b) => b.slug === slug)!).cost.foodPrice;
  return (
    <article className="page">
      <header className="page-head">
        <h1>Every Base</h1>
        <p className="lede">The Base changes every week. Compare this week with last week and next, see a plant-forward version, or look ahead
          to how the Base changes with the seasons.</p>
      </header>
      <section className="section" aria-labelledby="weekly">
        <h2 id="weekly">Weekly</h2>
        <div className="basket-list">{weekly.map((b) => <BasketCard key={b.slug} basket={b} price={price(b.slug)} />)}</div>
      </section>
      <section className="section" aria-labelledby="variants">
        <h2 id="variants">Variations on this week</h2>
        <div className="basket-list">{variants.map((b) => <BasketCard key={b.slug} basket={b} price={price(b.slug)} />)}</div>
      </section>
      <section className="section" aria-labelledby="seasonal">
        <h2 id="seasonal">Through the year</h2>
        <p className="section-lede">Previews built by the same engine for a representative month in each season. <StatusBadge status="derived" /></p>
        <div className="basket-list">{seasonal.map((b) => <BasketCard key={b.slug} basket={b} price={price(b.slug)} />)}</div>
      </section>
    </article>
  );
}

