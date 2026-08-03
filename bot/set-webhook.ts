import 'dotenv/config';
import { Bot } from 'grammy';

const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN is required');
const url = process.env.WEBHOOK_URL;
if (!url) throw new Error('WEBHOOK_URL is required, e.g. https://your-app.vercel.app/api/webhook');

const bot = new Bot(token);
await bot.api.setWebhook(url, { drop_pending_updates: true });
const info = await bot.api.getWebhookInfo();
console.log(`Webhook set to ${url}\nPending updates: ${info.pending_update_count}`);
