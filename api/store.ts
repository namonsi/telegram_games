import { kv } from '@vercel/kv';
import type { Room } from '../src/game/types.js';

// ponytail: in-memory fallback so local dev-api works without a KV store.
// Prod (Vercel) always has KV_REST_API_URL set.
const hasKV = Boolean(process.env.KV_REST_API_URL);
const memory = new Map<string, Room>();

export async function getRoom(id: string): Promise<Room | null> {
  if (!hasKV) return memory.get(id) ?? null;
  return kv.get<Room>(`room:${id}`);
}

export async function putRoom(room: Room): Promise<void> {
  if (!hasKV) {
    memory.set(room.id, room);
    return;
  }
  await kv.set(`room:${room.id}`, room);
}

// ---------- finished-games log for the /admin page ----------

export type GameRecord = {
  id: string;
  kind: Room['kind'];
  createdBy: string;
  players: { id: string; tgId: number; firstName: string; username?: string }[];
  winner: string | null;
  endedAt: number;
};

const LOG_KEY = 'admin:games';
const LOG_CAP = 500;

export async function addGameRecord(record: GameRecord): Promise<void> {
  if (!hasKV) {
    memoryLog.push(record);
    if (memoryLog.length > LOG_CAP) memoryLog.splice(0, memoryLog.length - LOG_CAP);
    return;
  }
  await kv.rpush(LOG_KEY, JSON.stringify(record));
  await kv.ltrim(LOG_KEY, -LOG_CAP, -1);
}

const memoryLog: GameRecord[] = [];

export async function getGameRecords(limit = 200): Promise<GameRecord[]> {
  if (!hasKV) return memoryLog.slice(-limit).reverse();
  const raw = await kv.lrange<string>(LOG_KEY, -limit, -1);
  return raw
    .map((s) => {
      try {
        return JSON.parse(s) as GameRecord;
      } catch {
        return null;
      }
    })
    .filter((r): r is GameRecord => r !== null)
    .reverse();
}
