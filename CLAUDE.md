# CLAUDE.md — Linkit

## Stack

- **Next.js 15** (App Router, RSC + client components)
- **Auth.js v5** (credentials + Facebook OAuth, JWT strategy)
- **Drizzle ORM** + **PostgreSQL**
- **RabbitMQ** (async jobs via amqplib)
- **Redis** (comment cache, ioredis)
- **Sharp** (image processing)
- **Tailwind CSS v3** + **Vitest** + **Playwright**

## Directory Structure

```
app/               Next.js routes, layouts, server actions
components/        React UI components (mostly "use client")
src/
  auth/            Auth.js config + DrizzleAdapter
  db/              Schema (schema.ts), client factory, linkit-store.ts
  domain/          linkit.ts — framework-free domain types + interfaces
  feed/            load-feed.ts, keyset.ts, view-model.ts
  images/          ImageUploader interface + Sharp/Cloudinary impls
  metadata/        PostMetadataProvider interface + OpenGraph impl
  notifications/   Mailer interface + Mailgun impl
  queue/           Job types, RabbitMQ publisher
  server/          posts.ts, register.ts, runtime.ts, redis.ts, revalidate.ts
  worker/          RabbitMQ consumer (run standalone via `npm run worker`)
  env.ts           Zod env validation
  migration/       Legacy Rails import helpers
types/             TypeScript type definitions
scripts/           Seed scripts, legacy import/verify, check-env
tests/             Vitest unit/integration tests
e2e/               Playwright E2E tests
drizzle/           Migration SQL files
docs/              architecture.md, design.md, decisions.md
```

## Commands

```bash
npm run dev              # Docker Compose: Caddy + web + worker + Postgres + RabbitMQ + Redis
npm run dev:web          # Next.js dev only (needs Docker services running separately)
npm run worker           # Start background job worker
npm run db:generate      # Generate Drizzle migration
npm run db:migrate       # Apply migrations
npm run seed:dev         # Create test accounts + posts
npm run seed:gallery     # Load gallery images
npm run test             # Vitest unit/integration
npm run test:watch       # Vitest watch mode
npm run test:e2e         # Playwright E2E (requires TEST_DATABASE_URL env var)
npm run typecheck        # tsc --noEmit
npm run legacy:import    # Import Rails SQLite export (tsx directly, not npm run)
npm run legacy:verify    # Verify import contract
```

> **Note**: Use `tsx` directly for `legacy:import` and `legacy:verify` — the RTK proxy can hang npm run scripts.

## Environment Variables

Copy `.env.example` → `.env`. Key vars:

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Postgres connection |
| `RABBITMQ_URL` | RabbitMQ connection |
| `REDIS_URL` | Redis connection |
| `AUTH_SECRET` | Auth.js JWT secret (32+ chars in prod) |
| `REVALIDATE_SECRET` | Cache revalidation API guard |
| `AUTH_TRUST_HOST` | Set `true` behind proxy |
| `APP_URL` | Public URL (used for email links) |
| `AUTH_FACEBOOK_ID/SECRET` | Optional Facebook OAuth |
| `CLOUDINARY_*` | Optional image hosting (else local `public/uploads/`) |
| `MAILGUN_API_KEY/DOMAIN` | Optional comment email notifications |
| `LINK_METADATA_PROVIDER` | `embedly` or custom |
| `EMBEDLY_API_KEY` | Optional (for embedly provider) |

Validated at startup via `src/env.ts` (Zod schema). Use `npm run check-env` to validate production env.

## Key Patterns

### Database

```ts
// Always use shared client from src/db/client.ts
import { createDb } from "@/src/db/client";
// Interact through store interface (testable)
import { createLinkitStore } from "@/src/db/linkit-store";
```

- Schema defined in `src/db/schema.ts`
- Tables: `users`, `accounts`, `sessions`, `verificationTokens`, `posts`, `comments`, `savedPosts`
- Global client cached on `globalThis.__linkitPostgresClients` to avoid connection leaks in dev HMR
- Run `npm run db:generate` then `npm run db:migrate` after schema changes

### Server Actions

```ts
// Pattern: accept FormData, return { ok, message, ...payload }
export async function myAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  const session = await auth();
  if (!session) return { ok: false, message: "Unauthorized" };
  const services = await createRuntimeServices();
  try {
    // ... do work
    revalidateTag("public-feed");
    revalidatePath("/");
    return { ok: true };
  } finally {
    await services.close();
  }
}
```

- Defined in `app/*-actions.ts` or `src/server/*.ts`
- Always call `auth()` for session check
- Use `createRuntimeServices()` for store + enqueue
- Return `{ ok: true/false, message?, ...payload }` union
- Call `revalidateTag("public-feed")` + `revalidatePath("/")` after mutations

### Caching

```ts
// Server-side (Next.js cache)
const data = unstable_cache(fetchFn, ["cache-key"], { tags: ["public-feed"] });
// Client-side (Redis)
await getCachedTopLevelComments(postId) // 60s TTL
await invalidateTopLevelComments(postId) // called on comment write
// Cache invalidation
revalidateTag("public-feed")
revalidatePath("/")
```

### Keyset Pagination

