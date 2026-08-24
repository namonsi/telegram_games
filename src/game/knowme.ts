import type { KnowMePick, KnowMeRoom, Player } from './types.js';
import { otherPlayer } from './engine.js';

export const KNOW_ME_ROUNDS = 5;

export function createKnowMe(id: string, creator: Player): KnowMeRoom {
  return {
    id,
    kind: 'knowme',
    players: [creator],
    turn: '',
    picks: {},
    round: 0,
    log: [],
    winner: null,
    status: 'waiting',
    reaction: null,
    chat: null,
    stats: { games: 0, wins: {} },
  };
}

/** even round -> players[0] asks (partner guesses their answer); odd -> players[1] */
function askerOf(room: KnowMeRoom): Player {
  return room.players[room.round % 2];
}

export function guesserId(room: KnowMeRoom): string {
  return otherPlayer(room.players, askerOf(room).id).id;
}

export function currentQuestion(room: KnowMeRoom): { q: string; askerName: string } | null {
  if (room.status !== 'playing') return null;
  const asker = askerOf(room);
  const pick = room.picks[asker.id]?.[Math.floor(room.round / 2)];
  return pick ? { q: pick.q, askerName: asker.firstName } : null;
}

export function submitPicks(room: KnowMeRoom, playerId: string, picks: KnowMePick[]): KnowMeRoom {
  if (room.status !== 'setup' && room.status !== 'waiting') throw new Error('Not in setup');
  if (picks.length !== KNOW_ME_ROUNDS) throw new Error(`Pick exactly ${KNOW_ME_ROUNDS} questions`);
  for (const p of picks) {
    if (!p.q.trim() || !p.a.trim()) throw new Error('Questions and answers cannot be empty');
    if (p.q.length > 140 || p.a.length > 80) throw new Error('Question or answer too long');
  }
  const clean = picks.map((p) => ({ q: p.q.trim(), a: p.a.trim() }));
  const entries = { ...room.picks, [playerId]: clean };
  const allSet = room.players.length === 2 && room.players.every((p) => entries[p.id] !== undefined);
  const next: KnowMeRoom = { ...room, picks: entries, status: allSet ? 'playing' : room.status };
  if (allSet) next.turn = guesserId(next);
  return next;
}

// ponytail: exact normalized match for answers; fuzzy matching only if near-misses get annoying
function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[.,!?'"]/g, '').replace(/\s+/g, ' ');
}

export function answerKnowMe(room: KnowMeRoom, playerId: string, text: string): KnowMeRoom {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (room.turn !== playerId) throw new Error('Not your turn to guess');
  const answer = text.trim();
  if (!answer || answer.length > 80) throw new Error('Answer must be 1-80 characters');

  const asker = askerOf(room);
  const secret = room.picks[asker.id][Math.floor(room.round / 2)].a;
  const correct = normalize(answer) === normalize(secret);

  const round = room.round + 1;
  const log = [...room.log, { byId: playerId, text: answer, correct }];
  let next: KnowMeRoom = { ...room, round, log };

  if (round === KNOW_ME_ROUNDS * 2) {
    const hits = (id: string) => log.filter((e) => e.byId === id && e.correct).length;
    const mine = hits(playerId);
    const theirs = hits(otherPlayer(room.players, playerId).id);
    next = {
      ...next,
      status: 'finished',
      winner: mine === theirs ? null : mine > theirs ? playerId : otherPlayer(room.players, playerId).id,
      stats: { ...next.stats, games: next.stats.games + 1 },
    };
  } else {
    next.turn = guesserId(next);
  }
  return next;
}

/** the asker counts a near-miss guess ("cat" vs "cats") as correct; recounts the result if done */
export function acceptKnowMe(room: KnowMeRoom, playerId: string, round: number): KnowMeRoom {
  if (room.status !== 'playing' && room.status !== 'finished') throw new Error('Game is not in progress');
  if (!Number.isInteger(round) || round < 0 || round >= room.log.length) throw new Error('Invalid round');
  const asker = room.players[round % 2];
  if (asker.id !== playerId) throw new Error('Only the question owner can accept an answer');
  if (room.log[round].correct) throw new Error('Already counted as correct');
  const log = room.log.map((e, i) => (i === round ? { ...e, correct: true } : e));
  const next: KnowMeRoom = { ...room, log };
  if (next.status !== 'finished') return next;
  const hits = (id: string) => log.filter((e) => e.byId === id && e.correct).length;
  const [a, b] = next.players;
  const ha = hits(a.id);
  const hb = hits(b.id);
  return { ...next, winner: ha === hb ? null : ha > hb ? a.id : b.id };
}

export function rematchKnowMe(room: KnowMeRoom): KnowMeRoom {
  if (room.status !== 'finished') throw new Error('Game is not finished');
  return { ...room, picks: {}, round: 0, log: [], chatLog: [], winner: null, turn: '', status: 'setup' };
}
