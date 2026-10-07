// A prep bowl seen from above, filled with an ingredient. When the ingredient has a
// credited photo (Wikimedia Commons, see db/seeds/photos.ts) the photo fills the bowl;
// otherwise it is drawn from the ingredient's own data (colour, accent, texture) with
// seeded randomness, so chickpeas always look like the same chickpeas.
import type { Photo } from '../data/types.ts';
import { withBase } from '../lib/base-path.ts';
import { useId, type ReactElement } from 'react';
import { seeded } from '../lib/random.ts';

export interface BowlVisual { color: string; accent: string; texture: string }

function mix(hex: string, target: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex);
  const b = p(target);
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
const darker = (c: string, t = 0.18) => mix(c, '#2a1d12', t);
const lighter = (c: string, t = 0.35) => mix(c, '#ffffff', t);

const R = 33; // food radius
const PHOTO_R = 38.5; // photos fill the whole inside of the bowl

/** Jittered grid of points inside the food disc. */
function points(rng: () => number, spacing: number, jitter = 0.45): [number, number][] {
  const out: [number, number][] = [];
  for (let y = -R; y <= R; y += spacing * 0.87) {
    const row = Math.round((y + R) / (spacing * 0.87));
    for (let x = -R + (row % 2 ? spacing / 2 : 0); x <= R; x += spacing) {
      const px = x + (rng() - 0.5) * spacing * jitter * 2;
      const py = y + (rng() - 0.5) * spacing * jitter * 2;
      if (px * px + py * py <= (R - 1.5) ** 2) out.push([50 + px, 50 + py]);
    }
  }
  return out;
}

const deg = (rng: () => number) => Math.round(rng() * 360);

