// Servidor estático mínimo para la landing de ObraFlow.
// Sin dependencias: una sola página, un solo archivo en memoria.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const HTML = fs.readFileSync(path.join(__dirname, 'index.html'));
const ICON = fs.readFileSync(path.join(__dirname, 'icon.svg'));

const BASE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

http
  .createServer((req, res) => {
    const url = (req.url || '/').split('?')[0];

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
    }

    if (url === '/healthz') {
      res.writeHead(200, { ...BASE_HEADERS, 'Content-Type': 'text/plain' });
      return res.end(req.method === 'HEAD' ? undefined : 'ok');
    }

    if (url === '/icon.svg') {
      res.writeHead(200, {
        ...BASE_HEADERS,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
      });
      return res.end(req.method === 'HEAD' ? undefined : ICON);
    }

    if (url === '/' || url === '/index.html') {
      res.writeHead(200, {
        ...BASE_HEADERS,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      });
      return res.end(req.method === 'HEAD' ? undefined : HTML);
    }

    // Una sola página: cualquier otra ruta vuelve a la raíz.
    res.writeHead(302, { ...BASE_HEADERS, Location: '/' });
    res.end();
  })
  .listen(PORT, () => {
    console.log(`Landing de ObraFlow escuchando en :${PORT}`);
  });
