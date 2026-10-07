import { getCurrentBase } from '../data/api.ts';
import { batchProtocol } from '../research/protocol.ts';
import { StatusBadge } from '../components/data.tsx';
import { ButtonLink } from '../components/ui.tsx';
import { Link } from '../lib/router.tsx';
import { money } from '../lib/format.ts';
import { COST_RULES } from '../research/cost.ts';

export const CYCLE = [
  { title: 'Base plans the week', short: 'Seasonality, prices, nutrition and versatility decide the basket.',
    long: 'The research engine scores every ingredient for this month and composes a Base from what is good, useful, affordable and available now.' },
  { title: 'You explore it', short: 'See what’s in it, why, and what people make with it.',
    long: 'Ingredients, price, nutrition, why each one was chosen, community recipes and optional add-ons, all on one page.' },
  { title: 'You reserve it', short: 'Your Base, plus any add-ons you want.',
    long: 'Choose add-ons if you want them and decide how you’d like your containers: borrow, bring back, or own.' },
  { title: 'Base prepares it', short: 'Washed, cut, cooked where it helps, portioned into glass.',
    long: 'Ingredients are prepped and portioned into reusable containers: potatoes cut, greens washed, legumes cooked.' },
  { title: 'You pick it up', short: 'A local pickup, on a set evening.',
    long: 'Pickup is part of the week: see what’s in season, swap containers, find a recipe on the board.' },
  { title: 'You batch-prep', short: 'An hour on Sunday turns it into building blocks.',
    long: 'Cook the grain, roast the vegetables, prepare the protein. The containers go straight into the fridge.' },
  { title: 'You cook flexibly', short: 'Mix and match all week. No rigid recipes.',
    long: 'Base + sauce. Base + spice blend. Base + leftovers. You decide what dinner is.' },
  { title: 'The community shares ideas', short: 'Recipes built on this week’s Base.',
    long: 'Members share what they made from the same ingredients, which shows how far one Base can go.' },
  { title: 'Containers come back', short: 'Bring them next week; your deposit carries over.',
    long: 'Clean containers are returned at the next pickup, washed and sanitised, and used again.' },
  { title: 'The cycle repeats', short: 'Next week’s Base changes with the season.',
    long: 'New prices, new availability, a rotation rule against repeating last week: a different, still useful Base.' },
];

const ALTERNATIVES = [
  { name: 'Grocery shopping', plan: 'You plan everything', flex: 'Total', prep: 'All on you', pack: 'Varies', cook: 'Yes' },
  { name: 'Meal kits', plan: 'Done for you', flex: 'Low: fixed recipes', prep: 'Partly', pack: 'Lots, per recipe', cook: 'Yes, by the card' },
  { name: 'Prepared meals', plan: 'Done for you', flex: 'Low', prep: 'None', pack: 'Lots', cook: 'No' },
  { name: 'Delivery', plan: 'None', flex: 'High, at a price', prep: 'None', pack: 'Lots', cook: 'No' },
  { name: 'Base', plan: 'Done for you', flex: 'High: ingredients, not recipes', prep: 'Mostly done', pack: 'Reusable glass', cook: 'Yes, your way' },
];

