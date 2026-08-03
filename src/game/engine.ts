import type { Chat, Guess, Player, Reaction, Room } from './types';

export function createRoom(id: string, range: { min: number; max: number }, creator: Player): Room {
  return {
    id,
    range,
    players: [creator],
    targets: {},
    turn: creator.id,
    history: [],
    winner: null,
    status: 'waiting',
    reaction: null,
    chat: null,
    stats: { games: 0, wins: {} },
  };
}

export function join(room: Room, player: Player): Room {
  if (room.status !== 'waiting') throw new Error('Room is not open for joining');
  return { ...room, players: [...room.players, player], status: 'setup' };
}

export function setTarget(room: Room, playerId: string, value: number): Room {
  if (room.status === 'finished') throw new Error('Game is over');
  if (value < room.range.min || value > room.range.max) {
    throw new Error(`Target must be between ${room.range.min} and ${room.range.max}`);
  }
  const targets = { ...room.targets, [playerId]: value };
  const allSet = room.players.length === 2 && room.players.every((p) => targets[p.id] !== undefined);
  return { ...room, targets, status: allSet ? 'playing' : 'setup' };
}

function opponentId(room: Room, playerId: string): string {
  return room.players[0].id === playerId ? room.players[1].id : room.players[0].id;
}

export function isReady(room: Room): boolean {
  return room.status === 'playing';
}

export function guess(room: Room, playerId: string, value: number): { room: Room; hint: Guess['hint'] } {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (room.turn !== playerId) throw new Error('Not your turn');
  if (value < room.range.min || value > room.range.max) {
    throw new Error(`Guess must be between ${room.range.min} and ${room.range.max}`);
  }

  const target = room.targets[opponentId(room, playerId)]!;
  const hint: Guess['hint'] = value === target ? 'hit' : value < target ? 'higher' : 'lower';
  const guessEntry: Guess = { playerId, value, hint };
  const won = hint === 'hit';

  const nextRoom: Room = {
    ...room,
    history: [...room.history, guessEntry],
    turn: won ? playerId : opponentId(room, playerId),
    winner: won ? playerId : null,
    status: won ? 'finished' : 'playing',
    stats: won
      ? { games: room.stats.games + 1, wins: { ...room.stats.wins, [playerId]: (room.stats.wins[playerId] ?? 0) + 1 } }
      : room.stats,
  };

  return { room: nextRoom, hint };
}

export function rematch(room: Room): Room {
  if (room.status !== 'finished') throw new Error('Game is not finished');
  return { ...room, targets: {}, history: [], winner: null, turn: room.players[0].id, status: 'setup' };
}

export function setReaction(room: Room, emoji: string, ttlMs: number, now = Date.now()): Room {
  const reaction: Reaction = { emoji, expiresAt: now + ttlMs };
  return { ...room, reaction };
}

export function setChat(room: Room, text: string, sender: string, ttlMs: number, now = Date.now()): Room {
  const chat: Chat = { text, sender, expiresAt: now + ttlMs };
  return { ...room, chat };
}
