import { useMemo, useState } from 'react';
import {
  getBasketsForIngredient, getIngredientBySlug, getIngredients, getRecipesForIngredient, getSource, getSupplier,
  formatWeek, getUseCase, referenceMonth, scoreFor,
} from '../data/api.ts';
import type { Ingredient } from '../data/types.ts';
import { BowlArt } from '../components/BowlArt.tsx';
import { FoodPhoto } from '../components/Photo.tsx';
import { IngredientRow, RecipeCard } from '../components/cards.tsx';
import { EmptyState, FilterChips } from '../components/ui.tsx';
import { DataValue, NutritionTable, ScorePanel, SeasonStrip, SourceCitation, Sparkline, StatusBadge } from '../components/data.tsx';
import { Link } from '../lib/router.tsx';
import { approx, CATEGORY_LABEL, CLASS_LABEL, lowerName, money, STORAGE_LABEL } from '../lib/format.ts';
import { MONTH_NAMES } from '../research/calendar.ts';

type CatFilter = 'all' | string;
type RoleFilter = 'all' | 'foundation' | 'supporting' | 'expression';

export function IngredientsIndex() {
  const month = referenceMonth();
  const all = getIngredients();
  const [cat, setCat] = useState<CatFilter>('all');
  const [role, setRole] = useState<RoleFilter>('all');
  const [inSeason, setInSeason] = useState(false);
  const [query, setQuery] = useState('');
  const list = useMemo(() => getIngredients({
    category: cat === 'all' ? undefined : cat,
    classification: role === 'all' ? undefined : role,
    inSeason, query,
  }).sort((a, b) => a.name.localeCompare(b.name)), [cat, role, inSeason, query]);

  const cats = ['protein', 'legume', 'grain', 'vegetable', 'green', 'aromatic', 'fruit', 'dairy', 'herb', 'pantry'];
  return (
    <article className="page">
      <header className="page-head">
        <h1>Ingredients</h1>
        <p className="lede">Every ingredient Base considers, with what it costs, how it’s used, when it’s in season, and whether it belongs
          in the Foundation or works better as an add-on.</p>
      </header>
      <div className="filters" role="search">
        <label className="search">
          <span className="visually-hidden">Search ingredients</span>
          <input type="search" placeholder="Search ingredients" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <FilterChips label="Type" value={cat} onChange={setCat}
          options={[{ value: 'all', label: 'All types' }, ...cats.map((c) => ({ value: c, label: CATEGORY_LABEL[c], count: all.filter((i) => i.category === c).length }))]} />
        <FilterChips label="Role" value={role} onChange={(v) => setRole(v as RoleFilter)}
          options={[{ value: 'all', label: 'Any role' }, { value: 'foundation', label: 'Foundation' }, { value: 'supporting', label: 'Supporting' }, { value: 'expression', label: 'Expression' }]} />
        <label className="toggle">
          <input type="checkbox" checked={inSeason} onChange={(e) => setInSeason(e.target.checked)} />
          <span>In season in {MONTH_NAMES[month - 1]}</span>
        </label>
      </div>
      <p className="results-count" role="status">{list.length} of {all.length} ingredients</p>
      {list.length ? (
        <ul className="ingredient-list">{list.map((i) => <IngredientRow key={i.slug} ingredient={i} month={month} />)}</ul>
      ) : (
        <EmptyState title="No ingredients match" action={<button className="link-btn" onClick={() => { setCat('all'); setRole('all'); setInSeason(false); setQuery(''); }}>Clear filters</button>}>
          Try a different type, or turn off “in season”.
        </EmptyState>
      )}
    </article>
  );
}

function tagline(i: Ingredient, cls: string | undefined): string[] {
  const s = scoreFor(i);
  const tags: string[] = [];
  if (s && s.affordability >= 55) tags.push('Affordable');
  if (s && s.versatility >= 65) tags.push('Versatile');
  const perServing = i.servingSizeG / 100;
  if (i.nutrition.protein * perServing >= 10) tags.push('Protein-rich');
  if ((i.nutrition.fiber ?? 0) * perServing >= 4) tags.push('Fibre-rich');
  if (cls === 'expression') tags.push('Best as an add-on');
  return tags.slice(0, 3);
}

