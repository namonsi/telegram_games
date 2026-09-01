import {
  acceptKnowMeAnswer,
  accuse,
  answerEmojiRiddle,
  answerKnowMe,
  answerQuiz,
  answerTwenty,
  askTwenty,
  create,
  drawCrazy8s,
  fireShot,
  guessSecret,
  guessWordDuel,
  investigate,
  joinRoom,
  makeGuess,
  moveGuard,
  moveThief,
  playCrazy8sCard,
  placeShips,
  react,
  rematchRoom,
  sendChat,
  sendHeistMessage,
  setMyTarget,
  setSecret,
  submitKnowMePicks,
} from './core.js';
import type { GameKind, Range } from '../src/game/types.js';

type Body = {
  action:
    | 'create'
    | 'join'
    | 'setTarget'
    | 'guess'
    | 'submitPicks'
    | 'answerKnowMe'
    | 'acceptKnowMe'
    | 'placeShips'
    | 'fire'

    | 'setSecret'
    | 'ask'
    | 'answerTwenty'
    | 'guessSecret'
    | 'investigate'
    | 'accuse'
    | 'answerQuiz'
    | 'guessWord'
    | 'answerEmoji'
    | 'playCard'
    | 'drawCard'
    | 'react'
    | 'chat'
    | 'moveThief'
    | 'moveGuard'
    | 'sendHeistMessage'
    | 'rematch';
  roomId?: string;
  kind?: GameKind;
  range?: Range;
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
  direction?: string;
  guardIndex?: number;
};

type Req = {
  method: string;
  headers: { [key: string]: string | string[] | undefined };
  query: { [key: string]: string | string[] | undefined };
  body: unknown;
};

type Res = {
  status: (code: number) => { json: (data: unknown) => void };
  json: (data: unknown) => void;
};

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const header = req.headers['x-init-data'];
  const initData = (Array.isArray(header) ? header[0] : header) ?? (req.query['initData'] as string | undefined);
  const body = (req.body ?? {}) as Body;

  try {
    const room = await run(body, initData);
    return res.json({ room });
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Bad request' });
  }
}

async function run(body: Body, initData: string | undefined): Promise<unknown> {
  switch (body.action) {
    case 'create': {
      const range = body.range ?? { min: 1, max: 100 };
      if (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min >= range.max) {
        throw new Error('Invalid range');
      }
      return create(initData!, body.kind ?? 'number', range, body.firstName);
    }
    case 'join':
      return joinRoom(initData, body.roomId!, body.firstName);
    case 'setTarget':
      return setMyTarget(initData, body.roomId!, body.target);
    case 'guess':
      return makeGuess(initData, body.roomId!, body.guess);
    case 'submitPicks':
      return submitKnowMePicks(initData, body.roomId!, body.picks);
    case 'answerKnowMe':
      return answerKnowMe(initData, body.roomId!, body.text);
    case 'acceptKnowMe':
      return acceptKnowMeAnswer(initData, body.roomId!, body.round);
    case 'placeShips':
      return placeShips(initData, body.roomId!, body.ships);
    case 'fire':
      return fireShot(initData, body.roomId!, body.cell);

    case 'setSecret':
      return setSecret(initData, body.roomId!, body.secret);
    case 'ask':
      return askTwenty(initData, body.roomId!, body.question);
    case 'answerTwenty':
      return answerTwenty(initData, body.roomId!, body.verdict);
    case 'guessSecret':
      return guessSecret(initData, body.roomId!, body.text);
    case 'investigate':
      return investigate(initData, body.roomId!);
    case 'accuse':
      return accuse(initData, body.roomId!, body.suspectId);
    case 'answerQuiz':
      return answerQuiz(initData, body.roomId!, body.choice);
    case 'guessWord':
      return guessWordDuel(initData, body.roomId!, body.text);
    case 'answerEmoji':
      return answerEmojiRiddle(initData, body.roomId!, body.text);
    case 'playCard':
      return playCrazy8sCard(initData, body.roomId!, body.card, body.color);
    case 'drawCard':
      return drawCrazy8s(initData, body.roomId!);
    case 'react':
      return react(initData, body.roomId!, body.emoji);
    case 'chat':
      return sendChat(initData, body.roomId!, body.text);
    case 'moveThief':
      return moveThief(initData, body.roomId!, body.direction!);
    case 'moveGuard': {
      const gi = body.guardIndex;
      if (typeof gi !== 'number' || !Number.isFinite(gi)) throw new Error('Invalid guardIndex');
      return moveGuard(initData, body.roomId!, gi);
    }
    case 'sendHeistMessage':
      return sendHeistMessage(initData, body.roomId!, body.text!);
    case 'rematch':
      return rematchRoom(initData, body.roomId!);
    default:
      throw new Error('Unknown action');
  }
}
