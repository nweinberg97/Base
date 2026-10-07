// Tiny static file server for dist/, with clean URLs and the 404 page.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
};

export function serve(dir: string, port: number, basePath = '') {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (basePath) {
      // Mirror GitHub Pages: the site lives under the base path.
      if (pathname === '/' ) { res.writeHead(302, { location: `${basePath}/` }).end(); return; }
      if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) { res.writeHead(404).end('Not found'); return; }
      pathname = pathname.slice(basePath.length) || '/';
    }
    let p = normalize(join(dir, pathname));
    if (!p.startsWith(dir)) { res.writeHead(403).end(); return; }
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) {
      res.writeHead(404, { 'content-type': TYPES['.html'] }).end(readFileSync(join(dir, '404.html')));
      return;
    }
    const immutable = /\/(assets|data)\//.test(p);
    res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream',
      'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache' });
    res.end(readFileSync(p));
  });
  server.listen(port, () => console.log(`Serving ${dir} at http://localhost:${port}${basePath}/`));
  return server;
}
