import type { Guess, Player, Room } from './types';

export function createRoom(id: string, range: { min: number; max: number }, players: [Player, Player]): Room {
  return {
    id,
    range,
    players,
    targets: {},
    turn: players[0].id,
    history: [],
    winner: null,
  };
}

export function setTarget(room: Room, playerId: string, value: number): Room {
  if (room.winner) throw new Error('Game is over');
  if (value < room.range.min || value > room.range.max) {
    throw new Error(`Target must be between ${room.range.min} and ${room.range.max}`);
  }
  return { ...room, targets: { ...room.targets, [playerId]: value } };
}

function opponentId(room: Room, playerId: string): string {
  return room.players[0].id === playerId ? room.players[1].id : room.players[0].id;
}

export function isReady(room: Room): boolean {
  return room.targets[room.players[0].id] !== undefined && room.targets[room.players[1].id] !== undefined;
}

export function guess(room: Room, playerId: string, value: number): { room: Room; hint: Guess['hint'] } {
  if (room.winner) throw new Error('Game is over');
  if (room.turn !== playerId) throw new Error('Not your turn');
  if (!isReady(room)) throw new Error('Both players must set a target first');
  if (value < room.range.min || value > room.range.max) {
    throw new Error(`Guess must be between ${room.range.min} and ${room.range.max}`);
  }

  const target = room.targets[opponentId(room, playerId)]!;
  const hint: Guess['hint'] = value === target ? 'hit' : value < target ? 'higher' : 'lower';
  const guessEntry: Guess = { playerId, value, hint };

  const nextRoom: Room = {
    ...room,
    history: [...room.history, guessEntry],
    turn: hint === 'hit' ? playerId : opponentId(room, playerId),
    winner: hint === 'hit' ? playerId : null,
  };

  return { room: nextRoom, hint };
}
