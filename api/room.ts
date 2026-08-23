import { authUser } from './core.js';
import { getRoom } from './store.js';
import { sanitizeRoom } from './view.js';

type Req = {
  headers: { [key: string]: string | string[] | undefined };
  query: { [key: string]: string | string[] | undefined };
};

type Res = {
  status: (code: number) => { json: (data: unknown) => void };
  json: (data: unknown) => void;
};

export default async function handler(req: Req, res: Res) {
  const id = req.query['id'];
  const roomId = Array.isArray(id) ? id[0] : id;
  if (!roomId) return res.status(400).json({ error: 'Missing room id' });

  const room = await getRoom(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  // identify the viewer so secrets (targets, ships, answers) can be stripped per player
  let viewerId: string | null = null;
  try {
    const header = req.headers['x-init-data'];
    const initData = (Array.isArray(header) ? header[0] : header) ?? null;
    if (initData) viewerId = String(authUser(initData).id);
  } catch {
    // no/invalid init data -> viewer stays null, most conservative view is served
  }

  return res.json({ room: sanitizeRoom(room, viewerId) });
}
