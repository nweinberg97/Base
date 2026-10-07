// Components that show research data. Every number that comes from outside Base
// carries its verification state; every Base-derived number says so.
import type { ReactNode } from 'react';
import type { DataStatus, Ingredient, MonthScore } from '../data/types.ts';
import { getSource } from '../data/api.ts';
import { MONTH_NAMES } from '../research/calendar.ts';
import { score as fmtScore } from '../lib/format.ts';

export const STATUS_INFO: Record<DataStatus, { label: string; glyph: string; help: string }> = {
  verified: { label: 'Verified', glyph: '✓', help: 'Directly supported by the cited source.' },
  estimated: { label: 'Estimated', glyph: '≈', help: 'A reasonable estimate from a documented method. Not checked against the source value by value.' },
  derived: { label: 'Base-derived', glyph: 'ƒ', help: 'Calculated by Base from other data, using the methodology on the Research page. Not an objective measure.' },
  demo: { label: 'Demo', glyph: '○', help: 'Placeholder data used only to demonstrate the interface.' },
};

export function StatusBadge({ status, compact = false }: { status: DataStatus; compact?: boolean }) {
  const info = STATUS_INFO[status];
  return (
    <span className={`badge badge-${status}`} title={info.help}>
      <span aria-hidden="true" className="badge-glyph">{info.glyph}</span>
      {compact ? <span className="visually-hidden">{info.label}</span> : info.label}
    </span>
  );
}

/** "Source: X" with the full provenance one click away. */
export function SourceCitation({ sourceId, status, note, label = 'Source' }:
  { sourceId: number | null | undefined; status: DataStatus; note?: string | null; label?: string }) {
  const src = getSource(sourceId);
  if (!src) {
    return <span className="citation citation-missing"><StatusBadge status={status} /> No source recorded</span>;
  }
  return (
    <details className="citation">
      <summary>
        <StatusBadge status={status} />
        <span className="citation-name">{label}: {src.name}</span>
      </summary>
      <div className="citation-body">
        <p>{src.description}</p>
        {note && <p className="citation-note">{note}</p>}
        <dl className="citation-meta">
          <div><dt>Collected</dt><dd>{src.retrievedAt}</dd></div>
          <div><dt>Region</dt><dd>{src.region}</dd></div>
          <div><dt>Type</dt><dd>{src.type.replace(/_/g, ' ')}</dd></div>
        </dl>
        <a href={src.url} target="_blank" rel="noreferrer">Open source<span className="visually-hidden"> (opens in a new tab)</span></a>
      </div>
    </details>
  );
}

/** A labelled value with its status badge, e.g. ~$0.26 / serving  ≈ Estimated. */
export function DataValue({ label, value, status, unit, children }:
  { label: string; value: ReactNode; status: DataStatus; unit?: string; children?: ReactNode }) {
  return (
    <div className="datavalue">
      <dt>{label}</dt>
      <dd>
        <span className="datavalue-number">{value}</span>{unit && <span className="datavalue-unit"> {unit}</span>}
        <StatusBadge status={status} compact />
        {children}
      </dd>
    </div>
  );
}

/** Horizontal score meter, 0–100. The number is always shown; the bar is decoration. */
export function ScoreBar({ label, value, hint, emphasis = false }: { label: string; value: number | null; hint?: string; emphasis?: boolean }) {
  return (
    <div className={`scorebar${emphasis ? ' scorebar-emphasis' : ''}`}>
      <div className="scorebar-head">
        <span className="scorebar-label">{label}</span>
        <span className="scorebar-value">{value == null ? 'Not scored' : fmtScore(value)}</span>
      </div>
      <div className="scorebar-track" aria-hidden="true"><span style={{ width: `${value ?? 0}%` }} /></div>
      {hint && <p className="scorebar-hint">{hint}</p>}
    </div>
  );
}

export function ScorePanel({ score }: { score: MonthScore }) {
  return (
    <div className="scorepanel">
      <div className="scorepanel-head">
        <ScoreBar label="Base Score" value={score.baseScore} emphasis />
        <StatusBadge status="derived" />
      </div>
      <ScoreBar label="Affordability" value={score.affordability} hint="Cost per serving, against similar foods" />
      <ScoreBar label="Versatility" value={score.versatility} hint="How many meals, dishes and techniques it suits" />
      <ScoreBar label="Nutrition" value={score.nutrition} hint="Protein and fibre per 100 kcal, less sodium" />
      <ScoreBar label="Availability" value={score.availability} hint={`Estimated BC availability in ${MONTH_NAMES[score.month - 1]}`} />
      <ScoreBar label="Price stability" value={score.priceStability} hint="How little the price moved over 12 months (demo history)" />
    </div>
  );
}

/** Twelve months of estimated availability. Text alternative lists the peak months. */
export function SeasonStrip({ availability, local, current, compact = false }:
  { availability: number[]; local?: boolean[]; current?: number; compact?: boolean }) {
  const peak = availability.map((a, i) => (a >= 8 / 9 - 1e-9 ? MONTH_NAMES[i] : null)).filter(Boolean);
  const summary = peak.length === 12 ? 'Available all year' : peak.length ? `Best in ${peak.join(', ')}` : 'No peak months';
  return (
    <figure className={`season${compact ? ' season-compact' : ''}`}>
      <ol className="season-cells" aria-hidden="true">
        {availability.map((a, i) => (
          <li key={i} data-current={current === i + 1 || undefined} data-local={local?.[i] || undefined}>
            <span className="season-fill" style={{ opacity: 0.12 + a * 0.88 }} />
            {!compact && <span className="season-month">{MONTH_NAMES[i][0]}</span>}
          </li>
        ))}
      </ol>
      <figcaption className={compact ? 'visually-hidden' : 'season-caption'}>{summary}.</figcaption>
    </figure>
  );
}

/** Price history line. Small, unlabelled except for the range: it's context, not analysis. */
export function Sparkline({ values, width = 220, height = 48, label }: { values: number[]; width?: number; height?: number; label: string }) {
  if (values.length < 2) return <p className="muted">Not enough price history to chart.</p>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 4;
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) => (max === min ? height / 2 : pad + (1 - (v - min) / (max - min)) * (height - pad * 2));
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join('');
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={label} preserveAspectRatio="none">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="3" fill="var(--season)" />
    </svg>
  );
}

export function NutritionTable({ ingredient }: { ingredient: Ingredient }) {
  const n = ingredient.nutrition;
  const k = ingredient.servingSizeG / 100;
  const row = (label: string, per100: number | null, unit: string) => (
    <tr><th scope="row">{label}</th><td>{per100 == null ? '—' : `${round(per100)} ${unit}`}</td><td>{per100 == null ? '—' : `${round(per100 * k)} ${unit}`}</td></tr>
  );
  return (
    <table className="nutrition">
      <caption className="visually-hidden">Nutrition for {ingredient.name}, {ingredient.purchaseForm}</caption>
      <thead><tr><th scope="col">Nutrient</th><th scope="col">Per 100 g</th><th scope="col">Per serving ({ingredient.servingSizeG} g)</th></tr></thead>
      <tbody>
        {row('Energy', n.calories, 'kcal')}
        {row('Protein', n.protein, 'g')}
        {row('Carbohydrate', n.carbohydrates, 'g')}
        {row('Fibre', n.fiber, 'g')}
        {row('Fat', n.fat, 'g')}
        {row('Sodium', n.sodium, 'mg')}
      </tbody>
    </table>
  );
}

function round(x: number): string {
  if (x >= 100) return String(Math.round(x));
  if (x >= 10) return String(Math.round(x));
  return String(Math.round(x * 10) / 10);
}
