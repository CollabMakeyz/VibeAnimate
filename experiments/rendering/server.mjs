import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const routes = new Map([['/', ['index.html', 'text/html']], ['/probe.mjs', ['probe.mjs', 'text/javascript']],
  ['/geometry.mjs', ['geometry.mjs', 'text/javascript']]]);
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://127.0.0.1').pathname;
  const route = routes.get(path);
  if (request.method !== 'GET' || !route) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const data = await readFile(new URL(route[0], import.meta.url));
    response.writeHead(200, { 'Content-Type': `${route[1]}; charset=utf-8`, 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; style-src 'unsafe-inline'; img-src 'self' blob:; object-src 'none'; base-uri 'none'" });
    response.end(data);
  } catch { response.writeHead(500); response.end('Research file unavailable'); }
});
server.listen(4173, '127.0.0.1', () => console.log('Rendering research: http://127.0.0.1:4173'));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
