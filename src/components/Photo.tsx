// Real photos of the food, always with their credit. They come from Wikimedia Commons and Openverse
// under free licences and show what the ingredient looks like, not Base's own product.
import type { Photo } from '../data/types.ts';
import { withBase } from '../lib/base-path.ts';

/** "Photo: Author, CC BY-SA 4.0" with links to the source page and the licence. */
export function PhotoCredit({ photo, prefix = 'Photo' }: { photo: Photo; prefix?: string }) {
  return (
    <span className="photo-credit">
      {prefix}: <a href={photo.sourceUrl} target="_blank" rel="noreferrer">{photo.author}<span className="visually-hidden"> (opens the original on {photo.via})</span></a>,{' '}
      {photo.licenseUrl
        ? <a href={photo.licenseUrl} target="_blank" rel="noreferrer license">{photo.license}</a>
        : photo.license}
      , via {photo.via}
    </span>
  );
}

/** A full photo with its caption and credit. */
export function FoodPhoto({ photo, caption, className = '', eager = false }:
  { photo: Photo; caption?: string; className?: string; eager?: boolean }) {
  return (
    <figure className={`food-photo ${className}`}>
      <img src={withBase(photo.src)} width={photo.width} height={photo.height} alt={photo.alt}
        loading={eager ? 'eager' : 'lazy'} decoding="async" />
      <figcaption>
        {caption && <span className="food-photo-caption">{caption} </span>}
        <PhotoCredit photo={photo} />
      </figcaption>
    </figure>
  );
}

/** A cropped thumbnail for cards; the credit lives on the photo credits list. */
export function PhotoThumb({ photo, className = '' }: { photo: Photo; className?: string }) {
  return (
    <img className={`photo-thumb ${className}`} src={withBase(photo.src)} alt={photo.alt} loading="lazy" decoding="async"
      width={photo.width} height={photo.height} />
  );
}
