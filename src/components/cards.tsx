// Cards for lists. Each has its own shape for what it is, instead of one card for everything.
import type { AddOn, Basket, Ingredient, Recipe } from '../data/types.ts';
import { getIngredientById, scoreFor, formatWeek } from '../data/api.ts';
import { Link } from '../lib/router.tsx';
import { approx, ADD_ON_CATEGORY_LABEL, CATEGORY_LABEL, CLASS_LABEL, grams, lowerName, minutes, money } from '../lib/format.ts';
import { BowlArt } from './BowlArt.tsx';
import { PhotoThumb } from './Photo.tsx';
import { SeasonStrip, StatusBadge } from './data.tsx';
import { useBuild } from '../lib/build-state.tsx';

/** One bowl on the counter: illustration, name, quantity. */
export function IngredientTile({ ingredient, quantityG, note, size = 132 }:
  { ingredient: Ingredient; quantityG?: number; note?: string; size?: number }) {
  return (
    <Link href={`/ingredients/${ingredient.slug}`} className="tile">
      <BowlArt visual={ingredient.visual} seed={ingredient.slug} size={size} className="tile-bowl" photo={ingredient.photo} />
      <span className="tile-name">{ingredient.name}</span>
      {(quantityG || note) && <span className="tile-note">{quantityG ? grams(quantityG) : note}</span>}
    </Link>
  );
}

export function IngredientRow({ ingredient, month }: { ingredient: Ingredient; month: number }) {
  const sc = scoreFor(ingredient, month);
  return (
    <li className="ingredient-row">
      <BowlArt visual={ingredient.visual} seed={ingredient.slug} size={64} photo={ingredient.photo} />
      <div className="ingredient-row-main">
        <h3><Link href={`/ingredients/${ingredient.slug}`}>{ingredient.name}</Link></h3>
        <p>{ingredient.description}</p>
      </div>
      <dl className="ingredient-row-facts">
        <div><dt>Type</dt><dd>{CATEGORY_LABEL[ingredient.category]}</dd></div>
        {sc && <div><dt>Per serving</dt><dd>{approx(sc.costPerServing)}</dd></div>}
        {sc && <div><dt>Role</dt><dd><span className={`role role-${sc.classification}`}>{CLASS_LABEL[sc.classification]}</span></dd></div>}
      </dl>
      <SeasonStrip availability={ingredient.seasonality.availability} current={month} compact />
    </li>
  );
}

export function BasketCard({ basket, price, children }: { basket: Basket; price?: number; children?: React.ReactNode }) {
  const ings = basket.items.map((i) => getIngredientById(i.ingredientId)).filter((x): x is Ingredient => !!x);
  const when = basket.weekOf ? `Week of ${formatWeek(basket.weekOf)}` : 'Seasonal preview';
  return (
    <article className={`basket-card season-${basket.season}`}>
      <div className="basket-card-bowls" aria-hidden="true">
        {ings.slice(0, 8).map((g) => <BowlArt key={g.slug} visual={g.visual} seed={g.slug} size={56} photo={g.photo} />)}
      </div>
      <div className="basket-card-text">
        <p className="basket-card-when">{when}{basket.status === 'current' && <span className="pill">This week</span>}{basket.status === 'upcoming' && <span className="pill pill-quiet">Next week</span>}</p>
        <h3><Link href={`/baskets/${basket.slug}`}>{basket.name}</Link></h3>
        <p className="basket-card-list">{ings.map((g) => g.name).join(', ')}</p>
        {price !== undefined && <p className="basket-card-price">{money(price)} <span className="muted">food price, prototype</span></p>}
        {children}
      </div>
    </article>
  );
}

export function RecipeCard({ recipe, used, basketName }: { recipe: Recipe; used?: number; basketName?: string }) {
  const main = recipe.lines.filter((l) => l.ingredientId && !l.optional)
    .map((l) => getIngredientById(l.ingredientId!)).filter((g): g is Ingredient => !!g && !g.isPantryBasic).slice(0, 3);
  const optionalAddOns = recipe.lines.filter((l) => l.addOnId).length;
  return (
    <article className="recipe-card">
      {recipe.photo
        ? <PhotoThumb photo={recipe.photo} className="recipe-card-photo" />
        : <div className="recipe-card-bowls" aria-hidden="true">
            {main.map((g, i) => <BowlArt key={g.slug} visual={g.visual} seed={`${g.slug}-${recipe.slug}-${i}`} size={92} photo={g.photo} />)}
          </div>}
      <div className="recipe-card-text">
        <h3><Link href={`/recipes/${recipe.slug}`}>{recipe.name}</Link></h3>
        <p className="recipe-card-by">by {recipe.creatorName}{recipe.creatorIsDemo && <span className="muted"> (demo creator)</span>}</p>
        <p>{recipe.description}</p>
        {used !== undefined && <p className="uses-base"><LogoDot /> Uses {used} ingredients from {basketName ?? 'this week’s Base'}</p>}
        <p className="recipe-card-meta">
          <span>{minutes(recipe.prepTimeMinutes)}</span>
          <span>{recipe.difficulty === 'easy' ? 'Easy' : recipe.difficulty === 'medium' ? 'Some effort' : 'Involved'}</span>
          {optionalAddOns > 0 && <span>{optionalAddOns} optional add-on{optionalAddOns > 1 ? 's' : ''}</span>}
        </p>
      </div>
    </article>
  );
}

function LogoDot() {
  return <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><circle cx="5" cy="5" r="5" fill="var(--season)" /></svg>;
}

export function AddOnCard({ addOn, reason, selectable = true }: { addOn: AddOn; reason?: string; selectable?: boolean }) {
  const build = useBuild();
  const ing = addOn.ingredientId ? getIngredientById(addOn.ingredientId) : undefined;
  const selected = build.addOnIds.includes(addOn.id);
  const unavailable = addOn.status === 'sold_out';
  return (
    <article className={`addon-card${selected ? ' is-selected' : ''}${addOn.photo ? ' has-photo' : ''}`}>
      {addOn.photo && <PhotoThumb photo={addOn.photo} className="addon-photo" />}
      <p className="addon-cat">{ADD_ON_CATEGORY_LABEL[addOn.category]}{addOn.status === 'seasonal' && <span className="pill pill-quiet">Seasonal</span>}<StatusBadge status={addOn.verificationStatus} /></p>
      <h3>{addOn.name}</h3>
      <p className="addon-desc">{addOn.description}</p>
      {reason && <p className="addon-reason">{reason}</p>}
      <div className="addon-foot">
        <p className="addon-price"><span>+{money(addOn.price)}</span> <span className="muted">{addOn.unit}</span></p>
        {selectable && (
          <button type="button" className={`btn btn-small ${selected ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={selected}
            disabled={unavailable} onClick={() => build.toggleAddOn(addOn.id)}>
            {unavailable ? 'Sold out' : selected ? 'Added' : 'Add'}<span className="visually-hidden"> {addOn.name}</span>
          </button>
        )}
      </div>
      {ing && <p className="addon-link"><Link href={`/ingredients/${ing.slug}`}>Why {lowerName(ing.name)} is an add-on</Link></p>}
    </article>
  );
}
