import type { Player, QuizRoom } from './types.js';

export const QUIZ_TARGET = 7;

type QMeta = { q: string; options: string[]; correct: number };

// ponytail: Math.random for question picks; deterministic seeding only if we ever replay rooms
function pickUnused(asked: number[], bankSize: number): number | null {
  const unused: number[] = [];
  for (let i = 0; i < bankSize; i++) if (!asked.includes(i)) unused.push(i);
  return unused.length ? unused[Math.floor(Math.random() * unused.length)] : null;
}

export function createQuiz(id: string, creator: Player, bankSize: number): QuizRoom {
  const first = pickUnused([], bankSize);
  if (first === null) throw new Error('Question bank is empty');
  return {
    id,
    kind: 'quiz',
    players: [creator],
    turn: '',
    asked: [first],
    current: first,
    picks: {},
    scores: {},
    target: QUIZ_TARGET,
    results: [],
    winner: null,
    status: 'waiting',
    reaction: null,
    chat: null,
    stats: { games: 0, wins: {} },
  };
}

export function answerQuiz(room: QuizRoom, playerId: string, choice: number, qMeta: QMeta, bankSize: number): QuizRoom {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (!Number.isInteger(choice) || choice < 0 || choice >= qMeta.options.length) throw new Error('Invalid option');
  if (room.picks[playerId] !== undefined) throw new Error('You already answered this round');

  const picks = { ...room.picks, [playerId]: choice };
  if (room.players.length < 2 || !room.players.every((p) => picks[p.id] !== undefined)) {
    return { ...room, picks };
  }

  // both answered -> reveal, score, advance
  const scores = { ...room.scores };
  for (const p of room.players) {
    if (picks[p.id] === qMeta.correct) scores[p.id] = (scores[p.id] ?? 0) + 1;
  }

  let next: QuizRoom = {
    ...room,
    picks: {},
    scores,
    results: [...room.results, { q: qMeta.q, options: qMeta.options, correct: qMeta.correct, picks }],
    stats: { ...room.stats, games: room.stats.games + 1 },
  };

  const top = Math.max(...room.players.map((p) => scores[p.id] ?? 0));
  const leaders = room.players.filter((p) => (scores[p.id] ?? 0) === top);
  // ponytail: tie at target keeps playing until someone leads alone
  if (top < next.target || leaders.length !== 1) {
    const nextIdx = pickUnused(next.asked, bankSize);
    if (nextIdx === null) {
      return { ...next, status: 'finished', winner: leaders.length === 1 ? leaders[0].id : null };
    }
    return { ...next, asked: [...next.asked, nextIdx], current: nextIdx };
  }

  const winner = leaders[0].id;
  return {
    ...next,
    status: 'finished',
    winner,
    stats: { ...next.stats, wins: { ...next.stats.wins, [winner]: (next.stats.wins[winner] ?? 0) + 1 } },
  };
}

export function rematchQuiz(room: QuizRoom, bankSize: number): QuizRoom {
  if (room.status !== 'finished') throw new Error('Game is not finished');
  const first = pickUnused([], bankSize);
  if (first === null) throw new Error('Question bank is empty');
  return {
    ...room,
    asked: [first],
    current: first,
    picks: {},
    scores: {},
    results: [],
    chatLog: [],
    winner: null,
    turn: '',
    status: 'playing',
  };
}
