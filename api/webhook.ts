import 'dotenv/config';
import { webhookCallback } from 'grammy';
import { createBot } from '../bot/bot.js';

// ponytail: "https" adapter matches Vercel's Node req/res shape, per grammY hosting docs.
const handleUpdate = webhookCallback(createBot(), 'https');

type VercelRequest = { method: string };
type VercelResponse = { status: (code: number) => { json: (data: unknown) => void; send: (data: string) => void } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    res.status(200).send('Guess the Number bot is running.');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  await handleUpdate(req as never, res as never);
}
