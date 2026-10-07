import { useEffect, useMemo, useState } from 'react';
import {
  getIngredientBySlug, getIngredientRanking, getIngredients, getRankingAnswers, getResearchSummary, getSeasonalCalendar,
  getSource, getSources, referenceMonth, scoreFor, snapshot, type RankingKey,
} from '../data/api.ts';
import type { DataStatus, Ingredient } from '../data/types.ts';
import { SeasonStrip, StatusBadge, STATUS_INFO } from '../components/data.tsx';
import { FilterChips, EmptyState } from '../components/ui.tsx';
import { Link } from '../lib/router.tsx';
import { approx, CATEGORY_LABEL, CLASS_LABEL, score as fmt } from '../lib/format.ts';
import { BASE_SCORE_WEIGHTS, COMPARISON_GROUPS, VERSATILITY_TARGETS } from '../research/scoring.ts';
import { BUILDER_RULES, slotsFor } from '../research/basket-builder.ts';
import { MONTH_NAMES } from '../research/calendar.ts';

const pct = (w: number) => `${Math.round(w * 100)}%`;

const METRICS = [
  { name: 'Affordability', weight: BASE_SCORE_WEIGHTS.affordability, means: 'What a serving costs, compared with foods that do the same job on a plate.',
    how: 'Cost per serving (estimated BC retail price × serving size), placed on a log scale between the cheapest (100) and most expensive (0) ingredient in its group: protein foods, staples, or produce.' },
  { name: 'Versatility', weight: BASE_SCORE_WEIGHTS.versatility, means: 'How many different meals, dishes and techniques it suits.',
    how: `60% breadth: documented uses relative to the most versatile ingredient. 40% diversity: coverage of meals (full at ${VERSATILITY_TARGETS.meal}), dishes (${VERSATILITY_TARGETS.dish}) and techniques (${VERSATILITY_TARGETS.technique}).` },
  { name: 'Nutrition', weight: BASE_SCORE_WEIGHTS.nutrition, means: 'How much protein and fibre it delivers for its calories.',
    how: 'Half protein (full marks at 10 g per 100 kcal), half fibre (full marks at 5 g per 100 kcal), minus up to 25 points for sodium (full penalty at 600 mg per 100 kcal). It does not call any food healthy or unhealthy.' },
  { name: 'Availability', weight: BASE_SCORE_WEIGHTS.availability, means: 'Whether it’s in season in BC this month.',
    how: 'Base’s estimate of BC availability for the month, including storage crops, from 0 to 100.' },
  { name: 'Price stability', weight: BASE_SCORE_WEIGHTS.priceStability, means: 'How much its price moved over a year.',
    how: '100 minus the coefficient of variation of 12 monthly prices, scaled so 25% variation scores 0. Needs at least 6 observations. The current history is demo data.' },
];