export function IngredientDetail({ slug }: { slug: string }) {
  const i = getIngredientBySlug(slug);
  const month = referenceMonth();
  const s = scoreFor(i, month);
  const supplier = getSupplier(i.price.supplierId);
  const baskets = getBasketsForIngredient(i.id);
  const recipes = getRecipesForIngredient(i.id);
  const perServing = s?.costPerServing;
  const proteinPerServing = (i.nutrition.protein * i.servingSizeG) / 100;
  const kcalPerServing = (i.nutrition.calories * i.servingSizeG) / 100;
  const fiberPerServing = ((i.nutrition.fiber ?? 0) * i.servingSizeG) / 100;
  const groups = { meal: [] as string[], dish: [] as string[], technique: [] as string[] };
  for (const u of i.useCases) { const uc = getUseCase(u); if (uc) groups[uc.group].push(uc.name); }

  return (
    <article className="page ingredient-page">
      <header className="ingredient-head">
        {i.photo
          ? <FoodPhoto photo={i.photo} eager className="ingredient-photo"
              caption={i.isPantryBasic ? 'Representative photo.' : `Representative photo. In your Base: ${i.prepForm}.`} />
          : <BowlArt visual={i.visual} seed={i.slug} size={220} label={`${i.name}, illustrated in a bowl`} />}
        <div>
          <p className="kicker">{CATEGORY_LABEL[i.category]}{s && <span className={`role role-${s.classification}`}>{CLASS_LABEL[s.classification]}</span>}</p>
          <h1>{i.name}</h1>
          <p className="tagline">{tagline(i, s?.classification).join(' · ')}</p>
          <p className="lede">{i.description}</p>
          {i.isPantryBasic && <p className="note">A pantry basic: recipes assume you have it, so it is never part of a Base and isn’t scored.</p>}
        </div>
      </header>

      {!i.isPantryBasic && (
        <section className="section editorial" aria-labelledby="why">
          <h2 id="why">Why Base likes it</h2>
          <p className="why-text">{i.why}</p>
          <p className="small muted">Editorial: Base’s own view, informed by the data below.</p>
        </section>
      )}

      <section className="section" aria-labelledby="facts">
        <h2 id="facts">The facts</h2>
        <p className="section-lede">Data from outside Base, each with its source and how far to trust it.</p>
        <div className="facts-grid">
          <div>
            <h3>Price</h3>
            <dl className="datavalues">
              <DataValue label="Price" value={money(i.price.price)} unit={`per ${i.price.unit}`} status={i.price.status} />
              <DataValue label="Per kilogram" value={approx(i.price.pricePerKg)} status={i.price.status} />
              {perServing !== undefined && <DataValue label={`Per serving (${i.servingSizeG} g ${i.purchaseForm})`} value={approx(perServing)} status="derived" />}
            </dl>
            <SourceCitation sourceId={i.price.sourceId} status={i.price.status} note={i.price.notes} />
            <div className="history">
              <h4>Price over the last 12 months</h4>
              <Sparkline values={i.history.map((h) => h.price)} label={`Price history for ${i.name}: from ${money(i.history[0]?.price ?? 0)} to ${money(i.history[i.history.length - 1]?.price ?? 0)}`} />
              <SourceCitation sourceId={i.historySourceId} status={i.historyStatus} />
            </div>
          </div>
          <div>
            <h3>Nutrition</h3>
            <dl className="datavalues">
              <DataValue label="Protein per serving" value={`${Math.round(proteinPerServing * 10) / 10} g`} status={i.nutrition.status} />
              <DataValue label="Energy per serving" value={`${Math.round(kcalPerServing)} kcal`} status={i.nutrition.status} />
              <DataValue label="Fibre per serving" value={`${Math.round(fiberPerServing * 10) / 10} g`} status={i.nutrition.status} />
            </dl>
            <NutritionTable ingredient={i} />
            <SourceCitation sourceId={i.nutrition.sourceId} status={i.nutrition.status} note={i.nutrition.notes} />
          </div>
          <div>
            <h3>Season and sourcing</h3>
            <SeasonStrip availability={i.seasonality.availability} local={i.seasonality.local} current={month} />
            <SourceCitation sourceId={i.seasonality.sourceId} status={i.seasonality.status} />
            <dl className="plain-dl">
              <div><dt>Region</dt><dd>{supplier?.region ?? 'Not recorded'}</dd></div>
              <div><dt>Supplier</dt><dd>{supplier ? <>{supplier.name} <StatusBadge status={supplier.status} /></> : 'Not recorded'}</dd></div>
              <div><dt>Storage</dt><dd>{STORAGE_LABEL[i.storageType]}, about {i.shelfLifeDays} days as handed over</dd></div>
              <div><dt>How Base prepares it</dt><dd>{i.prepForm}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      {!i.isPantryBasic && (
        <section className="section" aria-labelledby="uses">
          <h2 id="uses">{i.useCases.length} ways to use it</h2>
          <div className="uses">
            {(['meal', 'dish', 'technique'] as const).map((g) => groups[g].length > 0 && (
              <div key={g}><h3>{g === 'meal' ? 'Meals' : g === 'dish' ? 'Dishes' : 'Techniques'}</h3><p>{groups[g].join(', ')}</p></div>
            ))}
          </div>
          <SourceCitation sourceId={i.useCasesSourceId} status="estimated" />
        </section>
      )}

      {s && (
        <section className="section" aria-labelledby="scores">
          <h2 id="scores">How Base scores it in {MONTH_NAMES[month - 1]}</h2>
          <p className="section-lede">Base’s interpretation, calculated from the facts above. These are Base-derived, not objective measures.</p>
          <div className="two-col">
            <ScorePanel score={s} />
            <div>
              <h3>{CLASS_LABEL[s.classification]}</h3>
              <p>{s.classification === 'foundation' ? 'Strong enough across cost, versatility and nutrition to be a regular in the Base.'
                : s.classification === 'expression' ? 'Wonderful, but premium per serving or rich, so Base offers it as an optional add-on rather than building the week on it.'
                  : 'Useful and good value, but not quite strong enough to anchor a week on its own. It rotates in when the season is right.'}</p>
              <p className="small muted">Confidence: {s.confidence}. Every input is estimated or demo data, so no score is high-confidence yet.</p>
              <p><Link href="/research">How these scores work</Link> · <Link href={`/research/ingredients?compare=${i.slug}`}>Compare</Link></p>
            </div>
          </div>
        </section>
      )}

      {baskets.length > 0 && (
        <section className="section" aria-labelledby="in-base">
          <h2 id="in-base">In these Bases</h2>
          <ul className="plain inline-list">{baskets.map((b) => <li key={b.slug}><Link href={`/baskets/${b.slug}`}>{b.name}{b.weekOf ? `, week of ${formatWeek(b.weekOf)}` : ''}{b.diet === 'plant_forward' && !/plant-forward/i.test(b.name) ? ' (plant-forward)' : ''}</Link></li>)}</ul>
        </section>
      )}

      {recipes.length > 0 && (
        <section className="section" aria-labelledby="recipes">
          <h2 id="recipes">Recipes with {lowerName(i.name)}</h2>
          <div className="recipe-grid">{recipes.slice(0, 3).map((r) => <RecipeCard key={r.id} recipe={r} />)}</div>
        </section>
      )}

      <section className="section" aria-labelledby="prov">
        <Details2 title="Every source for this ingredient">
          <div className="table-wrap"><table className="table">
            <thead><tr><th scope="col">Data</th><th scope="col">Source</th><th scope="col">State</th><th scope="col">Collected</th></tr></thead>
            <tbody>{i.provenance.map((p) => (
              <tr key={p.datumType}><td>{p.datumType.replace('_', ' ')}</td><td><a href={getSource(p.sourceId)?.url} target="_blank" rel="noreferrer">{getSource(p.sourceId)?.name}</a></td>
                <td><StatusBadge status={p.status} /></td><td className="tabular">{p.collectedAt}</td></tr>
            ))}</tbody>
          </table></div>
        </Details2>
      </section>
    </article>
  );
}

function Details2({ title, children }: { title: string; children: React.ReactNode }) {
  return <details className="details"><summary><span id="prov">{title}</span></summary><div className="details-body">{children}</div></details>;
}
