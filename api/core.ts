import { parse, validate } from '@tma.js/init-data-node';
import { createRoom, guess as numberGuess, join, rematch as numberRematch, setChat, setReaction, setTarget } from '../src/game/engine.js';
import * as knowme from '../src/game/knowme.js';
import * as battleship from '../src/game/battleship.js';
import * as twenty from '../src/game/twenty.js';
import * as mystery from '../src/game/mystery.js';
import * as quiz from '../src/game/quiz.js';
import * as wordduel from '../src/game/wordduel.js';
import * as emoji from '../src/game/emojiriddle.js';
import type { GameKind, KnowMePick, Player, Range, Room } from '../src/game/types.js';
import { MYSTERY_CASES } from './mysteryCases.js';
import { QUIZ_BANK } from './quizBank.js';
import { WORD_BANK } from './wordBank.js';
import { EMOJI_BANK } from './emojiBank.js';
import { getRoom, putRoom, addGameRecord } from './store.js';
import { sanitizeRoom } from './view.js';

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

/** load room + auth + membership, run the pure engine step, persist, return the sanitized view */
async function withRoom(initData: string | undefined, roomId: string, fn: (room: Room, userId: string) => Room): Promise<Room> {
  const user = authUser(initData ?? null);
  const userId = String(user.id);
  const room = await getRoom(roomId);
  if (!room) throw new Error('Room not found');
  if (!room.players.some((p) => p.id === userId)) throw new Error('You are not in this room');
  const updated = fn(room, userId);
  await putRoom(updated);
  // a game just ended -> log it for the /admin page
  if (room.status !== 'finished' && updated.status === 'finished') {
    await addGameRecord({
      id: updated.id,
      kind: updated.kind,
      createdBy: room.players[0]?.id ?? '',
      players: updated.players.map((p) => ({
        id: p.id,
        tgId: p.telegram.tgId,
        firstName: p.firstName,
        username: p.telegram.username,
      })),
      winner: updated.winner,
      endedAt: Date.now(),
    }).catch((e) => console.error('addGameRecord failed:', e));
  }
  return sanitizeRoom(updated, userId);
}

