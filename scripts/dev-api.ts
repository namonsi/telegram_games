import 'dotenv/config';
import { createServer } from 'node:http';
import gameHandler from '../api/game';
import roomHandler from '../api/room';

// ponytail: local stand-in for Vercel; wires the same api/ handlers with CORS
// so the Vite client (5173) can hit them. Vercel does the real job in prod.

const PORT = Number(process.env.API_PORT ?? 8787);

type Req = {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | undefined>;
  body: unknown;
};
type Res = {
  status: (n: number) => Res;
  json: (d: unknown) => void;
  send: (d: unknown) => void;
};

createServer((req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type, x-init-data');
  res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const send = (code: number, data: unknown) => {
      res.statusCode = code;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    };
    const makeRes = (code: number): Res => ({
      status: (n: number) => makeRes(n),
      json: (d: unknown) => send(code, d),
      send: (d: unknown) => send(code, d),
    });

    const query = new URL(req.url ?? '/', 'http://localhost').searchParams;
    const q: Record<string, string | undefined> = {};
    for (const [k, v] of query) q[k] = v;

    const rreq: Req = {
      method: req.method ?? 'GET',
      headers: req.headers as Record<string, string | string[] | undefined>,
      query: q,
      body: body ? JSON.parse(body) : {},
    };
    const rres = makeRes(200);

    const url = req.url ?? '/';
    if (url.startsWith('/api/game')) return void gameHandler(rreq, rres);
    if (url.startsWith('/api/room')) return void roomHandler(rreq, rres);
    rres.status(404).json({ error: 'Not found' });
  });
}).listen(PORT, () => console.log(`Dev API on http://localhost:${PORT}`));
