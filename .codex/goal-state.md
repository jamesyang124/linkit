# Linkit — Current State

## Status

Rewrite from Rails complete. App promoted to project root. Rails files removed.

All core features shipped:
- Public gallery feed with keyset pagination (global + per-provider) and infinite scroll
- Post submission with OpenGraph enrichment (RabbitMQ worker or inline fallback)
- Image processing via Cloudinary/Sharp
- Auth.js credentials sign-in + registration
- Comments with adjacency list + Redis cache + lazy reply expand
- Saved posts (bookmark toggle, saved gallery in settings)
- Click-count redirects via `/r/[postId]`
- Post detail pages at `/p/[postId]`
- Persistent navigation, theme switcher (5 palettes)
- Mobile-responsive layout (horizontal provider chips, bottom-sheet modal)
- Docker Compose stack: caddy, web, worker, postgres, rabbitmq, redis

## Tech Stack

Next.js App Router · Auth.js v5 JWT · Drizzle ORM · PostgreSQL · RabbitMQ · Redis · Caddy · Vitest · Playwright

## Active Branch

`feat/rewrite-fe` on top of `master`.

## Dev Entrypoints

| Command | What it does |
|---|---|
| `npm run dev` | `docker compose up --build` — full stack |
| `npm run dev:web` | `next dev --hostname 0.0.0.0` — Next only |
| `npm test` | Vitest unit + integration |
| `npm run test:e2e` | Playwright E2E (requires `TEST_DATABASE_URL`) |
| `npm run typecheck` | `tsc --noEmit` |

Default browser URL: `https://localhost:8443` (Caddy HTTPS, self-signed cert).

## Resume Instructions

1. Read `docs/architecture.md` for codebase layout and data flows.
2. Read `docs/design.md` for visual conventions and component patterns.
3. Read `docs/decisions.md` for why key choices were made.
4. Inspect current files before editing — memory notes may be stale.
5. Run `npm run typecheck` before committing changes.
