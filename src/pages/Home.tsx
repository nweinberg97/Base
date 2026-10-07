import { getAddOns, getCurrentBase, getIngredientBySlug, getIngredientRanking, getPickupInformation, getResearchSummary, getSeasonalCalendar, scoreFor } from '../data/api.ts';
import { Counter } from '../components/Counter.tsx';
import { AddOnCard, RecipeCard } from '../components/cards.tsx';
import { ButtonLink, Button } from '../components/ui.tsx';
import { ScoreBar, StatusBadge } from '../components/data.tsx';
import { BowlArt } from '../components/BowlArt.tsx';
import { Link } from '../lib/router.tsx';
import { useBuild } from '../lib/build-state.tsx';
import { approx, joinList, lowerName, money, plural, sentence, time12 } from '../lib/format.ts';
import { SEASON_LABEL, type Season } from '../research/calendar.ts';
import { CYCLE } from './HowItWorks.tsx';

export function Home() {
  const base = getCurrentBase();
  const build = useBuild();
  const pickup = getPickupInformation().nextPickup;
  const season = base.basket.season;
  const recipes = base.recipes.slice(0, 3);
  const addOns = base.addOns.slice(0, 4);
  const research = getResearchSummary();
  const calendar = getSeasonalCalendar();
  const potatoes = getIngredientBySlug('potatoes');
  const potatoScore = scoreFor(potatoes);
  const foundation = getIngredientRanking({ classification: 'foundation' }).slice(0, 5);
  const expression = getIngredientRanking({ classification: 'expression' });

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>A better base for cooking.</h1>
          <p className="lede">Seasonal ingredients, ready for the week. Pick up locally. Cook whatever you want.</p>
          <div className="actions">
            <ButtonLink href="/base">Explore this week’s Base</ButtonLink>
            <ButtonLink href="/how-it-works" variant="secondary">How Base works</ButtonLink>
          </div>
          <p className="hero-note">
            This week: the <Link href="/base">{SEASON_LABEL[season].toLowerCase()} Base</Link>, {base.lines.length} ingredients
            prepped and portioned{pickup ? `, ready for pickup ${pickup.label.split(',')[0]}` : ''}.
          </p>
        </div>
        <Counter lines={base.lines} labels={false} />
      </section>

      <section className="section" aria-labelledby="this-week">
        <div className="section-head">
          <h2 id="this-week">This week’s Base</h2>
          <p className="section-lede">{base.basket.name}, week of {base.weekLabel}. {base.basket.description}</p>
        </div>
        <div className="week-grid">
          <dl className="facts">
            <div><dt>Ingredients</dt><dd>{base.lines.length}</dd></div>
            <div><dt>Plates for two</dt><dd>about {base.plates}</dd></div>
            <div><dt>Food price</dt><dd>{money(base.cost.foodPrice)} <StatusBadge status="estimated" /></dd></div>
            <div><dt>Per plate</dt><dd>{approx(base.cost.foodPrice / base.plates)}</dd></div>
          </dl>
          <ul className="week-list">
            {base.lines.map((l) => (
              <li key={l.ingredient.slug}>
                <Link href={`/ingredients/${l.ingredient.slug}`}>{l.ingredient.name}</Link>
                <span className="muted">{l.ingredient.prepForm}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="actions">
          <ButtonLink href="/base">See the full Base</ButtonLink>
          <Button variant="secondary" onClick={build.openBuilder}>Build my Base</Button>
        </div>
      </section>

      <section className="section" aria-labelledby="make">
        <div className="section-head">
          <h2 id="make">What you can make</h2>
          <p className="section-lede">Base supplies the ingredients. The community supplies the ideas: {plural(base.recipes.length, 'recipe')} so
            far use only what is in this week’s Base, plus oil and salt.</p>
        </div>
        <div className="recipe-grid">
          {recipes.map((r) => <RecipeCard key={r.recipe.id} recipe={r.recipe} used={r.baseIngredientsUsed} />)}
        </div>
        <p><Link href="/recipes">All recipes for this week</Link></p>
      </section>

      <section className="section" aria-labelledby="expression">
        <div className="section-head">
          <h2 id="expression">Add your own</h2>
          <p className="section-lede">Base is enough. Expression makes it yours. Optional add-ons for the weeks you want a little more.</p>
        </div>
        <div className="addon-grid">
          {addOns.map((a) => <AddOnCard key={a.addOn.id} addOn={a.addOn} reason={a.reason} />)}
        </div>
        <p><Link href="/addons">All {getAddOns().length} add-ons</Link></p>
      </section>

      <section className="section" aria-labelledby="how">
        <div className="section-head">
          <h2 id="how">How it works</h2>
          <p className="section-lede">One weekly rhythm. The ingredients change; the routine doesn’t.</p>
        </div>
        <ol className="cycle cycle-compact">
          {CYCLE.map((c) => <li key={c.title}><strong>{c.title}</strong><span>{c.short}</span></li>)}
        </ol>
        <p><Link href="/how-it-works">How Base works, in detail</Link></p>
      </section>

      <section className="section band" aria-labelledby="pickup">
        <div className="split">
          <div>
            <h2 id="pickup">Pickup, in glass</h2>
            <p>Your Base comes portioned into reusable glass containers. Store them, prep in them, cook from them, and bring
              them back next week. Fewer containers, fewer transfers, less packaging, less cleanup.</p>
            <ol className="flow" aria-label="The container loop">
              {['Pick up', 'Store', 'Prep', 'Cook', 'Eat', 'Return'].map((s) => <li key={s}>{s}</li>)}
            </ol>
            <p>This week’s Base uses {plural(base.containerCount, 'container')}: a {money(base.deposit)} deposit you get back
              when you return them, or {money(base.containerPurchase)} to keep them. <StatusBadge status="demo" /></p>
            <p><Link href="/pickup">Pickup and containers</Link></p>
          </div>
          {pickup && (
            <div className="pickup-card">
              <p className="pickup-card-label">Next pickup</p>
              <p className="pickup-card-when">{pickup.label}</p>
              <p>{time12(pickup.window.start)}–{time12(pickup.window.end)}</p>
              <p className="muted">{pickup.location.name}</p>
              <p className="small"><StatusBadge status="demo" /> Placeholder location. Base has no pickup partner yet.</p>
            </div>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="why">
        <div className="section-head">
          <h2 id="why">Why these ingredients?</h2>
          <p className="section-lede">An ingredient earns its place by being useful again and again, not by being fancy.</p>
        </div>
        <div className="why-grid">
          <article className="why-example">
            <BowlArt visual={potatoes.visual} seed={potatoes.slug} size={120} />
            <h3>Why potatoes?</h3>
            <p>{potatoes.why}</p>
            {potatoScore && <div className="mini-scores">
              <ScoreBar label="Versatility" value={potatoScore.versatility} />
              <ScoreBar label="Affordability" value={potatoScore.affordability} />
              <ScoreBar label="Base Score" value={potatoScore.baseScore} emphasis />
            </div>}
            <p className="small"><StatusBadge status="derived" /> Scores are Base’s method, not objective truths.</p>
          </article>
          <div>
            <h3>Strongest Foundation ingredients this month</h3>
            <ol className="rank-list">
              {foundation.map((r) => (
                <li key={r.ingredient.slug}><Link href={`/ingredients/${r.ingredient.slug}`}>{r.ingredient.name}</Link>
                  <span className="tabular">{Math.round(r.score.baseScore)}</span></li>
              ))}
            </ol>
            <p className="small">Not everything good belongs in the Base. {sentence(joinList(expression.slice(0, 3).map((e) => lowerName(e.ingredient.name))))}
              and others score as Expression: wonderful, but better as optional add-ons.</p>
            <p><Link href="/research/ingredients">See the full ranking</Link></p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="seasonal">
        <div className="section-head">
          <h2 id="seasonal">Seasonal and local</h2>
          <p className="section-lede">Eat what’s good, useful, affordable and available now. The Base changes with BC’s growing year.</p>
        </div>
        <div className="seasons">
          {(['winter', 'spring', 'summer', 'fall'] as Season[]).map((s) => (
            <div key={s} className={`season-col season-${s}${s === season ? ' is-now' : ''}`}>
              <h3>{SEASON_LABEL[s]}{s === season && <span className="pill">Now</span>}</h3>
              <ul>{calendar[s].slice(0, 7).map((i) => <li key={i.slug}><Link href={`/ingredients/${i.slug}`}>{i.name}</Link></li>)}</ul>
            </div>
          ))}
        </div>
        <p className="small"><StatusBadge status="estimated" /> Seasonality is Base’s estimate of BC availability. Suppliers shown on this site are demo placeholders; Base has no supplier relationships yet.</p>
      </section>

      <section className="section" aria-labelledby="research">
        <div className="split">
          <div>
            <h2 id="research">The Base Index</h2>
            <p>Every week’s Base is the output of a small, open research system: {research.ingredientCount} ingredients scored on
              affordability, versatility, nutrition, seasonal availability and price stability, then composed into a basket by
              published rules. Every number traces back to a source and says how much to trust it.</p>
            <p><Link href="/research">How we choose what belongs in Base</Link></p>
          </div>
          <div>
            <dl className="status-tally">
              <div><dt><StatusBadge status="verified" /></dt><dd>{research.statusCounts.verified ?? 0}</dd></div>
              <div><dt><StatusBadge status="estimated" /></dt><dd>{research.statusCounts.estimated ?? 0}</dd></div>
              <div><dt><StatusBadge status="demo" /></dt><dd>{research.statusCounts.demo ?? 0}</dd></div>
            </dl>
            <p className="small muted">Ingredient datasets (nutrition, price, seasonality, price history) by verification state. Nothing is verified yet, and the site says so.</p>
          </div>
        </div>
      </section>

      <section className="cta-band" aria-labelledby="cta">
        <h2 id="cta">Build your Base</h2>
        <p>Start from this week’s ingredients, add anything you like, and choose how you want your containers.</p>
        <Button onClick={build.openBuilder}>Build my Base</Button>
      </section>
    </>
  );
}