export function ResearchPage() {
  const summary = getResearchSummary();
  const answers = getRankingAnswers();
  const calendar = getSeasonalCalendar();
  const seasonalRows = [...new Map([...calendar.winter, ...calendar.spring, ...calendar.summer, ...calendar.fall].map((i) => [i.slug, i])).values()]
    .sort((a, b) => peakMonth(a) - peakMonth(b) || a.name.localeCompare(b.name));
  const month = summary.month;
  const slots = slotsFor('omnivore');

  return (
    <article className="page research">
      <header className="page-head">
        <p className="kicker">The Base Index</p>
        <h1>How we choose what belongs in Base</h1>
        <p className="lede">Every week’s Base comes out of an open research process. It scores {summary.ingredientCount} ingredients on five
          measures, decides which belong in the Foundation, and composes a basket by published rules. All of it is reproducible from the
          code and data in the repository.</p>
        <p><Link href="/research/ingredients">Ingredient rankings</Link> · <Link href="/research/data">Data and provenance</Link></p>
      </header>

      <section className="section" aria-labelledby="measure">
        <h2 id="measure">What we measure</h2>
        <p className="section-lede">Five Base-derived scores, combined into a Base Score with these weights. They are a methodology, not
          objective truths, and are labelled <StatusBadge status="derived" /> wherever they appear.</p>
        <div className="metrics">
          {METRICS.map((m) => (
            <div className="metric" key={m.name}>
              <h3>{m.name} <span className="metric-weight">{pct(m.weight)} of the Base Score</span></h3>
              <p>{m.means}</p>
              <p className="small muted">{m.how}</p>
            </div>
          ))}
        </div>
        <p className="small">Base Score = {Object.entries(BASE_SCORE_WEIGHTS).map(([k, w]) => `${pct(w)} ${k.replace(/([A-Z])/g, ' $1').toLowerCase()}`).join(' + ')}.
          If a measure can’t be scored (for example, too little price history), its weight is shared among the others.</p>
      </section>

      <section className="section two-col" aria-labelledby="sources">
        <div>
          <h2 id="sources">What comes from outside</h2>
          <ul className="plain">
            <li>Nutrition per 100 g <StatusBadge status="estimated" /></li>
            <li>Current BC retail prices <StatusBadge status="estimated" /></li>
            <li>12-month price history <StatusBadge status="demo" /></li>
            <li>BC seasonal availability <StatusBadge status="estimated" /></li>
            <li>Culinary use cases <StatusBadge status="estimated" /></li>
          </ul>
          <p className="small">Every one of these values is stored with a source name, source URL, date collected, region, source type and
            verification state. Nothing is shown without them.</p>
        </div>
        <div>
          <h2>What Base calculates</h2>
          <ul className="plain">
            <li>Cost per serving <StatusBadge status="derived" /></li>
            <li>The five scores and the Base Score <StatusBadge status="derived" /></li>
            <li>Foundation, supporting or expression <StatusBadge status="derived" /></li>
            <li>The weekly baskets, quantities and costs <StatusBadge status="derived" /></li>
            <li>Which recipes fit which basket <StatusBadge status="derived" /></li>
          </ul>
          <p className="small">Derived values are never stored by hand. <code>npm run research:rank</code> and <code>npm run research:baskets</code> rebuild them from the source data.</p>
        </div>
      </section>

      <section className="section" aria-labelledby="states">
        <h2 id="states">Four states of trust</h2>
        <dl className="states">
          {(['verified', 'estimated', 'derived', 'demo'] as DataStatus[]).map((s) => (
            <div key={s}><dt><StatusBadge status={s} /></dt><dd>{STATUS_INFO[s].help}</dd></div>
          ))}
        </dl>
        <p className="note">Today, none of Base’s external data is verified. Nutrition and prices are estimates waiting to be checked
          against their sources, and the price history is demo data. The research engine works; its inputs still need verifying, and the
          interface doesn’t pretend otherwise. <Link href="/research/data">See the provenance of every number</Link></p>
      </section>

      <section className="section" aria-labelledby="classes">
        <h2 id="classes">Foundation first. Choice second.</h2>
        <p className="section-lede">Not every good ingredient belongs in the Base. In {summary.monthLabel}:</p>
        <div className="classes">
          <div><p className="class-count">{summary.classes.foundation}</p><h3>Foundation</h3><p>Base Score of 60 or more, versatility of at least 40,
            and not premium. The ingredients a week is built on.</p></div>
          <div><p className="class-count">{summary.classes.supporting}</p><h3>Supporting</h3><p>Useful and good value, rotating in when the season is right.</p></div>
          <div><p className="class-count">{summary.classes.expression}</p><h3>Expression</h3><p>Premium per serving (affordability under 15),
            or rich: over 65% of calories from fat or over 400 mg sodium per 100 g. Better as an optional add-on.</p></div>
        </div>
      </section>

      <section className="section" aria-labelledby="build">
        <h2 id="build">From scores to a basket</h2>
        <p className="section-lede">Picking the top twelve scores would give you five legumes and no vegetables. Instead, the builder fills
          roles, so every Base is useful on its own.</p>
        <div className="table-wrap">
          <table className="table">
            <caption className="visually-hidden">Basket roles</caption>
            <thead><tr><th scope="col">Role</th><th scope="col" className="num">Picks</th><th scope="col" className="num">Servings each</th><th scope="col">Rotates weekly</th></tr></thead>
            <tbody>{slots.map((s) => (
              <tr key={s.slot}><th scope="row">{s.label}</th><td className="num tabular">{s.count}</td><td className="num tabular">{s.servings}</td><td>{s.rotate ? 'Yes' : 'No'}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <ul className="rules">
          <li><strong>In season only.</strong> At least {BUILDER_RULES.minAvailability}% estimated availability this month, and never an Expression ingredient.</li>
          <li><strong>Peak-season bonus.</strong> Produce at its peak gains up to {BUILDER_RULES.peakBonusScale} points, scaled by how seasonal it is, so a summer Base looks like summer.</li>
          <li><strong>A signature vegetable.</strong> At least one vegetable must be truly seasonal and at its peak now.</li>
          <li><strong>Variety.</strong> No two vegetables from the same family.</li>
          <li><strong>Rotation.</strong> Anything in last week’s Base loses {BUILDER_RULES.rotationPenalty} points in rotating roles.</li>
          <li><strong>Storage.</strong> At least one vegetable keeps a full week ({BUILDER_RULES.longKeepingDays}+ days).</li>
          <li><strong>Budget.</strong> If ingredients cost more than ${BUILDER_RULES.budget} for two, the priciest rotating pick is swapped for the next cheaper option.</li>
          <li><strong>Deterministic.</strong> Ties break alphabetically. The same data and week always produce the same Base.</li>
        </ul>
        <p><Link href="/base">See the reasons behind this week’s Base</Link></p>
      </section>

      <section className="section" aria-labelledby="calendar">
        <h2 id="calendar">The seasonal calendar</h2>
        <p className="section-lede">Estimated BC availability for ingredients whose availability changes through the year. Darker means more
          available; a dot means grown locally that month. <StatusBadge status="estimated" /></p>
        <div className="calendar" role="table" aria-label="Seasonal availability by month">
          <div className="calendar-row calendar-head" role="row">
            <span role="columnheader">Ingredient</span>
            <span role="columnheader" className="calendar-months">{MONTH_NAMES.map((m, i) => <abbr key={m} title={m} data-current={i + 1 === month || undefined}>{m.slice(0, 3)}</abbr>)}</span>
          </div>
          {seasonalRows.map((i) => (
            <div className="calendar-row" role="row" key={i.slug}>
              <span role="rowheader"><Link href={`/ingredients/${i.slug}`}>{i.name}</Link></span>
              <span role="cell"><SeasonStrip availability={i.seasonality.availability} local={i.seasonality.local} current={month} compact /></span>
            </div>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="questions">
        <h2 id="questions">Questions the Index answers</h2>
        <p className="section-lede">Each is a named, reproducible query in <code>db/queries/rankings.sql</code>, for {summary.monthLabel}.</p>
        <div className="answers">
          {answers.map((a) => (
            <div className="answer" key={a.key}>
              <h3>{a.question}</h3>
              <ol>{a.rows.slice(0, 5).map((r) => <li key={r.ingredient.slug}><Link href={`/ingredients/${r.ingredient.slug}`}>{r.ingredient.name}</Link></li>)}</ol>
            </div>
          ))}
        </div>
        <p><Link href="/research/ingredients">Explore the full ranking</Link></p>
      </section>

      <section className="section" aria-labelledby="limits">
        <h2 id="limits">Limitations</h2>
        <ul className="plain">
          <li>Prices are Base estimates of typical BC retail prices, not supplier quotes and not real-time. Calibrating against Statistics Canada’s average retail price table is the next step.</li>
          <li>Nutrition values are approximate reference values for the purchase form (dry legumes, raw vegetables), not verified entry by entry.</li>
          <li>The nutrition score rewards protein and fibre per calorie. It says nothing about vitamins, minerals or what any one person should eat.</li>
          <li>Seasonality is an editorial estimate, including storage crops. A sourced growers’ calendar should replace it.</li>
          <li>Price history is synthetic demo data, so price stability scores demonstrate the method rather than real volatility.</li>
          <li>Versatility counts documented uses from an editorial catalogue; it reflects Base’s cooking judgement.</li>
          <li>Suppliers and pickup locations are demo placeholders. Base has no real supplier or pickup relationships.</li>
        </ul>
        <p className="small">Methodology version {summary.methodologyVersion}, basket builder {summary.builderVersion}. Snapshot generated {summary.generatedAt.slice(0, 10)}.</p>
      </section>
    </article>
  );
}

function peakMonth(i: Ingredient): number {
  const a = i.seasonality.availability;
  return a.indexOf(Math.max(...a));
}

// ---------------------------------------------------------------- rankings

const COLUMNS: { key: RankingKey; label: string }[] = [
  { key: 'affordability', label: 'Affordability' },
  { key: 'versatility', label: 'Versatility' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'availability', label: 'Availability' },
  { key: 'baseScore', label: 'Base Score' },
];

export function ResearchIngredients() {
  const [by, setBy] = useState<RankingKey>('baseScore');
  const [month, setMonth] = useState(referenceMonth());
  const [cat, setCat] = useState('all');
  const rows = useMemo(() => getIngredientRanking({ by, month, category: cat === 'all' ? undefined : cat }), [by, month, cat]);

  const [compare, setCompare] = useState<string[]>(['chicken-thighs', 'sockeye-salmon', 'chickpeas']);
  // Read ?compare= after hydration so the server and client render the same first frame.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('compare');
    if (q) setCompare((cur) => [q, ...cur].filter((s, i, a) => a.indexOf(s) === i).slice(0, 3));
  }, []);

  const cats = ['protein', 'legume', 'grain', 'vegetable', 'green', 'aromatic', 'fruit', 'dairy', 'herb'];
  return (
    <article className="page">
      <header className="page-head">
        <p className="kicker"><Link href="/research">The Base Index</Link></p>
        <h1>Ingredient rankings</h1>
        <p className="lede">Every scored ingredient, by month. Select a column heading to sort. All scores are <StatusBadge status="derived" />.</p>
      </header>
      <div className="filters">
        <label className="select">
          <span>Month</span>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}{i + 1 === referenceMonth() ? ' (this week)' : ''}</option>)}
          </select>
        </label>
        <FilterChips label="Type" value={cat} onChange={setCat}
          options={[{ value: 'all', label: 'All types' }, ...cats.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))]} />
      </div>
      {rows.length ? (
        <div className="table-wrap">
          <table className="table ranking">
            <caption className="visually-hidden">Ingredient ranking for {MONTH_NAMES[month - 1]}, sorted by {COLUMNS.find((c) => c.key === by)?.label ?? 'cost'}</caption>
            <thead><tr>
              <th scope="col">#</th>
              <th scope="col">Ingredient</th>
              <th scope="col" aria-sort={by === 'costPerServing' ? 'ascending' : 'none'} className="num">
                <button className="sort" onClick={() => setBy('costPerServing')}>Per serving</button></th>
              {COLUMNS.map((c) => (
                <th key={c.key} scope="col" className="num" aria-sort={by === c.key ? 'descending' : 'none'}>
                  <button className="sort" onClick={() => setBy(c.key)}>{c.label}</button></th>
              ))}
              <th scope="col">Role</th>
              <th scope="col">Confidence</th>
            </tr></thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.ingredient.slug}>
                  <td className="tabular muted">{idx + 1}</td>
                  <th scope="row"><Link href={`/ingredients/${r.ingredient.slug}`}>{r.ingredient.name}</Link></th>
                  <td className="num tabular">{approx(r.score.costPerServing)}</td>
                  {COLUMNS.map((c) => <td key={c.key} className={`num tabular${by === c.key ? ' is-sorted' : ''}`}>
                    <span className="cell-bar" style={{ ['--v' as string]: `${r.score[c.key] ?? 0}%` }}>{fmt(r.score[c.key] as number)}</span></td>)}
                  <td><span className={`role role-${r.score.classification}`}>{CLASS_LABEL[r.score.classification]}</span></td>
                  <td>{r.score.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="No ingredients of this type" />}

      <Compare compare={compare} setCompare={setCompare} month={month} />
    </article>
  );
}

