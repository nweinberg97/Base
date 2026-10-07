// Browser entry: loads the data snapshot, then hydrates the prerendered page.
import { hydrateRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { setSnapshot } from './data/api.ts';
import { setBasePath, stripBase } from './lib/base-path.ts';
import type { DataSnapshot } from './data/types.ts';

declare global { interface Window { __BASE_DATA_URL__: string; __BASE_NOT_FOUND__?: boolean; __BASE_PATH__?: string } }

async function start() {
  setBasePath(window.__BASE_PATH__);
  const root = document.getElementById('root')!;
  try {
    const res = await fetch(window.__BASE_DATA_URL__);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setSnapshot((await res.json()) as DataSnapshot);
    // The static 404 page was rendered for an unknown path; hydrate it as that, not as the URL.
    const path = window.__BASE_NOT_FOUND__ ? '/__not-found__' : stripBase(window.location.pathname);
    hydrateRoot(root, <App path={path} />);
  } catch (err) {
    // The prerendered page stays readable; only interactivity is lost.
    console.error('Base could not load its data:', err);
    const note = document.createElement('p');
    note.className = 'load-error';
    note.setAttribute('role', 'status');
    note.textContent = 'Some interactive features are unavailable right now. Reload the page to try again.';
    document.body.prepend(note);
  }
}

void start();
