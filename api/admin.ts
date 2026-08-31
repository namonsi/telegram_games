import { getGameRecords, kvWriteTest } from './store.js';
import type { GameRecord } from './store.js';

type Req = {
  method: string;
  headers: { [key: string]: string | string[] | undefined };
};

type Res = {
  status: (code: number) => { json: (data: unknown) => void };
  json: (data: unknown) => void;
};

/** GET /api/admin — finished-games log; gated by the ADMIN_KEY secret */
export default async function handler(req: Req, res: Res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    return res.status(403).json({ error: 'Admin page is not configured' });
  }
  const header = req.headers['x-admin-key'];
  const key = Array.isArray(header) ? header[0] : header;
  if (key !== adminKey) {
    return res.status(401).json({ error: 'Wrong admin key' });
  }

  const records = await getGameRecords();
  const kvStatus = await kvWriteTest();
  return res.json({ records, kv: kvStatus });
}
