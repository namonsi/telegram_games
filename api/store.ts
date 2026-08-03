import { kv } from '@vercel/kv';
import type { Room } from '../src/game/types';

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
