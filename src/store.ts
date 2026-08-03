import type { Room } from './game/types';

const KEY = 'gtn:rooms';
const STREAK_KEY = 'gtn:streak';

type Streaks = Record<string, Record<string, number>>;

export function saveRoom(room: Room): void {
  const all = loadRooms();
  all[room.id] = room;
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function loadRoom(id: string): Room | undefined {
  return loadRooms()[id];
}

function loadRooms(): Record<string, Room> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Room>;
  } catch {
    return {};
  }
}

export function addWin(roomId: string, playerId: string): void {
  const all = loadStreaks();
  const roomStreak = all[roomId] ?? {};
  roomStreak[playerId] = (roomStreak[playerId] ?? 0) + 1;
  all[roomId] = roomStreak;
  localStorage.setItem(STREAK_KEY, JSON.stringify(all));
}

export function loadStreak(roomId: string): Record<string, number> {
  return loadStreaks()[roomId] ?? {};
}

function loadStreaks(): Streaks {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) ?? '{}') as Streaks;
  } catch {
    return {};
  }
}

export function newId(): string {
  return crypto.randomUUID();
}
