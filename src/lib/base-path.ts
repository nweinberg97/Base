// The site can be served from a sub-path (GitHub Pages serves this repo at /Base/).
// App code always works with root-relative paths such as '/recipes'; these helpers
// add the prefix for real URLs and strip it from the address bar.

let basePath = '';

/** '' for a root deployment, or '/Base' (no trailing slash). */
export function normaliseBasePath(p: string | undefined | null): string {
  const t = (p ?? '').trim().replace(/\/+$/, '');
  if (!t || t === '/') return '';
  return t.startsWith('/') ? t : `/${t}`;
}

export function setBasePath(p: string | undefined | null): void {
  basePath = normaliseBasePath(p);
}

export function getBasePath(): string {
  return basePath;
}

/** '/recipes' → '/Base/recipes'. External URLs, hashes and relative paths pass through. */
export function withBase(path: string): string {
  if (!basePath || !path.startsWith('/') || path.startsWith('//')) return path;
  return path === '/' ? `${basePath}/` : `${basePath}${path}`;
}

/** '/Base/recipes' → '/recipes'. */
export function stripBase(pathname: string): string {
  if (!basePath) return pathname || '/';
  if (pathname === basePath) return '/';
  return pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) || '/' : pathname;
}
