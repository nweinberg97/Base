import { useEffect } from 'react';
import { RouterProvider, useRouter } from './lib/router.tsx';
import { BuildProvider } from './lib/build-state.tsx';
import { SiteLayout } from './layouts/SiteLayout.tsx';
import { resolve } from './routes.tsx';

function CurrentPage() {
  const { path } = useRouter();
  const { element, meta } = resolve(path);
  useEffect(() => {
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
    // move focus to the page for screen-reader users after client-side navigation
    const main = document.getElementById('main');
    if (main && document.activeElement && document.activeElement !== document.body && !main.contains(document.activeElement)) main.focus({ preventScroll: true });
  }, [path, meta.title, meta.description]);
  return element;
}

export function App({ path }: { path: string }) {
  return (
    <RouterProvider initialPath={path}>
      <BuildProvider>
        <SiteLayout><CurrentPage /></SiteLayout>
      </BuildProvider>
    </RouterProvider>
  );
}