- Cursor = base64url JSON of `{ providerName, createdAt, id }` (global) or `{ createdAt, id }` (per-provider)
- No OFFSET — uses index seeks
- Encode/decode via `src/feed/keyset.ts`
- Default page size: 30, max: 60 (`normalizePageLimit()`)
- Gallery uses IntersectionObserver sentinel for infinite scroll

### Async Jobs

1. Define job type in `src/queue/jobs.ts` + routing key
2. Enqueue via `services.enqueue(job)` (from `createRuntimeServices()`)
3. Add handler in `src/worker/handlers.ts`
4. Worker dispatches by job type, ACKs on success, NACKs on failure (dead-letter: `linkit.dead`)

Job types:
- `link.enrich` — fetch OpenGraph metadata, update post
- `image.process` — download + Sharp process + upload thumbnail
- `comment.notify` — email post author + prior commenters via Mailgun

### Components

- Server components: default, pass async data as props to client children
- Client components: `"use client"` at top, accept initial data as props for SSR hydration
- Use `useTransition` + `useOptimistic` for async mutations
- Toast via `toast.tsx` (imported from layout)
- Theme via CSS variables (5 themes: Linen, Mocha, Sage, Slate, Noir), persisted in localStorage

## Database Schema (Quick Reference)

```
posts:      id, userId, link, title, body, thumbnailUrl, profileThumbnailUrl,
            providerName, tags[], clickCount, commentsCount, createdAt, updatedAt
comments:   id, postId, userId, parentId, body, replyToUserName, replyCount, createdAt
savedPosts: userId, postId (compound PK)
users:      id, email, name, passwordHash, emailVerified, image, createdAt, updatedAt
```

Comments use adjacency list (parentId FK). Top-level comments cached in Redis (60s TTL).

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/gallery` | GET | Keyset-paginated gallery (optional `provider`, `cursor`, `limit`) |
| `/api/comments` | GET/POST | Top-level comments (Redis cached) + submit comment |
| `/api/comments/[id]/replies` | GET | Replies for comment |
| `/api/saves` | GET | Saved posts list |
| `/api/saves/[postId]` | POST/DELETE | Save/unsave toggle |
| `/api/providers` | GET | Provider summary counts |
| `/api/revalidate` | POST | Cache revalidation (requires `REVALIDATE_SECRET` header) |
| `/api/auth/[...nextauth]` | * | Auth.js handler |
| `/r/[postId]` | GET | Click-count redirect |
| `/healthz` | GET | Health check |

## Auth

- Auth.js v5 (`next-auth@5.0.0-beta.31`)
- **JWT session strategy** (required by credentials provider in v5)
- Credentials: email + bcrypt password comparison
- Facebook OAuth: optional (requires `AUTH_FACEBOOK_ID` + `AUTH_FACEBOOK_SECRET`)
- Session `user.id` propagated via JWT callback → session callback
- Import `auth` from `auth.ts` (root) in server components/actions

## Dev Setup

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run seed:dev        # optional test data
npm run dev             # starts full Docker stack
# App: https://localhost:8443 (Caddy) or http://localhost:3000 (direct)
```

Docker services: `caddy` (HTTPS proxy), `web` (Next.js), `worker` (RabbitMQ consumer), `postgres`, `rabbitmq`, `redis`.

## Testing

- Unit/integration: `npm test` — Vitest, node environment, globals enabled
- E2E: `TEST_DATABASE_URL=... npm run test:e2e` — Playwright, base URL `https://localhost:8443`
- Tests live in `tests/` (Vitest) and `e2e/` (Playwright)

## Feature Extension Checklist

| Feature | Files to touch |
|---------|---------------|
| New post field | `src/db/schema.ts` + migration + `src/domain/linkit.ts` + `src/db/linkit-store.ts` + `src/feed/view-model.ts` |
| New API route | `app/api/*/route.ts` + `src/server/runtime.ts` (wire deps) |
| New server action | `app/*-actions.ts` or `src/server/*.ts` + revalidation |
| New async job | `src/queue/jobs.ts` + `src/worker/handlers.ts` |
| New UI component | `components/new.tsx` (`"use client"` if interactive) |
| New auth provider | `src/auth/config.ts` → `buildAuthConfig()` |

## Architecture Decisions

See `docs/decisions.md` for full reasoning. Key decisions:

- **Adjacency list** for comments (not ltree) — simpler, sufficient for 2-level nesting
- **Keyset pagination** (not OFFSET) — index seeks, stable under inserts
- **JWT sessions** (not DB sessions) — forced by Auth.js v5 + credentials provider
- **Post visibility gated on `thumbnailUrl IS NOT NULL`** — hides unprocessed posts
- **Caddy for dev HTTPS** — matches production, auth cookies work on localhost

## Design System

See `docs/design.md` for full spec. CSS variables:

```css
--c-surface   /* page background */
--c-ink       /* primary text */
--c-muted     /* secondary text */
--c-line      /* borders */
--c-paper     /* card background */
```

5 themes toggled via `theme-switcher.tsx` (localStorage). Gallery tiles: fixed 16:10 aspect ratio, fade-in on load (no layout shift). ExpandedCard uses FLIP animation.