function texture(v: BowlVisual, rng: () => number): ReactElement[] {
  const { color, accent } = v;
  const shades = [color, darker(color, 0.1), lighter(color, 0.12), accent];
  const pick = () => shades[Math.floor(rng() * shades.length)];
  const els: ReactElement[] = [];
  let k = 0;
  const key = () => `t${k++}`;

  switch (v.texture) {
    case 'grains':
      for (const [x, y] of points(rng, 3.6, 0.5)) {
        els.push(<ellipse key={key()} cx={x} cy={y} rx={1.55} ry={0.8} fill={pick()} transform={`rotate(${deg(rng)} ${x} ${y})`} />);
      }
      break;
    case 'beans':
      for (const [x, y] of points(rng, 6.2, 0.4)) {
        const r = deg(rng);
        els.push(<g key={key()} transform={`rotate(${r} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx={3.1} ry={2.5} fill={pick()} />
          <ellipse cx={x - 0.9} cy={y - 0.8} rx={1.1} ry={0.6} fill={lighter(color, 0.4)} opacity={0.6} />
        </g>);
      }
      break;
    case 'chunks':
      for (const [x, y] of points(rng, 8.5, 0.35)) {
        const n = 6;
        const d = Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2 + rng() * 0.4;
          const rr = 3.4 + rng() * 1.6;
          return `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`;
        }).join('') + 'Z';
        els.push(<path key={key()} d={d} fill={pick()} stroke={darker(color, 0.25)} strokeWidth={0.4} strokeLinejoin="round" />);
      }
      break;
    case 'wedges':
      for (const [x, y] of points(rng, 9, 0.35)) {
        const r = deg(rng);
        els.push(<g key={key()} transform={`rotate(${r} ${x} ${y})`}>
          <path d={`M${x} ${y - 5.5} A 5.5 5.5 0 0 1 ${x + 4.8} ${y + 2.8} L ${x} ${y + 1} Z`} fill={pick()} />
          <path d={`M${x} ${y - 5.5} A 5.5 5.5 0 0 1 ${x + 4.8} ${y + 2.8}`} fill="none" stroke={accent} strokeWidth={1.2} strokeLinecap="round" />
        </g>);
      }
      break;
    case 'leaves':
      for (let i = 0; i < 44; i++) {
        const a = rng() * Math.PI * 2;
        const dist = Math.sqrt(rng()) * (R - 6);
        const x = 50 + Math.cos(a) * dist;
        const y = 50 + Math.sin(a) * dist;
        const len = 10 + rng() * 6;
        const w = 4 + rng() * 2;
        const fill = i % 3 === 0 ? accent : i % 3 === 1 ? color : darker(color, 0.12);
        els.push(<g key={key()} transform={`rotate(${deg(rng)} ${x} ${y})`}>
          <path d={`M${x - len / 2} ${y} Q ${x} ${y - w} ${x + len / 2} ${y} Q ${x} ${y + w} ${x - len / 2} ${y} Z`} fill={fill} />
          <path d={`M${x - len / 2 + 1} ${y} L ${x + len / 2 - 1} ${y}`} stroke={lighter(fill, 0.3)} strokeWidth={0.5} />
        </g>);
      }
      break;
    case 'rings':
      for (const [x, y] of points(rng, 7.6, 0.35)) {
        els.push(<g key={key()}>
          <circle cx={x} cy={y} r={3.5} fill={pick()} />
          <circle cx={x} cy={y} r={2.1} fill="none" stroke={darker(accent, 0.05)} strokeWidth={0.7} opacity={0.8} />
          <circle cx={x} cy={y} r={0.7} fill={accent} />
        </g>);
      }
      break;
    case 'slices':
      for (const [x, y] of points(rng, 8, 0.35)) {
        const r = deg(rng);
        els.push(<g key={key()} transform={`rotate(${r} ${x} ${y})`}>
          <path d={`M${x - 4.5} ${y} A 4.5 4.5 0 0 1 ${x + 4.5} ${y} Z`} fill={pick()} />
          <path d={`M${x - 4.5} ${y} A 4.5 4.5 0 0 1 ${x + 4.5} ${y}`} fill="none" stroke={accent} strokeWidth={1} />
        </g>);
      }
      break;
    case 'florets':
      for (const [x, y] of points(rng, 9.5, 0.3)) {
        const c = pick();
        els.push(<g key={key()}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2 + rng();
            return <circle key={i} cx={x + Math.cos(a) * 2.2} cy={y + Math.sin(a) * 2.2} r={2.1} fill={c} />;
          })}
          <circle cx={x} cy={y} r={2.2} fill={lighter(c, 0.15)} />
        </g>);
      }
      break;
    case 'cream':
      els.push(<circle key={key()} cx={50} cy={50} r={R} fill={color} />);
      els.push(<path key={key()} d="M28 52 Q 38 36 52 40 Q 66 44 62 56 Q 58 66 46 62" fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" opacity={0.7} />);
      els.push(<path key={key()} d="M36 34 Q 46 28 58 31" fill="none" stroke={lighter(color, 0.6)} strokeWidth={2.2} strokeLinecap="round" opacity={0.8} />);
      break;
    case 'cubes':
      for (const [x, y] of points(rng, 7.4, 0.35)) {
        els.push(<rect key={key()} x={x - 2.7} y={y - 2.7} width={5.4} height={5.4} rx={1.1} fill={pick()}
          transform={`rotate(${deg(rng)} ${x} ${y})`} stroke={darker(color, 0.22)} strokeWidth={0.3} />);
      }
      break;
    case 'strands':
      for (let i = 0; i < 34; i++) {
        const a = rng() * Math.PI * 2;
        const dist = Math.sqrt(rng()) * (R - 5);
        const x = 50 + Math.cos(a) * dist;
        const y = 50 + Math.sin(a) * dist;
        const len = 8 + rng() * 6;
        const bend = (rng() - 0.5) * 8;
        els.push(<path key={key()} d={`M${x - len / 2} ${y} Q ${x} ${y + bend} ${x + len / 2} ${y}`} fill="none"
          stroke={i % 3 === 0 ? accent : color} strokeWidth={2.4} strokeLinecap="round" transform={`rotate(${deg(rng)} ${x} ${y})`} />);
      }
      break;
    case 'berries':
      for (const [x, y] of points(rng, 5.8, 0.3)) {
        const c = pick();
        els.push(<g key={key()}>
          <circle cx={x} cy={y} r={2.7} fill={c} />
          <circle cx={x + 0.6} cy={y + 0.4} r={0.6} fill={darker(c, 0.4)} />
          <circle cx={x - 0.9} cy={y - 0.9} r={0.6} fill={lighter(c, 0.5)} opacity={0.7} />
        </g>);
      }
      break;
    case 'cloves':
      for (const [x, y] of points(rng, 8, 0.35)) {
        els.push(<path key={key()} d={`M${x} ${y - 4} Q ${x + 3.4} ${y + 1} ${x} ${y + 3.4} Q ${x - 3.4} ${y + 1} ${x} ${y - 4} Z`}
          fill={pick()} stroke={darker(color, 0.2)} strokeWidth={0.4} transform={`rotate(${deg(rng)} ${x} ${y})`} />);
      }
      break;
    case 'whole':
      for (const [x, y] of points(rng, 12.5, 0.2)) {
        els.push(<g key={key()} transform={`rotate(${deg(rng)} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx={5.6} ry={4.6} fill={color} stroke={darker(color, 0.15)} strokeWidth={0.4} />
          <ellipse cx={x - 1.6} cy={y - 1.4} rx={1.8} ry={1.1} fill={lighter(color, 0.6)} opacity={0.8} />
          <path d={`M${x + 1} ${y - 3} Q ${x + 3.5} ${y} ${x + 1} ${y + 3}`} fill="none" stroke={accent} strokeWidth={0.8} opacity={0.7} />
        </g>);
      }
      break;
    case 'shreds':
    default:
      for (let i = 0; i < 110; i++) {
        const a = rng() * Math.PI * 2;
        const dist = Math.sqrt(rng()) * (R - 3);
        const x = 50 + Math.cos(a) * dist;
        const y = 50 + Math.sin(a) * dist;
        els.push(<path key={key()} d={`M${x - 3} ${y} Q ${x} ${y - 1.6} ${x + 3} ${y}`} fill="none" stroke={pick()} strokeWidth={1.3}
          strokeLinecap="round" transform={`rotate(${deg(rng)} ${x} ${y})`} />);
      }
  }
  return els;
}

export function BowlArt({ visual, seed, size = 120, label, className, photo }: {
  visual: BowlVisual; seed: string; size?: number | string; label?: string; className?: string;
  /** A real photo of the food, shown inside the bowl in place of the illustration. */
  photo?: Pick<Photo, 'srcSquare'> | null;
}) {
  const id = useId().replace(/:/g, '');
  const rng = seeded(seed);
  const base = visual.texture === 'cream' ? visual.color : darker(visual.color, 0.08);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role={label ? 'img' : undefined}
      aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      <defs>
        <radialGradient id={`s${id}`} cx="0.53" cy="0.56" r="0.5">
          <stop offset="0.82" stopColor="#3a2c1c" stopOpacity="0.16" />
          <stop offset="1" stopColor="#3a2c1c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`w${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.72" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#3a2c1c" stopOpacity="0.22" />
        </radialGradient>
        <clipPath id={`c${id}`}><circle cx="50" cy="50" r={photo ? PHOTO_R : R} /></clipPath>
      </defs>
      <circle cx="52" cy="54" r="48" fill={`url(#s${id})`} />
      <circle cx="50" cy="50" r="45.5" fill="#FDFCFA" stroke="#E2DED5" strokeWidth="0.6" />
      <circle cx="50" cy="50" r="38.5" fill="#EFECE6" />
      <g clipPath={`url(#c${id})`}>
        <circle cx="50" cy="50" r={R} fill={base} />
        {photo
          ? <image href={withBase(photo.srcSquare)} x={50 - PHOTO_R} y={50 - PHOTO_R} width={PHOTO_R * 2} height={PHOTO_R * 2} preserveAspectRatio="xMidYMid slice" />
          : texture(visual, rng)}
      </g>
      {/* Illustrations get the bowl's inner shadow and glaze highlight; photos stay unobstructed. */}
      {!photo && <circle cx="50" cy="50" r="38.5" fill={`url(#w${id})`} />}
      {!photo && <path d="M17 38 A 35 35 0 0 1 38 15.5" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />}
    </svg>
  );
}
