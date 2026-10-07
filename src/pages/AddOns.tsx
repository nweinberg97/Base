import { useState } from 'react';
import { currentSeason, getAddOns, getCurrentBase, getIngredientRanking } from '../data/api.ts';
import { AddOnCard } from '../components/cards.tsx';
import { FilterChips, Button } from '../components/ui.tsx';
import { StatusBadge } from '../components/data.tsx';
import { Link } from '../lib/router.tsx';
import { useBuild } from '../lib/build-state.tsx';
import { ADD_ON_CATEGORY_LABEL, lowerName } from '../lib/format.ts';
import { SEASON_LABEL } from '../research/calendar.ts';

type Cat = 'all' | 'premium_protein' | 'flavor' | 'specialty' | 'treat';

export function AddOnsPage() {
  const season = currentSeason();
  const base = getCurrentBase();
  const build = useBuild();
  const [cat, setCat] = useState<Cat>('all');
  const inSeason = getAddOns({ season });
  const shown = inSeason.filter((a) => cat === 'all' || a.category === cat);
  const later = getAddOns().filter((a) => !a.seasons.includes(season));
  const reasons = new Map(base.addOns.map((a) => [a.addOn.id, a.reason]));
  const expression = getIngredientRanking({ classification: 'expression' });

  return (
    <article className="page">
      <header className="page-head">
        <h1>Add-ons</h1>
        <p className="lede">Base is enough. Expression makes it yours. Every add-on is optional: the Foundation is designed to be complete without them.</p>
        <p className="small"><StatusBadge status="demo" /> Add-on products and prices are illustrative. Nothing can be bought yet.</p>
      </header>
      <FilterChips label="Category" value={cat} onChange={setCat}
        options={[{ value: 'all', label: 'Everything' }, ...(['premium_protein', 'flavor', 'specialty', 'treat'] as const).map((c) => ({
          value: c, label: ADD_ON_CATEGORY_LABEL[c], count: inSeason.filter((a) => a.category === c).length,
        }))]} />
      <h2 className="visually-hidden">Available this {SEASON_LABEL[season].toLowerCase()}</h2>
      <div className="addon-grid">{shown.map((a) => <AddOnCard key={a.id} addOn={a} reason={reasons.get(a.id)} />)}</div>
      {build.addOnIds.length > 0 && <div className="sticky-cta"><Button onClick={build.openBuilder}>Review my Base ({build.addOnIds.length} add-on{build.addOnIds.length > 1 ? 's' : ''})</Button></div>}

      {later.length > 0 && (
        <section className="section" aria-labelledby="later">
          <h2 id="later">Later in the year</h2>
          <ul className="plain inline-list">{later.map((a) => <li key={a.id}>{a.name} <span className="muted">({a.seasons.map((s) => SEASON_LABEL[s as keyof typeof SEASON_LABEL]).join(', ')})</span></li>)}</ul>
        </section>
      )}

      <section className="section band" aria-labelledby="why-addons">
        <h2 id="why-addons">Why some ingredients are add-ons</h2>
        <p>The research engine doesn’t only rank ingredients; it decides which ones belong in the Foundation. Ingredients that are premium per
          serving, or rich in fat or sodium, are classed as Expression: wonderful, but better chosen than included. This month that means
          {' '}{expression.map((e, i) => <span key={e.ingredient.slug}>{i > 0 && (i === expression.length - 1 ? ' and ' : ', ')}<Link href={`/ingredients/${e.ingredient.slug}`}>{lowerName(e.ingredient.name)}</Link></span>)}.</p>
        <p>Add-ons also help Base: they raise the average order without making the Base itself any less complete.</p>
        <p><Link href="/research">How the classification works</Link></p>
      </section>
    </article>
  );
}
