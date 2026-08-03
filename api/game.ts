import { create, joinRoom, makeGuess, react, rematchRoom, sendChat, setMyTarget } from './core.js';

type Body = {
  action: 'create' | 'join' | 'setTarget' | 'guess' | 'react' | 'chat' | 'rematch';
  roomId?: string;
  range?: { min: number; max: number };
  target?: number;
  guess?: number;
  emoji?: string;
  text?: string;
  firstName?: string;
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
    case 'create':
      return create(initData!, body.range ?? { min: 1, max: 100 }, body.firstName);
    case 'join':
      return joinRoom(initData!, body.roomId!, body.firstName);
    case 'setTarget':
      return setMyTarget(initData!, body.roomId!, body.target!);
    case 'guess':
      return makeGuess(initData!, body.roomId!, body.guess!);
    case 'react':
      return react(initData!, body.roomId!, body.emoji!);
    case 'chat':
      return sendChat(initData!, body.roomId!, body.text!);
    case 'rematch':
      return rematchRoom(initData!, body.roomId!);
    default:
      throw new Error('Unknown action');
  }
}
