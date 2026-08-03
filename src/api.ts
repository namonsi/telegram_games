import { initData } from '@tma.js/sdk';
import type { Room } from './game/types';

const BOT_USERNAME = 'embel_games_bot';

type Action =
  | { action: 'create'; range: { min: number; max: number }; firstName: string }
  | { action: 'join'; roomId: string; firstName?: string }
  | { action: 'setTarget'; roomId: string; target: number }
  | { action: 'guess'; roomId: string; guess: number }
  | { action: 'react'; roomId: string; emoji: string }
  | { action: 'chat'; roomId: string; text: string }
  | { action: 'rematch'; roomId: string };

async function post(body: Action): Promise<Room> {
  const res = await fetch('/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-init-data': initData.raw() ?? '' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { room?: Room; error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data.room!;
}

export async function fetchRoom(id: string): Promise<Room | null> {
  const res = await fetch(`/api/room?id=${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  const data = (await res.json()) as { room: Room };
  return data.room;
}

export const api = {
  create: (range: { min: number; max: number }, firstName: string) => post({ action: 'create', range, firstName }),
  join: (roomId: string, firstName?: string) => post({ action: 'join', roomId, firstName }),
  setTarget: (roomId: string, target: number) => post({ action: 'setTarget', roomId, target }),
  guess: (roomId: string, guess: number) => post({ action: 'guess', roomId, guess }),
  react: (roomId: string, emoji: string) => post({ action: 'react', roomId, emoji }),
  chat: (roomId: string, text: string) => post({ action: 'chat', roomId, text }),
  rematch: (roomId: string) => post({ action: 'rematch', roomId }),
};

export function inviteLink(roomId: string): string {
  return `https://t.me/${BOT_USERNAME}?startapp=${roomId}`;
}