export function HowItWorks() {
  const base = getCurrentBase();
  const protocol = batchProtocol(base.lines.map((l) => ({
    name: l.ingredient.name, slot: l.item.slot, category: l.ingredient.category, prepForm: l.ingredient.prepForm, family: l.ingredient.family,
  })));

  return (
    <article className="page">
      <header className="page-head">
        <h1>How Base works</h1>
        <p className="lede">Most people don’t need someone to cook for them. They need a better starting point. Base provides the
          foundation, not the finished meal.</p>
      </header>

      <section className="section" aria-labelledby="layers">
        <h2 id="layers">Four layers, one system</h2>
        <div className="layers">
          <div className="layer">
            <h3>Foundation</h3>
            <p>The affordable weekly Base: 10 to 12 seasonal, versatile ingredients chosen by the research engine. Useful on its own.</p>
            <Link href="/base">This week’s Base</Link>
          </div>
          <div className="layer">
            <h3>Expression</h3>
            <p>Optional add-ons: better cuts, sauces, spice blends, specialty and seasonal treats. Base is enough; Expression makes it yours.</p>
            <Link href="/addons">Add-ons</Link>
          </div>
          <div className="layer">
            <h3>Community</h3>
            <p>Recipes built around this week’s ingredients, so you always have an idea for what to make.</p>
            <Link href="/recipes">Recipes</Link>
          </div>
          <div className="layer">
            <h3>Pickup and containers</h3>
            <p>A local pickup where you collect your Base, return last week’s glass containers and see what’s in season.</p>
            <Link href="/pickup">Pickup</Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="cycle">
        <h2 id="cycle">The weekly cycle</h2>
        <ol className="cycle">
          {CYCLE.map((c) => <li key={c.title}><strong>{c.title}</strong><span>{c.long}</span></li>)}
        </ol>
      </section>

      <section className="section" aria-labelledby="protocol">
        <h2 id="protocol">The Sunday protocol</h2>
        <p className="section-lede">An hour of batch prep turns this week’s Base into building blocks. No recipe required.</p>
        <div className="protocol">
          <div>
            <h3>Pick up</h3>
            <ul className="plain">{base.lines.map((l) => <li key={l.ingredient.slug}>{l.ingredient.name}</li>)}</ul>
          </div>
          <div>
            <h3>Prep</h3>
            <ul className="plain">{protocol.prep.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <div>
            <h3>During the week</h3>
            <ul className="plain">{protocol.mixes.map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="compare">
        <h2 id="compare">Where Base fits</h2>
        <p className="section-lede">More convenient than figuring everything out yourself. More flexible than a meal kit. Designed to cost less
          than prepared food or delivery.</p>
        <div className="table-wrap">
          <table className="table">
            <caption className="visually-hidden">How Base compares with other ways of eating</caption>
            <thead><tr><th scope="col">Option</th><th scope="col">Planning</th><th scope="col">Flexibility</th><th scope="col">Prep</th><th scope="col">Packaging</th><th scope="col">You cook</th></tr></thead>
            <tbody>
              {ALTERNATIVES.map((a) => (
                <tr key={a.name} className={a.name === 'Base' ? 'is-base' : undefined}>
                  <th scope="row">{a.name}</th><td>{a.plan}</td><td>{a.flex}</td><td>{a.prep}</td><td>{a.pack}</td><td>{a.cook}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted">A qualitative comparison. Base does not publish price comparisons with other services until its own costs are validated.</p>
      </section>

      <section className="section" aria-labelledby="afford">
        <h2 id="afford">Why Base can be affordable</h2>
        <div className="split">
          <ol className="chain" aria-label="How the operating model supports affordability">
            <li>Seasonal ingredients, bought in bulk</li>
            <li>Versatile ingredients, so fewer of them go further</li>
            <li>Consolidated pickup instead of door-to-door delivery</li>
            <li>Less last-mile complexity and packaging</li>
            <li>Lower operating cost</li>
            <li>Potentially a lower price for you</li>
          </ol>
          <div>
            <h3>This week’s Base, costed</h3>
            <dl className="ledger">
              <div><dt>Ingredients <StatusBadge status="estimated" /></dt><dd>{money(base.cost.ingredientCost)}</dd></div>
              <div><dt>Prep and handling <StatusBadge status="estimated" /></dt><dd>{money(base.cost.prepHandling)}</dd></div>
              <div><dt>Operating margin, {Math.round(COST_RULES.operatingMargin * 100)}% <StatusBadge status="demo" /></dt><dd>{money(base.cost.margin)}</dd></div>
              <div className="ledger-total"><dt>Food price, rounded up</dt><dd>{money(base.cost.foodPrice)}</dd></div>
            </dl>
            <p className="small muted">Demo calculation. Ingredient costs are Base estimates of BC retail prices, not supplier quotes;
              prep is estimated at {money(COST_RULES.prepPerItem)} per prepared ingredient and {money(COST_RULES.washPerContainer)} per container washed.
              The deposit is never part of the food price.</p>
          </div>
        </div>
      </section>

      <div className="actions">
        <ButtonLink href="/base">Explore this week’s Base</ButtonLink>
        <ButtonLink href="/research" variant="secondary">How ingredients are chosen</ButtonLink>
      </div>
    </article>
  );
}
