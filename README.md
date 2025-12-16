# Payments Dashboard + Clone API

## Quick start
1) `cp .env.example .env` and fill values.
2) Start Postgres, e.g. `docker run --name pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`.
3) Install deps: `npm i`.
4) DB: `npm run db:push && npm run db:seed`.
5) Run: `npm run dev` → http://localhost:3000/summary  
6) Prisma Studio: `npm run studio` → manage data visually.

## Live/Sandbox
- Toggle in header affects UI and **internal proxy**.  
- Client-facing **clone API** selects env by **API key**.

## Clone API (mirror)
- Base: `${PUBLIC_API_BASE_URL}` (from `.env`).
- Auth: `x-api-key`.
- Example passthrough: `GET /api/v1/payments?limit=10` → forwards to provider `/payments`.
- Provider only sees **our** `Authorization: Bearer ...` injected by `/api/internal/proxy`.

## Webhooks
- Expose `POST /api/webhooks/provider` with `x-webhook-signature = WEBHOOK_SECRET`.
- Store events in `WebhookEvent`.

## Notes
- Add rate limiting + request validation in `/pages/api/v1/[...path].ts` for production.
- Replace provider URLs & keys with real ones (permission assumed).


⸻

Prisma Studio — how to use
•Ensure DB is running and .env is set.
•npm run studio → opens GUI.
•Create/edit ApiKey rows for each client; set environment (SANDBOX/LIVE).
•View ApiLog to audit proxied requests; WebhookEvent to inspect events.

⸻

![screenshot](https://sand-mto.moovos.com/img/dashboard.png)
