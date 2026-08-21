/* A zero-dependency static server for the exported dispatch app.
 *
 *   npm run build && node serve.mjs      →  http://localhost:4173/
 *
 * ⚠ Why this exists: `output: 'export'` produces a static site, but Next writes
 * absolute asset paths (/_next/…), so opening out/index.html straight off the
 * filesystem with file:// does NOT work — the stylesheet and the JavaScript
 * never load. This is Node's own http module and nothing else, so it runs on a
 * demo laptop with no network and no npx.
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve('out');
const PORT = Number(process.env.PORT || 4174);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

async function resolveFile(urlPath) {
  // Strip the query, decode, and refuse anything that climbs out of out/.
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const candidates = [
    join(ROOT, clean),
    join(ROOT, clean, 'index.html'),
    join(ROOT, `${clean}.html`),
  ];
  for (const c of candidates) {
    if (!c.startsWith(ROOT)) continue;
    try {
      const s = await stat(c);
      if (s.isFile()) return c;
    } catch { /* try the next shape */ }
  }
  return null;
}

createServer(async (req, res) => {
  const file = await resolveFile(req.url || '/');
  if (!file) {
    const notFound = await resolveFile('/404.html');
    if (notFound) {
      res.writeHead(404, { 'content-type': TYPES['.html'] });
      res.end(await readFile(notFound));
      return;
    }
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(await readFile(file));
}).listen(PORT, () => {
  console.log(`Vantage Dispatch → http://localhost:${PORT}/  (add ?bare=1 to drop the rails)`);
});
