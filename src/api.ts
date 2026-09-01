import { initData } from '@tma.js/sdk';
import type {
  BattleshipRoom,
  Crazy8sRoom,
  EmojiRoom,
  GameKind,
  KnowMeRoom,
  MysteryRoom,
  QuizRoom,
  Room,
  TwentyRoom,
  WordDuelRoom,
} from './game/types';

const BOT_USERNAME = 'embel_games_bot';

export type SurpriseKind = 'note' | 'gift' | 'random';

type Body = {
  action: string;
  roomId?: string;
  kind?: GameKind;
  range?: { min: number; max: number };
  target?: number;
  guess?: number;
  picks?: { q: string; a: string }[];
  text?: string;
  ships?: number[][];
  cell?: number;
  secret?: string;
  question?: string;
  verdict?: string;
  suspectId?: string;
  choice?: number;
  round?: number;
  emoji?: string;
  firstName?: string;
  card?: number;
  color?: string;
};

async function post<T = Room>(body: Body): Promise<T> {
  const res = await fetch('/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-init-data': initData.raw() ?? '' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { room?: Room; error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data.room! as T;
}

export async function fetchRoom(id: string): Promise<Room | null> {
  const res = await fetch(`/api/room?id=${encodeURIComponent(id)}`, {
    headers: { 'x-init-data': initData.raw() ?? '' },
  });
  if (res.status === 404) return null;
  const data = (await res.json()) as { room: Room };
  return data.room;
}

export const api = {
  create: (kind: GameKind, range: { min: number; max: number }, firstName: string) =>
    post({ action: 'create', kind, range, firstName }),
  join: (roomId: string, firstName?: string) => post({ action: 'join', roomId, firstName }),
  setTarget: (roomId: string, target: number) => post({ action: 'setTarget', roomId, target }),
  guess: (roomId: string, guess: number) => post({ action: 'guess', roomId, guess }),
  submitPicks: (roomId: string, picks: { q: string; a: string }[]) => post<KnowMeRoom>({ action: 'submitPicks', roomId, picks }),
  answerKnowMe: (roomId: string, text: string) => post<KnowMeRoom>({ action: 'answerKnowMe', roomId, text }),
  acceptKnowMe: (roomId: string, round: number) => post<KnowMeRoom>({ action: 'acceptKnowMe', roomId, round }),
  placeShips: (roomId: string, ships: number[][]) => post<BattleshipRoom>({ action: 'placeShips', roomId, ships }),
  fire: (roomId: string, cell: number) => post<BattleshipRoom>({ action: 'fire', roomId, cell }),
  setSecret: (roomId: string, secret: string) => post<TwentyRoom>({ action: 'setSecret', roomId, secret }),
  askTwenty: (roomId: string, question: string) => post<TwentyRoom>({ action: 'ask', roomId, question }),
  answerTwenty: (roomId: string, verdict: string) => post<TwentyRoom>({ action: 'answerTwenty', roomId, verdict }),
  guessSecret: (roomId: string, text: string) => post<TwentyRoom>({ action: 'guessSecret', roomId, text }),
  investigate: (roomId: string) => post<MysteryRoom>({ action: 'investigate', roomId }),
  accuse: (roomId: string, suspectId: string) => post<MysteryRoom>({ action: 'accuse', roomId, suspectId }),
  answerQuiz: (roomId: string, choice: number) => post<QuizRoom>({ action: 'answerQuiz', roomId, choice }),
  guessWord: (roomId: string, word: string) => post<WordDuelRoom>({ action: 'guessWord', roomId, text: word }),
  answerEmoji: (roomId: string, answer: string) => post<EmojiRoom>({ action: 'answerEmoji', roomId, text: answer }),

  playCard: (roomId: string, cardIndex: number, chosenColor?: string) =>
    post<Crazy8sRoom>({ action: 'playCard', roomId, card: cardIndex, color: chosenColor }),
  drawCard: (roomId: string) => post<Crazy8sRoom>({ action: 'drawCard', roomId }),

  react: (roomId: string, emoji: string) => post({ action: 'react', roomId, emoji }),
  chat: (roomId: string, text: string) => post({ action: 'chat', roomId, text }),
  rematch: (roomId: string) => post({ action: 'rematch', roomId }),
};

export function inviteLink(roomId: string, gift?: SurpriseKind): string {
  // "_" separator: Telegram strips most punctuation from startapp params
  const start = gift ? `${roomId}_${gift}` : roomId;
  return `https://t.me/${BOT_USERNAME}?startapp=${encodeURIComponent(start)}`;
}
