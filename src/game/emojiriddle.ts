import type { EmojiRoom, Player } from './types.js';

export const EMOJI_TARGET = 7;

export type RiddleMeta = { emojis: string; category: string; answer: string };

// ponytail: Math.random for riddle picks, same as quiz; deterministic seeding if ever needed
function pickUnused(seen: number[], bankSize: number): number | null {
  const unused: number[] = [];
  for (let i = 0; i < bankSize; i++) if (!seen.includes(i)) unused.push(i);
  return unused.length ? unused[Math.floor(Math.random() * unused.length)] : null;
}

export function createEmoji(id: string, creator: Player, bankSize: number): EmojiRoom {
  const first = pickUnused([], bankSize);
  if (first === null) throw new Error('Riddle bank is empty');
  return {
    id,
    kind: 'emoji',
    players: [creator],
    turn: '',
    asked: [first],
    riddleIndex: first,
    picks: {},
    scores: {},
    target: EMOJI_TARGET,
    results: [],
    winner: null,
    status: 'waiting',
    reaction: null,
    chat: null,
    stats: { games: 0, wins: {} },
  };
}

export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^(the|a|an)\s+/, '');
}

export function answerEmoji(room: EmojiRoom, playerId: string, answer: string, meta: RiddleMeta, bankSize: number): EmojiRoom {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (room.picks[playerId] !== undefined) throw new Error('You already answered this riddle');
  const clean = answer.trim();
  if (!clean || clean.length > 60) throw new Error('Answer must be 1-60 characters');

  const picks = { ...room.picks, [playerId]: clean };
  if (room.players.length < 2 || !room.players.every((p) => picks[p.id] !== undefined)) {
    return { ...room, picks };
  }

  // both answered -> reveal, score, advance
  const scores = { ...room.scores };
  for (const p of room.players) {
    if (normalizeAnswer(picks[p.id]) === normalizeAnswer(meta.answer)) scores[p.id] = (scores[p.id] ?? 0) + 1;
  }

  let next: EmojiRoom = {
    ...room,
    picks: {},
    scores,
    results: [...room.results, { emojis: meta.emojis, category: meta.category, answer: meta.answer, picks }],
    stats: { ...room.stats, games: room.stats.games + 1 },
  };

  const top = Math.max(...room.players.map((p) => scores[p.id] ?? 0));
  const leaders = room.players.filter((p) => (scores[p.id] ?? 0) === top);
  if (top < next.target || leaders.length !== 1) {
    const nextIdx = pickUnused(next.asked, bankSize);
    if (nextIdx === null) {
      return { ...next, status: 'finished', winner: leaders.length === 1 ? leaders[0].id : null };
    }
    return { ...next, asked: [...next.asked, nextIdx], riddleIndex: nextIdx };
  }

  const winner = leaders[0].id;
  return {
    ...next,
    status: 'finished',
    winner,
    stats: { ...next.stats, wins: { ...next.stats.wins, [winner]: (next.stats.wins[winner] ?? 0) + 1 } },
  };
}

export function rematchEmoji(room: EmojiRoom, bankSize: number): EmojiRoom {
  if (room.status !== 'finished') throw new Error('Game is not finished');
  const first = pickUnused([], bankSize);
  if (first === null) throw new Error('Riddle bank is empty');
  return {
    ...room,
    asked: [first],
    riddleIndex: first,
    picks: {},
    scores: {},
    results: [],
    winner: null,
    turn: '',
    status: 'playing',
  };
}
