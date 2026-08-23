import type { Player, TwentyRoom, Verdict } from './types.js';
import { otherPlayer } from './engine.js';

export const TWENTY_MAX = 20;

export function createTwenty(id: string, creator: Player): TwentyRoom {
  return {
    id,
    kind: 'twenty',
    players: [creator],
    turn: creator.id,
    answererId: creator.id,
    secret: '',
    used: 0,
    question: null,
    log: [],
    winner: null,
    status: 'waiting',
    reaction: null,
    chat: null,
    stats: { games: 0, wins: {} },
  };
}

function finish(room: TwentyRoom, winner: string | null): TwentyRoom {
  return {
    ...room,
    status: 'finished',
    winner,
    stats: {
      games: room.stats.games + 1,
      ...(winner ? { wins: { ...room.stats.wins, [winner]: (room.stats.wins[winner] ?? 0) + 1 } } : { wins: room.stats.wins }),
    },
  };
}

// ponytail: exact normalized match; a close-guess hint system only if guessing feels too harsh
export function normalizeSecret(text: string): string {
  return text.toLowerCase().trim().replace(/[.,!?'"]/g, '').replace(/\s+/g, ' ');
}

export function setSecret(room: TwentyRoom, playerId: string, secret: string): TwentyRoom {
  if (room.status !== 'setup' && room.status !== 'waiting') throw new Error('Not in setup');
  if (playerId !== room.answererId) throw new Error('Only the answerer picks the secret');
  const clean = secret.trim();
  if (!clean || clean.length > 80) throw new Error('Secret must be 1-80 characters');
  return {
    ...room,
    secret: clean,
    status: room.players.length === 2 ? 'playing' : room.status,
  };
}

export function askTwenty(room: TwentyRoom, playerId: string, question: string): TwentyRoom {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (playerId === room.answererId) throw new Error('The answerer cannot ask');
  if (room.used >= TWENTY_MAX) throw new Error('No questions left');
  const clean = question.trim();
  if (!clean || clean.length > 120) throw new Error('Question must be 1-120 characters');
  return { ...room, question: clean, used: room.used + 1 };
}

export function answerTwenty(room: TwentyRoom, playerId: string, verdict: Verdict): TwentyRoom {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (playerId !== room.answererId) throw new Error('Only the answerer can reply');
  if (!room.question) throw new Error('No question to answer');
  const log = [...room.log, { q: room.question, a: verdict }];
  const next: TwentyRoom = { ...room, question: null, log };
  // the 20th answer burns the last action -> no guess left, answerer survives
  return next.used >= TWENTY_MAX ? finish(next, next.answererId) : next;
}

export function guessSecret(room: TwentyRoom, playerId: string, text: string): { room: TwentyRoom; correct: boolean } {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (playerId === room.answererId) throw new Error('You know the secret already!');
  if (room.used >= TWENTY_MAX) throw new Error('No guesses left');
  const correct = normalizeSecret(text.trim()) === normalizeSecret(room.secret);
  let next: TwentyRoom = { ...room, used: room.used + 1 };
  if (correct) next = finish(next, playerId);
  else if (next.used >= TWENTY_MAX) next = finish(next, next.answererId);
  return { room: next, correct };
}

export function rematchTwenty(room: TwentyRoom): TwentyRoom {
  if (room.status !== 'finished') throw new Error('Game is not finished');
  const swapped = otherPlayer(room.players, room.answererId).id;
  return { ...room, answererId: swapped, secret: '', used: 0, question: null, log: [], winner: null, status: 'setup' };
}
