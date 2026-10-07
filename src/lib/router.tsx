// A tiny client-side router (History API). Pages are prerendered on the server with
// the same route table, so every URL works without JavaScript.
import { stripBase, withBase } from './base-path.ts';
import { createContext, useContext, useEffect, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react';

interface RouterState { path: string; navigate: (to: string) => void }
const RouterContext = createContext<RouterState>({ path: '/', navigate: () => {} });

export const normalise = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p) || '/';

export function RouterProvider({ initialPath, children }: { initialPath: string; children: ReactNode }) {
  const [path, setPath] = useState(normalise(initialPath));
  useEffect(() => {
    const onPop = () => setPath(normalise(stripBase(window.location.pathname)));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = (to: string) => {
    const url = new URL(withBase(to), window.location.href);
    if (url.origin !== window.location.origin) { window.location.href = to; return; }
    window.history.pushState({}, '', url.pathname + url.search + url.hash);
    setPath(normalise(stripBase(url.pathname)));
    if (url.hash) {
      requestAnimationFrame(() => document.getElementById(url.hash.slice(1))?.scrollIntoView());
    } else {
      window.scrollTo(0, 0);
    }
  };
  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  return useContext(RouterContext);
}

/** Internal link: client-side navigation, normal anchor everywhere else. */
export function Link({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { navigate, path } = useRouter();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    rest.onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!href.startsWith('/') || rest.target) return;
    e.preventDefault();
    navigate(href);
  };
  const bare = href.split(/[?#]/)[0];
  const current = bare === path || (bare !== '/' && path.startsWith(`${bare}/`));
  return <a href={withBase(href)} aria-current={bare === path ? 'page' : undefined} data-active={current || undefined} {...rest} onClick={onClick}>{children}</a>;
}

export type Params = Record<string, string>;

/** Match '/ingredients/:slug' against a path. */
export function matchPath(pattern: string, path: string): Params | null {
  const a = pattern.split('/').filter(Boolean);
  const b = path.replace(/\/+$/, '').split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}
