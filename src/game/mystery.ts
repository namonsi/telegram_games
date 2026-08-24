import type { MysteryRoom, Player, Suspect } from './types.js';
import { otherPlayer } from './engine.js';

export type CaseMeta = { title: string; story: string; suspects: Suspect[]; clues: string[]; scene?: string };

export function createMystery(id: string, creator: Player, caseIndex: number, meta: CaseMeta): MysteryRoom {
  return {
    id,
    kind: 'mystery',
    players: [creator],
    turn: '',
    caseIndex,
    title: meta.title,
    story: meta.story,
    suspects: meta.suspects,
    scene: meta.scene ?? '🕯️🔎',
    revealed: 0,
    clueCount: meta.clues.length,
    strikes: 0,
    shown: [],
    winner: null,
    status: 'waiting',
    reaction: null,
    chat: null,
    stats: { games: 0, wins: {} },
  };
}

/** start straight into a fresh case; no setup phase needed */
export function startCase(room: MysteryRoom, caseIndex: number, meta: CaseMeta): MysteryRoom {
  return {
    ...room,
    caseIndex,
    title: meta.title,
    story: meta.story,
    suspects: meta.suspects,
    scene: meta.scene ?? '🕯️🔎',
    clueCount: meta.clues.length,
    revealed: 0,
    strikes: 0,
    shown: [],
    chatLog: [],
    winner: null,
    turn: room.players[0].id,
    status: 'playing',
  };
}

export const MAX_STRIKES = 2;

export function investigate(room: MysteryRoom, playerId: string): MysteryRoom {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (room.turn !== playerId) throw new Error('Not your turn');
  if (room.revealed >= room.clueCount) throw new Error('No clues left — time to accuse!');
  return {
    ...room,
    revealed: room.revealed + 1,
    turn: otherPlayer(room.players, playerId).id,
  };
}

/** culpritId supplied by the server from its private case file */
export function accuse(
  room: MysteryRoom,
  playerId: string,
  suspectId: string,
  culpritId: string,
): { room: MysteryRoom; correct: boolean } {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (!room.suspects.some((s) => s.id === suspectId)) throw new Error('Unknown suspect');

  if (suspectId === culpritId) {
    const wins = { ...room.stats.wins };
    for (const p of room.players) wins[p.id] = (wins[p.id] ?? 0) + 1;
    const next: MysteryRoom = {
      ...room,
      status: 'finished',
      winner: 'team',
      stats: { games: room.stats.games + 1, wins, solved: (room.stats.solved ?? 0) + 1 },
    };
    return { room: next, correct: true };
  }

  const strikes = room.strikes + 1;
  const next: MysteryRoom = {
    ...room,
    strikes,
    turn: otherPlayer(room.players, playerId).id,
    ...(strikes >= MAX_STRIKES
      ? { status: 'finished' as const, winner: null, stats: { ...room.stats, games: room.stats.games + 1 } }
      : {}),
  };
  return { room: next, correct: false };
}
