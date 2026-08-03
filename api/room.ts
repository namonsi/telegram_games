import { getRoom } from './store.js';

type Req = {
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

  return res.json({ room });
}