function Compare({ compare, setCompare, month }: { compare: string[]; setCompare: (s: string[]) => void; month: number }) {
  const all = getIngredients().sort((a, b) => a.name.localeCompare(b.name));
  const items = compare.map((slug) => all.find((i) => i.slug === slug)).filter((i): i is Ingredient => !!i);
  const metric = (i: Ingredient) => {
    const s = scoreFor(i, month)!;
    const k = i.servingSizeG / 100;
    return [
      ['Cost per serving', approx(s.costPerServing)],
      ['Protein per serving', `${Math.round(i.nutrition.protein * k * 10) / 10} g`],
      ['Fibre per serving', `${Math.round((i.nutrition.fiber ?? 0) * k * 10) / 10} g`],
      ['Versatility', fmt(s.versatility)],
      ['Availability', fmt(s.availability)],
      ['Price stability', fmt(s.priceStability)],
      ['Base Score', fmt(s.baseScore)],
      ['Role', CLASS_LABEL[s.classification]],
    ] as const;
  };
  return (
    <section className="section" aria-labelledby="compare">
      <h2 id="compare">Compare</h2>
      <p className="section-lede">Side by side, using Base’s methodology for {MONTH_NAMES[month - 1]}. Serving sizes differ by ingredient and are shown.</p>
      <div className="compare-pickers">
        {[0, 1, 2].map((n) => (
          <label key={n} className="select">
            <span>Ingredient {n + 1}</span>
            <select value={compare[n] ?? ''} onChange={(e) => { const next = [...compare]; next[n] = e.target.value; setCompare(next); }}>
              {all.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
            </select>
          </label>
        ))}
      </div>
      <div className="table-wrap">
        <table className="table compare-table">
          <caption className="visually-hidden">Comparison of {items.map((i) => i.name).join(', ')}</caption>
          <thead><tr><th scope="col">Measure</th>{items.map((i) => <th key={i.slug} scope="col">{i.name}<span className="muted small"> ({i.servingSizeG} g {i.purchaseForm.split(',')[0]})</span></th>)}</tr></thead>
          <tbody>
            {items.length > 0 && metric(items[0]).map(([label], row) => (
              <tr key={label}><th scope="row">{label}</th>{items.map((i) => <td key={i.slug} className="tabular">{metric(i)[row][1]}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- data provenance

export function ResearchData() {
  const s = snapshot();
  const sources = getSources();
  const scorable = s.ingredients.filter((i) => !i.isPantryBasic);
  const datumStatus = (i: Ingredient) => ({
    nutrition: i.nutrition.status, price: i.price.status, history: i.historyStatus, seasonality: i.seasonality.status,
    uses: i.useCases.length ? 'estimated' : 'demo',
  });
  const types = ['nutrition', 'price', 'history', 'seasonality', 'uses'] as const;
  const tally = (t: (typeof types)[number], st: string) => scorable.filter((i) => datumStatus(i)[t] === st).length;
  const usedBy = (id: number) => scorable.filter((i) => i.provenance.some((p) => p.sourceId === id)).length;
  void getIngredientBySlug;

  return (
    <article className="page">
      <header className="page-head">
        <p className="kicker"><Link href="/research">The Base Index</Link></p>
        <h1>Data and provenance</h1>
        <p className="lede">Where every number comes from, and how far to trust it. Research data has a source; demo data exists only to make
          the prototype work. Base keeps the two visibly apart.</p>
      </header>

      <section className="section" aria-labelledby="by-state">
        <h2 id="by-state">Every dataset, by state</h2>
        <div className="table-wrap">
          <table className="table">
            <caption className="visually-hidden">Count of ingredients by data type and verification state</caption>
            <thead><tr><th scope="col">Data</th>{(['verified', 'estimated', 'demo'] as const).map((st) => <th key={st} scope="col" className="num"><StatusBadge status={st} /></th>)}</tr></thead>
            <tbody>{types.map((t) => (
              <tr key={t}><th scope="row">{{ nutrition: 'Nutrition', price: 'Current price', history: 'Price history', seasonality: 'Seasonality', uses: 'Use cases' }[t]}</th>
                {(['verified', 'estimated', 'demo'] as const).map((st) => <td key={st} className="num tabular">{tally(t, st)}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
        <p className="small muted">Counts of the {scorable.length} scored ingredients. Database totals: {s.counts.prices} current prices,
          {' '}{s.counts.price_history} price observations, {s.counts.seasonality} seasonality records, {s.counts.ingredient_use_cases} ingredient–use links,
          {' '}{s.counts.derived_scores} derived scores.</p>
      </section>

      <section className="section" aria-labelledby="sources">
        <h2 id="sources">Sources</h2>
        <p className="section-lede">A source is where a piece of information came from. It is never the same thing as a supplier.</p>
        <ul className="source-list">
          {sources.map((src) => (
            <li key={src.id} className="source">
              <h3><a href={src.url} target="_blank" rel="noreferrer">{src.name}</a></h3>
              <p>{src.description}</p>
              <dl className="citation-meta">
                <div><dt>Type</dt><dd>{src.type.replace(/_/g, ' ')}</dd></div>
                <div><dt>Region</dt><dd>{src.region}</dd></div>
                <div><dt>Collected</dt><dd>{src.retrievedAt}</dd></div>
                <div><dt>Informs</dt><dd>{usedBy(src.id) ? `${usedBy(src.id)} ingredients` : 'Baskets, add-ons or recipes'}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="suppliers">
        <h2 id="suppliers">Suppliers</h2>
        <p className="section-lede">A supplier is where food would come from. Base has no supplier relationships yet; every supplier below is a
          labelled placeholder that shows how sourcing would be recorded.</p>
        <ul className="plain">
          {s.suppliers.map((sp) => <li key={sp.id}><strong>{sp.name}</strong> <StatusBadge status={sp.status} /> <span className="muted">{sp.region}. {sp.notes}</span></li>)}
        </ul>
      </section>

      <section className="section" aria-labelledby="inspect">
        <h2 id="inspect">Inspect any ingredient</h2>
        <div className="table-wrap">
          <table className="table provenance-table">
            <caption className="visually-hidden">Verification state of each dataset, per ingredient</caption>
            <thead><tr><th scope="col">Ingredient</th><th scope="col">Nutrition</th><th scope="col">Price</th><th scope="col">History</th><th scope="col">Seasonality</th><th scope="col">Price source</th></tr></thead>
            <tbody>{scorable.map((i) => {
              const d = datumStatus(i);
              return (
                <tr key={i.slug}>
                  <th scope="row"><Link href={`/ingredients/${i.slug}#prov`}>{i.name}</Link></th>
                  <td><StatusBadge status={d.nutrition} /></td><td><StatusBadge status={d.price} /></td>
                  <td><StatusBadge status={d.history} /></td><td><StatusBadge status={d.seasonality} /></td>
                  <td className="small">{getSource(i.price.sourceId)?.name}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </section>

      <section className="section" aria-labelledby="runs">
        <h2 id="runs">Research runs</h2>
        <ul className="plain">{s.researchRuns.map((r, i) => <li key={i}><strong>{r.kind === 'rank' ? 'Scoring' : 'Basket building'}</strong>, {r.methodologyVersion}, {r.ranAt.slice(0, 16).replace('T', ' ')} UTC</li>)}</ul>
        <p className="small muted">Rerun locally with <code>npm run research:rank</code> and <code>npm run research:baskets</code>. Scores group ingredients for affordability as:
          {' '}{[...new Set(Object.values(COMPARISON_GROUPS))].join(', ').replace(/-/g, ' ')}.</p>
      </section>
    </article>
  );
}
