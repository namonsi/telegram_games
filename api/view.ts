import { EMOJI_BANK } from './emojiBank.js';
import { QUIZ_BANK } from './quizBank.js';
import type {
  BattleshipRoom,
  Crazy8sRoom,
  EmojiRoom,
  KnowMeRoom,
  KnowMePick,
  NumberRoom,
  QuizRoom,
  Room,
  TwentyRoom,
  WordDuelRoom,
} from '../src/game/types.js';
import { otherPlayer } from '../src/game/engine.js';
import { KNOW_ME_ROUNDS, currentQuestion } from '../src/game/knowme.js';

/**
 * strips every secret the given viewer must not see; finished rooms reveal everything.
 * every API response goes through this — it is the only place that decides what a phone receives.
 */
export function sanitizeRoom(room: Room, viewerId: string | null): Room {
  // solo room: nothing to hide from the creator yet
  if (room.status === 'finished' || room.players.length < 2) return room;
  switch (room.kind) {
    case 'number':
      return sanitizeNumber(room, viewerId);
    case 'knowme':
      return sanitizeKnowMe(room, viewerId);
    case 'battleship':
      return sanitizeBattleship(room, viewerId);
    case 'twenty':
      return sanitizeTwenty(room, viewerId);
    case 'mystery':
      return room;
    case 'quiz':
      return sanitizeQuiz(room);
    case 'wordduel':
      return sanitizeWordDuel(room, viewerId);
    case 'emoji':
      return sanitizeEmoji(room, viewerId);
    case 'crazy8s':
      return sanitizeCrazy8s(room, viewerId);
    default:
      return room;
  }
}

function sanitizeNumber(room: NumberRoom, viewerId: string | null): NumberRoom {
  if (!viewerId || !room.players.some((p) => p.id === viewerId)) return { ...room, targets: {} };
  const partner = otherPlayer(room.players, viewerId).id;
  const targets = { ...room.targets };
  delete targets[partner];
  return { ...room, targets };
}

const blankPicks = (): KnowMePick[] =>
  Array.from({ length: KNOW_ME_ROUNDS }, () => ({ q: '', a: '' }));

function sanitizeKnowMe(room: KnowMeRoom, viewerId: string | null): KnowMeRoom {
  if (!viewerId || !room.players.some((p) => p.id === viewerId)) {
    return { ...room, picks: {} };
  }
  const partner = otherPlayer(room.players, viewerId).id;
  // only the CURRENT round's question text leaks from the partner's set
  const shown = room.status === 'playing' ? currentQuestion(room) : null;
  const picks: Record<string, KnowMePick[]> = {};
  // absent key = not submitted yet — the client relies on this to show the picker
  if (room.picks[viewerId]) picks[viewerId] = room.picks[viewerId];
  picks[partner] = blankPicks().map((_, i) => ({
    q: shown && i === Math.floor(room.round / 2) ? shown.q : '',
    a: '',
  }));
  return { ...room, picks };
}

function sanitizeBattleship(room: BattleshipRoom, viewerId: string | null): BattleshipRoom {
  if (!viewerId || !room.players.some((p) => p.id === viewerId)) return { ...room, ships: {} };
  const partner = otherPlayer(room.players, viewerId).id;
  const ships = { ...room.ships };
  delete ships[partner];
  return { ...room, ships };
}

function sanitizeTwenty(room: TwentyRoom, viewerId: string | null): TwentyRoom {
  if (viewerId === room.answererId) return room;
  return { ...room, secret: '' };
}

function sanitizeQuiz(room: QuizRoom): QuizRoom {
  const meta = QUIZ_BANK[room.current];
  return { ...room, currentQ: meta ? { q: meta.q, options: meta.options } : undefined };
}

/** opponent's guesses and tile feedback stay server-side; only try-counts leak */
function sanitizeWordDuel(room: WordDuelRoom, viewerId: string | null): WordDuelRoom {
  if (!viewerId || !room.players.some((p) => p.id === viewerId)) {
    return { ...room, guesses: {}, feedbacks: {}, progress: {} };
  }
  const partner = otherPlayer(room.players, viewerId).id;
  return {
    ...room,
    guesses: { [viewerId]: room.guesses[viewerId] ?? [] },
    feedbacks: { [viewerId]: room.feedbacks[viewerId] ?? [] },
    progress: {
      [viewerId]: room.guesses[viewerId]?.length ?? 0,
      [partner]: room.guesses[partner]?.length ?? 0,
    },
  };
}

/** riddle display comes from the server bank; answer texts hidden until the round resolves */
function sanitizeEmoji(room: EmojiRoom, viewerId: string | null): EmojiRoom {
  const meta = EMOJI_BANK[room.riddleIndex];
  const picks: Record<string, string> = {};
  for (const p of room.players) {
    const raw = room.picks[p.id];
    if (raw === undefined) continue;
    picks[p.id] = p.id === viewerId ? raw : '';
  }
  return { ...room, currentRiddle: meta ? { emojis: meta.emojis, category: meta.category } : undefined, picks };
}

/** opponent's hand is hidden; only the viewer's own hand leaks */
function sanitizeCrazy8s(room: Crazy8sRoom, viewerId: string | null): Crazy8sRoom {
  const handCount: Record<string, number> = {};
  for (const p of room.players) {
    handCount[p.id] = room.hands[p.id]?.length ?? 0;
  }
  if (!viewerId || !room.players.some(p => p.id === viewerId)) {
    return { ...room, hands: {}, handCount };
  }
  return { ...room, hands: { [viewerId]: room.hands[viewerId] ?? [] }, handCount };
}
