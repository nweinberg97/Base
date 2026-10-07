// Prerender entry: renders any path to HTML with its title and description.
import { renderToString } from 'react-dom/server';
import { App } from './App.tsx';
import { setSnapshot } from './data/api.ts';
import { setBasePath } from './lib/base-path.ts';
import { allPaths, resolve } from './routes.tsx';
import type { DataSnapshot } from './data/types.ts';

export function prerender(snapshot: DataSnapshot, basePath = '') {
  setSnapshot(snapshot);
  setBasePath(basePath);
  const render = (path: string) => {
    const { meta, status } = resolve(path);
    return { html: renderToString(<App path={path} />), meta, status };
  };
  return { paths: allPaths(), render };
}
