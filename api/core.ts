import { hashToken, parse, validate } from '@tma.js/init-data-node';
import { createRoom as engineCreate, guess, join, rematch, setChat, setReaction, setTarget } from '../src/game/engine.js';
import type { Player, Room } from '../src/game/types.js';
import { getRoom, putRoom } from './store.js';

const REACTION_TTL = 6000;
const CHAT_TTL = 6000;

type TelegramUser = {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
};

export function authUser(initData: string | null): TelegramUser {
  if (!initData) throw new Error('Missing init data');
  const dev = !process.env.KV_REST_API_URL;
  if (dev) {
    // ponytail: local dev skips signature check (mock hash); Vercel always validates.
    return parse(initData).user!;
  }
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error('BOT_TOKEN is not configured');
  validate(initData, token);
  const parsed = parse(initData);
  if (!parsed.user) throw new Error('init data has no user');
  return parsed.user;
}

function toPlayer(user: TelegramUser, firstName?: string): Player {
  return {
    id: String(user.id),
    firstName: firstName?.trim() || user.first_name,
    telegram: { tgId: user.id, username: user.username, photoUrl: user.photo_url },
  };
}

function mustPlayer(room: Room, userId: string): Player {
  const player = room.players.find((p) => p.id === userId);
  if (!player) throw new Error('You are not in this room');
  return player;
}

export async function create(initData: string, range: { min: number; max: number }, firstName?: string): Promise<Room> {
  const room = engineCreate(crypto.randomUUID(), range, toPlayer(authUser(initData), firstName));
  await putRoom(room);
  return room;
}

export async function joinRoom(initData: string, roomId: string, firstName?: string): Promise<Room> {
  const room = await getRoom(roomId);
  if (!room) throw new Error('Room not found');
  const player = toPlayer(authUser(initData), firstName);
  if (room.players.some((p) => p.id === player.id)) return room;
  const updated = join(room, player);
  await putRoom(updated);
  return updated;
}

export async function setMyTarget(initData: string, roomId: string, value: number): Promise<Room> {
  const room = await getRoom(roomId);
  if (!room) throw new Error('Room not found');
  const userId = authUser(initData).id.toString();
  mustPlayer(room, userId);
  const updated = setTarget(room, userId, value);
  await putRoom(updated);
  return updated;
}

export async function makeGuess(initData: string, roomId: string, value: number): Promise<Room> {
  const room = await getRoom(roomId);
  if (!room) throw new Error('Room not found');
  const userId = authUser(initData).id.toString();
  mustPlayer(room, userId);
  const { room: updated } = guess(room, userId, value);
  await putRoom(updated);
  return updated;
}

export async function react(initData: string, roomId: string, emoji: string): Promise<Room> {
  const room = await getRoom(roomId);
  if (!room) throw new Error('Room not found');
  const userId = authUser(initData).id.toString();
  mustPlayer(room, userId);
  const updated = setReaction(room, emoji, REACTION_TTL);
  await putRoom(updated);
  return updated;
}

export async function sendChat(initData: string, roomId: string, text: string): Promise<Room> {
  const room = await getRoom(roomId);
  if (!room) throw new Error('Room not found');
  const user = authUser(initData);
  const sender = room.players.find((p) => p.id === user.id.toString());
  if (!sender) throw new Error('You are not in this room');
  const updated = setChat(room, text.slice(0, 160), sender.firstName, CHAT_TTL);
  await putRoom(updated);
  return updated;
}

export async function rematchRoom(initData: string, roomId: string): Promise<Room> {
  const room = await getRoom(roomId);
  if (!room) throw new Error('Room not found');
  const userId = authUser(initData).id.toString();
  mustPlayer(room, userId);
  const updated = rematch(room);
  await putRoom(updated);
  return updated;
}
