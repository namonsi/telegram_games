# AGENTS.md

Telegram Mini App: two-player "Guess the Number" couples game, plus a Telegram bot to launch it.

## Stack

- React + TypeScript (Vite)
- `@tma.js/sdk` — Telegram Mini App SDK (client)
- `@tma.js/init-data-node` — server-side init-data validation
- `@vercel/kv` — room state store (Vercel KV / Upstash)
- `grammY` — Telegram bot
- Serverless API on Vercel (`api/`); repo at https://github.com/namonsi/telegram_games.git

## Commands

- `npm run dev` — start Vite dev server (client, proxies /api to :8787)
- `npm run dev:api` — start local API (tsx scripts/dev-api.ts, in-memory store, skips auth)
- `npm run build` — typecheck + production build
- `npm run preview` — preview the production build
- `npm run bot` — start the bot (long-polling)
- `npm run webhook:set` — register WEBHOOK_URL on the bot
- `npm run engine:check` — run the game-engine self-check

## Conventions

- TypeScript strict mode. No `any` without justification.
- Game engine lives in `src/game/` as pure TS functions with no React/DOM imports; shared by client and API.
- API functions live in `api/` (Vercel serverless); handlers take `{ method, headers, query, body }` and `res.status().json()`.
- No unrequested abstractions. Add modules when they actually repeat.
- Comments only where they name a deliberate simplification (`ponytail:`).
- Secrets (BOT_TOKEN, KV_REST_API_URL/TOKEN) go in `.env` / Vercel env vars, never in source or the repo.
- `@tma.js/init-data-node` validates client init data server-side; token never ships to the client.
- Local dev (`scripts/dev-api.ts`) bypasses auth + uses an in-memory store when KV env vars are absent.

## Layout

```
src/
  main.tsx        SDK init + app mount (mock env outside Telegram)
  App.tsx         server-driven screen router (rooms polled via useRoom)
  api.ts          client fetch wrapper + invite link
  useRoom.ts      2s polling hook
  game/           pure engine + types + self-check (no UI)
  ui/             screens: Lobby, Setup, GameBoard, Result
api/
  store.ts        KV get/put (in-memory fallback for dev)
  core.ts         auth + actions (create/join/setTarget/guess/react/chat/rematch)
  game.ts         POST /api/game
  room.ts         GET /api/room
  webhook.ts      grammY webhook entry (Vercel)
bot/
  bot.ts          shared createBot (webApp button, /start, /exit)
  index.ts        long-poll entry
  set-webhook.ts  register webhook
scripts/
  dev-api.ts      local Vercel stand-in
```

## Rules

```
dont psuh any change to github with out my confirmation
```