function finite(value: number | undefined, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Invalid ${label}`);
  return value;
}

function randomCaseIndex(except?: number): number {
  let idx = Math.floor(Math.random() * MYSTERY_CASES.length);
  if (MYSTERY_CASES.length > 1 && idx === except) idx = (idx + 1) % MYSTERY_CASES.length;
  return idx;
}

export async function create(
  initData: string,
  kind: GameKind,
  range: Range,
  firstName?: string,
): Promise<Room> {
  const creator = toPlayer(authUser(initData), firstName);
  const id = crypto.randomUUID();
  let room: Room;
  switch (kind) {
    case 'number':
      room = createRoom(id, range, creator);
      break;
    case 'knowme':
      room = knowme.createKnowMe(id, creator);
      break;
    case 'battleship':
      room = battleship.createBattleship(id, creator);
      break;
    case 'twenty':
      room = twenty.createTwenty(id, creator);
      break;
    case 'mystery': {
      const idx = randomCaseIndex();
      room = mystery.createMystery(id, creator, idx, MYSTERY_CASES[idx]);
      break;
    }
    case 'quiz':
      room = quiz.createQuiz(id, creator, QUIZ_BANK.length);
      break;
    case 'wordduel': {
      const idx = Math.floor(Math.random() * WORD_BANK.length);
      room = wordduel.createWordDuel(id, creator, idx);
      break;
    }
    case 'emoji':
      room = emoji.createEmoji(id, creator, EMOJI_BANK.length);
      break;
  }
  await putRoom(room);
  await addGameRecord({
    id: room.id,
    kind: room.kind,
    createdBy: creator.id,
    players: room.players.map((p) => ({
      id: p.id,
      tgId: p.telegram.tgId,
      firstName: p.firstName,
      username: p.telegram.username,
    })),
    winner: null,
    endedAt: Date.now(),
  }).catch((e) => console.error('addGameRecord (create) failed:', e));
  return sanitizeRoom(room, creator.id);
}

/** games without a setup phase start the moment both seats are filled */
function kickoff(room: Room): Room {
  if (room.players.length < 2) return room;
  switch (room.kind) {
    case 'mystery':
      return mystery.startCase(room, room.caseIndex, MYSTERY_CASES[room.caseIndex]);
    case 'quiz':
      return { ...room, status: 'playing' };
    case 'wordduel':
      return { ...room, status: 'playing' };
    case 'emoji':
      return { ...room, status: 'playing' };
    case 'twenty':
      return room.secret ? { ...room, status: 'playing' } : room;
    default:
      return room;
  }
}

export async function joinRoom(initData: string | undefined, roomId: string, firstName?: string): Promise<Room> {
  // joins bypass the membership guard — that is their whole point
  const user = authUser(initData ?? null);
  const userId = String(user.id);
  const room = await getRoom(roomId);
  if (!room) throw new Error('Room not found');
  if (room.players.some((p) => p.id === userId)) return sanitizeRoom(room, userId);
  if (room.players.length >= 2) throw new Error('Room is full');
  const updated = kickoff(join(room, toPlayer(user, firstName)));
  await putRoom(updated);
  return sanitizeRoom(updated, userId);
}

export async function makeGuess(initData: string | undefined, roomId: string, value: number | undefined): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'number') throw new Error('Wrong game');
    return numberGuess(room, userId, finite(value, 'guess')).room;
  });
}

export async function setMyTarget(initData: string | undefined, roomId: string, value: number | undefined): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'number') throw new Error('Wrong game');
    return setTarget(room, userId, finite(value, 'number'));
  });
}

export async function submitKnowMePicks(initData: string | undefined, roomId: string, picks: KnowMePick[] | undefined): Promise<Room> {
  if (!Array.isArray(picks)) throw new Error('Invalid picks');
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'knowme') throw new Error('Wrong game');
    return knowme.submitPicks(room, userId, picks);
  });
}

export async function answerKnowMe(initData: string | undefined, roomId: string, text: string | undefined): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'knowme') throw new Error('Wrong game');
    return knowme.answerKnowMe(room, userId, text ?? '');
  });
}

export async function acceptKnowMeAnswer(initData: string | undefined, roomId: string, round: number | undefined): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'knowme') throw new Error('Wrong game');
    return knowme.acceptKnowMe(room, userId, finite(round, 'round'));
  });
}

export async function placeShips(initData: string | undefined, roomId: string, ships: number[][] | undefined): Promise<Room> {
  if (!Array.isArray(ships)) throw new Error('Invalid ships');
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'battleship') throw new Error('Wrong game');
    return battleship.placeShips(room, userId, ships);
  });
}

export async function fireShot(initData: string | undefined, roomId: string, cell: number | undefined): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'battleship') throw new Error('Wrong game');
    return battleship.fire(room, userId, finite(cell, 'cell')).room;
  });
}

export async function setSecret(initData: string | undefined, roomId: string, secret: string | undefined): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'twenty') throw new Error('Wrong game');
    return twenty.setSecret(room, userId, secret ?? '');
  });
}

export async function askTwenty(initData: string | undefined, roomId: string, question: string | undefined): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'twenty') throw new Error('Wrong game');
    return twenty.askTwenty(room, userId, question ?? '');
  });
}

export async function answerTwenty(initData: string | undefined, roomId: string, verdict: string | undefined): Promise<Room> {
  if (verdict !== 'yes' && verdict !== 'no' && verdict !== 'maybe') throw new Error('Invalid verdict');
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'twenty') throw new Error('Wrong game');
    return twenty.answerTwenty(room, userId, verdict);
  });
}

export async function guessSecret(initData: string | undefined, roomId: string, text: string | undefined): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'twenty') throw new Error('Wrong game');
    return twenty.guessSecret(room, userId, text ?? '').room;
  });
}

export async function investigate(initData: string | undefined, roomId: string): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'mystery') throw new Error('Wrong game');
    const next = mystery.investigate(room, userId);
    const clue = MYSTERY_CASES[next.caseIndex].clues[next.revealed - 1];
    return { ...next, shown: clue ? [...next.shown, clue] : next.shown };
  });
}

export async function accuse(initData: string | undefined, roomId: string, suspectId: string | undefined): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'mystery') throw new Error('Wrong game');
    const meta = MYSTERY_CASES[room.caseIndex];
    if (!suspectId) throw new Error('Pick a suspect');
    const { room: next } = mystery.accuse(room, userId, suspectId, meta.culpritId);
    // reveal the solution once the case is over
    return next.status === 'finished' ? { ...next, solution: meta.solution } : next;
  });
}

export async function answerQuiz(initData: string | undefined, roomId: string, choice: number | undefined): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'quiz') throw new Error('Wrong game');
    const meta = QUIZ_BANK[room.current];
    if (!meta) throw new Error('No active question');
    return quiz.answerQuiz(room, userId, finite(choice, 'answer'), meta, QUIZ_BANK.length);
  });
}

export async function guessWordDuel(initData: string | undefined, roomId: string, guess: string | undefined): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'wordduel') throw new Error('Wrong game');
    const word = WORD_BANK[room.wordIndex];
    if (!word) throw new Error('No active word');
    const next = wordduel.guessWord(room, userId, guess ?? '', word).room;
    // reveal the word once the duel is over
    return next.status === 'finished' ? { ...next, solution: word } : next;
  });
}

export async function answerEmojiRiddle(initData: string | undefined, roomId: string, answer: string | undefined): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) => {
    if (room.kind !== 'emoji') throw new Error('Wrong game');
    const meta = EMOJI_BANK[room.riddleIndex];
    if (!meta) throw new Error('No active riddle');
    return emoji.answerEmoji(room, userId, answer ?? '', meta, EMOJI_BANK.length);
  });
}

export async function react(initData: string | undefined, roomId: string, emoji: string | undefined): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) =>
    setReaction(room, (emoji ?? '').slice(0, 8), REACTION_TTL),
  );
}

export async function sendChat(initData: string | undefined, roomId: string, text: string | undefined): Promise<Room> {
  return withRoom(initData, roomId, (room, userId) => {
    const sender = room.players.find((p) => p.id === userId);
    return setChat(room, (text ?? '').trim().slice(0, 160), sender?.firstName ?? '', CHAT_TTL);
  });
}

export async function rematchRoom(initData: string | undefined, roomId: string): Promise<Room> {
  return withRoom(initData, roomId, (room) => {
    switch (room.kind) {
      case 'number':
        return numberRematch(room);
      case 'knowme':
        return knowme.rematchKnowMe(room);
      case 'battleship':
        return battleship.rematchBattleship(room);
      case 'twenty':
        return twenty.rematchTwenty(room);
      case 'mystery': {
        const idx = randomCaseIndex(room.caseIndex);
        return mystery.startCase(room, idx, MYSTERY_CASES[idx]);
      }
      case 'quiz':
        return quiz.rematchQuiz(room, QUIZ_BANK.length);
      case 'wordduel': {
        const idx = Math.floor(Math.random() * WORD_BANK.length);
        return wordduel.rematchWordDuel(room, idx);
      }
      case 'emoji':
        return emoji.rematchEmoji(room, EMOJI_BANK.length);
    }
  });
}
