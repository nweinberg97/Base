// The counter: a basket's ingredients laid out from above, as mise en place.
// Bowl size follows quantity, so a kilo of potatoes reads bigger than garlic.
import type { BasketLine } from '../data/api.ts';
import { BowlArt } from './BowlArt.tsx';
import { Link } from '../lib/router.tsx';
import { grams } from '../lib/format.ts';

export function Counter({ lines, caption, labels = true }: { lines: BasketLine[]; caption?: string; labels?: boolean }) {
  const max = Math.max(...lines.map((l) => Math.sqrt(l.item.quantityG)));
  return (
    <figure className="counter">
      <ul className="counter-grid">
        {lines.map((l, i) => {
          const scale = 0.62 + 0.38 * (Math.sqrt(l.item.quantityG) / max);
          return (
            <li key={l.ingredient.slug} style={{ ['--i' as string]: i }}>
              <Link href={`/ingredients/${l.ingredient.slug}`} className="counter-item">
                <span className="counter-bowl" style={{ ['--scale' as string]: scale.toFixed(3) }}>
                  <BowlArt visual={l.ingredient.visual} seed={l.ingredient.slug} size="100%" photo={l.ingredient.photo} />
                </span>
                {labels && <span className="counter-label"><span className="counter-name">{l.ingredient.name}</span>
                  <span className="counter-qty">{grams(l.item.quantityG)}</span></span>}
                {!labels && <span className="visually-hidden">{l.ingredient.name}, {grams(l.item.quantityG)}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
