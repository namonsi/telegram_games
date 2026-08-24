import type { Chat, Guess, NumberRoom, Player, Range, Reaction } from './types.js';

export function otherPlayer(players: Player[], playerId: string): Player {
  const other = players.find((p) => p.id !== playerId);
  if (!other) throw new Error('Waiting for your partner to join');
  return other;
}

export function createRoom(id: string, range: Range, creator: Player): NumberRoom {
  return {
    id,
    kind: 'number',
    players: [creator],
    turn: creator.id,
    range,
    targets: {},
    history: [],
    winner: null,
    status: 'waiting',
    reaction: null,
    chat: null,
    stats: { games: 0, wins: {} },
  };
}

/** any game: second player joins a waiting room */
export function join<T extends { players: Player[]; status: NumberRoom['status'] }>(room: T, player: Player): T {
  if (room.status !== 'waiting') throw new Error('Room is not open for joining');
  return { ...room, players: [...room.players, player], status: 'setup' };
}

export function setTarget(room: NumberRoom, playerId: string, value: number): NumberRoom {
  if (room.status === 'finished') throw new Error('Game is over');
  if (value < room.range.min || value > room.range.max) {
    throw new Error(`Target must be between ${room.range.min} and ${room.range.max}`);
  }
  const targets = { ...room.targets, [playerId]: value };
  const allSet = room.players.length === 2 && room.players.every((p) => targets[p.id] !== undefined);
  return { ...room, targets, status: allSet ? 'playing' : 'setup' };
}

export function isReady(room: { status: NumberRoom['status'] }): boolean {
  return room.status === 'playing';
}

export function guess(room: NumberRoom, playerId: string, value: number): { room: NumberRoom; hint: Guess['hint'] } {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (room.turn !== playerId) throw new Error('Not your turn');
  if (value < room.range.min || value > room.range.max) {
    throw new Error(`Guess must be between ${room.range.min} and ${room.range.max}`);
  }

  const target = room.targets[otherPlayer(room.players, playerId).id];
  const hint: Guess['hint'] = value === target ? 'hit' : value < target ? 'higher' : 'lower';
  const guessEntry: Guess = { playerId, value, hint };
  const won = hint === 'hit';

  const nextRoom: NumberRoom = {
    ...room,
    history: [...room.history, guessEntry],
    turn: won ? playerId : otherPlayer(room.players, playerId).id,
    winner: won ? playerId : null,
    status: won ? 'finished' : 'playing',
    stats: won
      ? { games: room.stats.games + 1, wins: { ...room.stats.wins, [playerId]: (room.stats.wins[playerId] ?? 0) + 1 } }
      : room.stats,
  };

  return { room: nextRoom, hint };
}

export function rematch(room: NumberRoom): NumberRoom {
  if (room.status !== 'finished') throw new Error('Game is not finished');
  return { ...room, targets: {}, history: [], chatLog: [], winner: null, turn: room.players[0].id, status: 'setup' };
}

export function setReaction<T extends { reaction: Reaction | null }>(room: T, emoji: string, ttlMs: number, now = Date.now()): T {
  const reaction: Reaction = { emoji, expiresAt: now + ttlMs };
  return { ...room, reaction };
}

export function setChat<T extends { chat: Chat | null; chatLog?: { sender: string; text: string; at: number }[] }>(
  room: T,
  text: string,
  sender: string,
  ttlMs: number,
  now = Date.now(),
): T {
  const chat: Chat = { text, sender, expiresAt: now + ttlMs };
  // ponytail: cap at 100 messages — a couple's chat will never hit that in one game
  const chatLog = [...(room.chatLog ?? []).slice(-99), { sender, text, at: now }];
  return { ...room, chat, chatLog };
}
