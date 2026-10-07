import { getBaskets, getContainerInformation, getCurrentBase, getPickupInformation, getSeasonalCalendar, WEEKDAYS } from '../data/api.ts';
import { StatusBadge } from '../components/data.tsx';
import { RecipeCard } from '../components/cards.tsx';
import { Link } from '../lib/router.tsx';
import { money, plural, time12 } from '../lib/format.ts';

export function PickupPage() {
  const base = getCurrentBase();
  const { locations, nextPickup } = getPickupInformation();
  const { containers, balance } = getContainerInformation();
  const season = base.basket.season;
  const seasonal = getSeasonalCalendar()[season];
  const previous = getBaskets().find((b) => b.status === 'archived' && b.type === 'weekly');
  const prevIds = new Set(previous?.items.map((i) => i.ingredientId));
  const fresh = base.lines.filter((l) => !prevIds.has(l.ingredient.id));

  return (
    <article className="page">
      <header className="page-head">
        <h1>Pickup and containers</h1>
        <p className="lede">Pickup isn’t a cheaper substitute for delivery. It’s part of the week: collect your Base, swap last week’s
          containers, see what’s in season and find a recipe to try.</p>
      </header>

      <section className="section split" aria-labelledby="next">
        <div className="pickup-card pickup-card-large">
          <p className="pickup-card-label">Next pickup</p>
          {nextPickup ? (
            <>
              <p className="pickup-card-when" id="next">{nextPickup.label}</p>
              <p>{time12(nextPickup.window.start)}–{time12(nextPickup.window.end)}, {nextPickup.location.name}</p>
              <p>Your {base.basket.name} is ready: {base.lines.length} ingredients in {plural(base.containerCount, 'container')}.</p>
            </>
          ) : <p id="next">No pickup windows are open this week. Check back on Monday when the next Base is published.</p>}
          <p className="small"><StatusBadge status="demo" /> Demo pickup location. Base has no pickup partner yet.</p>
        </div>
        <div>
          <h2>What to expect</h2>
          <ol className="steps">
            <li>Bring last week’s clean containers. Drop them at the return station.</li>
            <li>Collect your Base, already portioned into clean glass.</li>
            <li>Pick up any add-ons you reserved, or see what’s available today.</li>
            <li>Look at the recipe board for ideas from this week’s Base.</li>
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="where">
        <h2 id="where">Where and when</h2>
        <div className="locations">
          {locations.map((l) => (
            <div key={l.slug} className="location">
              <h3>{l.name}</h3>
              <p className="muted">{l.neighbourhood}, {l.city}</p>
              <ul className="plain">{l.windows.map((w, i) => <li key={i}>{WEEKDAYS[w.weekday]}, {time12(w.start)}–{time12(w.end)}</li>)}</ul>
              <p className="small">{l.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section band" aria-labelledby="this-week-at">
        <h2 id="this-week-at">This week at pickup</h2>
        <div className="at-pickup">
          <div><h3>In this week’s Base</h3><p>{base.lines.map((l) => l.ingredient.name).join(', ')}.</p></div>
          <div><h3>New since last week</h3><p>{fresh.length ? fresh.map((l) => l.ingredient.name).join(', ') : 'Nothing new this week'}.</p></div>
          <div><h3>In season now</h3><p>{seasonal.slice(0, 10).map((i) => i.name).join(', ')}.</p></div>
          <div><h3>Add-ons today</h3><p>{base.addOns.map((a) => a.addOn.name).join(', ')}.</p></div>
        </div>
        {base.recipes[0] && <div className="recipe-grid recipe-grid-one"><RecipeCard recipe={base.recipes[0].recipe} used={base.recipes[0].baseIngredientsUsed} /></div>}
      </section>

      <section className="section" aria-labelledby="containers">
        <h2 id="containers">The container loop</h2>
        <ol className="flow flow-large" aria-label="The container loop">
          {['Pick up', 'Store', 'Prep', 'Cook', 'Eat', 'Return'].map((s) => <li key={s}>{s}</li>)}
        </ol>
        <p className="section-lede">Fewer containers, fewer transfers, less packaging, less cleanup. Your food arrives in the container you’ll
          store it in and prep from, so there’s nothing to unpack and less to wash.</p>
        <div className="two-col">
          <div className="choice">
            <h3>Borrow</h3>
            <p>Pay a refundable deposit when you first receive containers. Bring them back clean at your next pickup and the deposit carries
              over to the next set. When you leave Base and return everything, you get it all back.</p>
            <p className="choice-amount">{money(base.deposit)} deposit for this week’s Base <StatusBadge status="demo" /></p>
          </div>
          <div className="choice">
            <h3>Own</h3>
            <p>Buy the containers and keep them. No deposit, nothing to return; bring them to pickup if you want Base to refill them.</p>
            <p className="choice-amount">{money(base.containerPurchase)} for this week’s set <StatusBadge status="demo" /></p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <caption>Container sizes (draft specification)</caption>
            <thead><tr><th scope="col">Container</th><th scope="col">Size</th><th scope="col">Used for</th><th scope="col" className="num">Deposit</th><th scope="col" className="num">Buy</th></tr></thead>
            <tbody>{containers.map((c) => (
              <tr key={c.slug}><th scope="row">{c.name}</th><td className="tabular">{c.sizeMl} ml</td><td>{c.notes}</td>
                <td className="num tabular">{money(c.deposit)}</td><td className="num tabular">{money(c.purchasePrice)}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <p className="small"><StatusBadge status="demo" /> {containers[0]?.cookingCapability} Base makes no oven, freezer or
          dishwasher claims until the specification is verified.</p>
      </section>

      {balance && (
        <section className="section" aria-labelledby="yours">
          <h2 id="yours">Your containers</h2>
          <div className="account">
            <dl className="facts">
              <div><dt>Active containers</dt><dd>{balance.active}</dd></div>
              <div><dt>Deposit held</dt><dd>{money(balance.depositHeld)} refundable</dd></div>
              <div><dt>Next pickup</dt><dd>{nextPickup?.label.split(',')[0] ?? 'Not scheduled'}</dd></div>
            </dl>
            <p><strong>Return:</strong> bring your clean Base containers with you. Any you keep past two pickups simply stay on your deposit.</p>
            <p className="small"><StatusBadge status="demo" /> An example account. Base doesn’t have member accounts yet; this shows how a container balance would work.</p>
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="econ">
        <h2 id="econ">Why pickup</h2>
        <ol className="chain" aria-label="Pickup economics">
          <li>Consolidated pickup</li>
          <li>Less last-mile complexity</li>
          <li>Lower operating cost</li>
          <li>Potentially a lower price for you</li>
          <li>A more sustainable operating model</li>
        </ol>
        <p className="small muted">The direction of the effect is the point. Base doesn’t yet publish savings figures; its costs aren’t validated. <Link href="/how-it-works">How Base can be affordable</Link></p>
      </section>
    </article>
  );
}
