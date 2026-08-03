# AGENTS.md

Telegram Mini App: two-player "Guess the Number" couples game, plus a Telegram bot to launch it.

## Stack

- React + TypeScript (Vite)
- `@tma.js/sdk` — Telegram Mini App SDK (client)
- `grammY` — Telegram bot server
- Deployed on Vercel; repo at https://github.com/namonsi/telegram_games.git

## Commands

- `npm run dev` — start Vite dev server (client)
- `npm run build` — typecheck + production build
- `npm run preview` — preview the production build
- `npm run bot` — start the bot (long-polling)
- `npm run engine:check` — run the game-engine self-check

## Conventions

- TypeScript strict mode. No `any` without justification.
- Game engine lives in `src/game/` as pure TS functions with no React/DOM imports.
- No unrequested abstractions. Add modules when they actually repeat.
- Comments only where they name a deliberate simplification (`ponytail:`).
- Secrets (BOT_TOKEN) go in `.env` / Vercel env vars, never in source or the repo.
- `@tma.js/init-data-node` validates client init data server-side; token never ships to the client.

## Layout

```
src/
  main.tsx        SDK init + app mount
  App.tsx         screen router
  game/           pure engine + types (no UI)
  ui/             screens: Lobby, Setup, GameBoard, Result
bot/
  index.ts        grammY entry, /start → game link
```
