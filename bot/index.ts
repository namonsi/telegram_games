import 'dotenv/config';
import { Bot, InlineKeyboard } from 'grammy';

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN is required');
}

const webAppUrl = process.env.WEB_APP_URL ?? 'http://localhost:5173';

const bot = new Bot(token);

bot.command('start', async (ctx) => {
  await ctx.reply('Welcome to Guess the Number! 🎯 Tap play to start a round with your partner.', {
    reply_markup: new InlineKeyboard().webApp('Play Guess the Number', webAppUrl),
  });
});

bot.catch((err) => console.error('Bot error:', err));

bot.start();
