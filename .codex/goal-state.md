# Linkit Rewrite Goal State

## Objective

Execute the Linkit rewrite plan in `docs/linkit-rewrite-plan.md`.

## Current Status

- Plan exported to markdown.
- Active goal already exists in this thread with the original rewrite objective.
- New UI refinement goal is active: emulate the supplied Briganti infinite-scroll/catalogue references on the landing page, remove `/work` as the gallery route, use Caddy HTTPS as the default dev/browser entrypoint, constrain page width, keep landing sparse, and open clicked gallery items in Pinterest-like profile pages.
- The rewrite has been promoted from `rewrite/` to the project root.
- The project root now contains the Next.js/TypeScript app, domain service tests, in-memory domain implementation, Drizzle schema/migration, RabbitMQ worker/publisher skeleton, Docker Compose stack, Caddy config, and env template.
- The project root now also contains a Drizzle/Postgres-backed `LinkitStore`, feed view-model adapter, and an opt-in Postgres integration test verified against the Compose Postgres service.
- Auth.js v5 is wired with the Drizzle adapter, database sessions, credentials auth, optional Facebook OAuth, and the Next route handler at `/api/auth/[...nextauth]`.
- The public home/feed route now uses a DB-backed cached feed loader with a safe empty-feed fallback when `DATABASE_URL` is not configured during build.
- Link submission is wired through a server action that requires Auth.js session state, writes through the domain service/Postgres store, enqueues RabbitMQ metadata enrichment, and refreshes the public feed cache tag.
- Redirects are wired through `/r/[postId]`, incrementing click count before redirecting to the original URL.
- Comments are included in the feed read model and authenticated comment submission is wired through a server action, Postgres store, RabbitMQ notification enqueueing, and feed cache refresh.
- The RabbitMQ worker now handles `link.enrich` jobs by fetching OpenGraph metadata and updating post title/body/provider/thumbnail.
- The RabbitMQ worker now handles `comment.notify` jobs by building a post/comment recipient notification and sending it through a Mailgun-compatible mailer abstraction.
- The RabbitMQ worker now handles `image.process` jobs by uploading/replacing thumbnail URLs through a Cloudinary-compatible uploader or passthrough fallback.
- Legacy migration verification now has real comparison logic for Rails export JSON against the target Postgres database, with documented export shape and non-zero failure when required inputs are missing.
- Submission feedback is rendered in the UI for auth/validation errors and successful post/comment redirects without making the public feed route dynamic.
- Legacy Rails files and folders were removed during the explicit promotion cleanup.
- `rewrite/` was removed after promotion.

## Execution Defaults

- Use Next.js fullstack with React and TypeScript.
- Use shadcn/ui, Tailwind CSS, and custom CSS for the frontend.
- Use Auth.js for authentication.
- Use Drizzle ORM with Postgres.
- Use RabbitMQ with `amqplib` and a dedicated worker service.
- Use Docker Compose and Caddy for local/deployment stack.
- Use Vitest, React Testing Library, and Playwright for test-first verification.
- Build, test, and deploy from the project root.
- The isolated `rewrite/` staging folder is no longer present.

## Resume Instructions

1. Read `docs/linkit-rewrite-plan.md`.
2. Inspect the current repo before making edits.
3. Work from the project root for app, worker, deployment, migration, and tests.
4. Keep using test-first changes for new behavior.
5. Persist this file again before stopping if usage approaches 90%.

## Completed Slice 1

- Added `rewrite/package.json` and lockfile for the new TypeScript app.
- Added static Next landing/feed shell with Awwwards-inspired editorial styling.
- Added `Linkit` domain service covering link submission, duplicate/blank rejection, comments, comment notification enqueueing, and redirect click counting.
- Added Vitest tests for the domain service; current result: 6 passing tests.
- Added Drizzle schema and generated initial Postgres migration.
- Added RabbitMQ job contracts, publisher skeleton, and worker skeleton.
- Added Docker Compose services for Caddy, web, worker, Postgres, and RabbitMQ.
- Added Caddy routing and `/healthz`.
- Runtime audit is clean after moving to `next-auth@5.0.0-beta.31` and overriding PostCSS to `8.5.15`.

## Completed Slice 2

- Added Drizzle/Postgres-backed `LinkitStore`.
- Added DB mapper tests and opt-in Postgres integration test.
- Added feed view-model adapter from `LinkitPost` to feed card items.
- Changed Compose host ports to avoid local conflicts: Postgres `55432`, RabbitMQ `5673`, RabbitMQ UI `15673`.
- Verified initial migration against the Compose Postgres service.

## Completed Slice 3

- Added Auth.js v5 config with Drizzle adapter.
- Added credentials auth using `users.email` plus `users.passwordHash`.
- Added optional Facebook provider activation when `AUTH_FACEBOOK_ID` and `AUTH_FACEBOOK_SECRET` are present.
- Added Next route handler for `/api/auth/[...nextauth]`.
- Aligned Drizzle account table property names with the Auth.js adapter contract without changing SQL columns.
- Added auth config tests.

## Completed Slice 4

- Added `getPublicFeedItems` cached feed loader using the Postgres `LinkitStore`.
- Kept `/` cache-friendly with `revalidate = 60`.
- Replaced hardcoded sample posts in `app/page.tsx` with the DB-backed feed loader.
- Added an empty-feed state for a clean first boot.
- Added feed loader tests, including the no-`DATABASE_URL` build/startup fallback.

## Completed Slice 5

- Added testable server workflows for authenticated link submission and redirect click tracking.
- Wired the home-page share form to a Next server action.
- Server action now uses Auth.js session state, Postgres `LinkitStore`, RabbitMQ publisher, and `updateTag("public-feed")`.
- Added `/r/[postId]` route that increments click count and redirects to the original URL.
- Added tests for unauthenticated submission, invalid links, enrichment enqueueing, feed revalidation, and redirect click counting.

## Completed Slice 6

- Extended `LinkitStore` with `listCommentsForPosts`.
- Implemented comment listing in both memory and Postgres stores.
- Extended feed view model to embed comments under each feed item.
- Added authenticated comment submission workflow and server action.
- Rendered existing comments and a compact comment form under each feed item.
- Added tests for feed comment mapping, comment notification enqueueing, unauthenticated comments, and blank comment validation.

## Completed Slice 7

- Added post metadata update support to memory and Postgres stores.
- Added OpenGraph metadata provider with title/description/site/image extraction and hostname fallback.
- Added tested worker handler for `link.enrich`.
- Wired the RabbitMQ worker entrypoint to Postgres store and OpenGraph metadata provider.
- Left `image.process` and `comment.notify` as no-op handlers for later dedicated slices.

## Completed Slice 8

- Added comment notification builder with unique recipients from post author and commenters.
- Added Mailgun-compatible mailer abstraction with injectable `fetch`.
- Added tested worker handling for `comment.notify`.
- Wired worker runtime with `APP_URL`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, and `MAIL_FROM`.
- Updated Compose and env template for notification runtime values.

## Completed Slice 9

- Added image uploader abstraction with passthrough and Cloudinary-compatible implementations.
- Added tested `image.process` worker handling.
- Wired worker runtime to choose Cloudinary when `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are configured.
- Updated Compose worker environment for Cloudinary settings.
- All RabbitMQ job types now have concrete handlers: `link.enrich`, `comment.notify`, and `image.process`.

## Completed Slice 10

- Replaced placeholder legacy verification script with real verification logic.
- Added migration verifier checks for row counts, legacy IDs, emails, post links, post counters, and comment relationships.
- Added documented Rails export JSON contract in `rewrite/docs/legacy-migration.md`.
- `npm run legacy:verify` now exits non-zero with a clear message when `LEGACY_EXPORT_JSON` or `DATABASE_URL` is missing.
- No legacy SQLite DB or export file exists in the current repo, so migration verification cannot pass until a Rails export is supplied.

## Completed Slice 11

- Added feedback message view model for error/success query states.
- Added client feedback banner using `useSearchParams` behind `Suspense`.
- Updated post/comment server actions to redirect with success query flags.
- Kept `/` static/cached by avoiding server-side `searchParams` reads.
- Added tests for feedback message mapping.

## Latest Verification

- UI refinement verification:
  - Captured reference screenshots:
    - `test-results/reference-briganti-work-current.png`
    - `test-results/reference-awwwards-infinite-scroll.png`
    - `test-results/reference-pinterest-profile-pin.png`
  - Implemented landing-page infinite catalogue at `/` with `data-testid="infinite-gallery"`, left `catalogue-rail`, faint vertical `selection-word`, constrained width, and scattered visual tiles.
  - Removed `app/work/page.tsx` and `app/work/tile.tsx`; `/work` now falls through to 404 and navigation no longer links to it.
  - Added `/p/[postId]` Pinterest-like profile/detail pages with large left image, right metadata/actions/comments, and related placeholders.
  - Switched Playwright/default browser flow to Caddy HTTPS at `https://localhost:8443`.
  - Changed `npm run dev` to `docker compose up --build`; direct Next debug is now `npm run dev:web`.
  - Added cache revalidation to E2E global setup after DB seeding so Caddy/production cached pages show current test data.
  - Captured current screenshots:
    - `test-results/landing-infinite-desktop.png`
    - `test-results/landing-infinite-mobile.png`
    - `test-results/profile-pin-desktop.png`
    - `test-results/profile-pin-mobile.png`
  - Verification:
    - `npm test` → 58 passed, 1 skipped.
    - `npm run typecheck` → clean.
    - `npm run build` → clean; `/` remains static with 1m revalidation, `/work` is absent from the route list.
    - `npm audit --omit=dev` → 0 vulnerabilities.
    - `docker compose up --build -d` → Caddy/web/worker/Postgres/RabbitMQ rebuilt and running.
    - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e` → 25/25 passed over Caddy HTTPS.
  - Remaining before marking the UI refinement goal complete: user visual review against the supplied references, because "100% copy" is a visual-fidelity target and may require screenshot-by-screenshot adjustment.
- `npm test` — 50 passed, 1 skipped (post-cache-revalidation slice).
- `npm run typecheck` — clean (post-cache-revalidation slice).
- `npm run build` — `/` static, 1m revalidation and `/api/revalidate` dynamic (post-cache-revalidation slice).
- `npm audit --omit=dev` — 0 vulnerabilities.
- `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e` — **9/9 passed** (post-cache-revalidation slice).
- `docker compose up --build -d` — all 5 services up (caddy, web, worker, postgres, rabbitmq) from project root with layout changes.
- `curl http://localhost:8080/healthz` → `ok`. `curl -k https://localhost:8443/healthz` → `ok`.
- `POST https://localhost:8443/api/revalidate` with configured secret → `{"ok":true,"revalidated":["public-feed","/"]}`.
- `APP_URL=https://localhost:8443 REVALIDATE_SECRET=... NODE_TLS_REJECT_UNAUTHORIZED=0 npm run cache:revalidate` → same successful response.
- `npm run env:check` with production-like env vars → valid.
- `docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile` → valid.
- `CLEAN_BEFORE_IMPORT=true LEGACY_EXPORT_JSON=./scripts/legacy/fixtures/rails-export.json DATABASE_URL=... npm run legacy:import` → imported 2/2/2 and exited cleanly.
- `LEGACY_EXPORT_JSON=... DATABASE_URL=... npm run legacy:verify` → **10/10 pass** and exited cleanly.
- `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e` → **17/17 passed** (post-persistent-nav and initial work-gallery slice).
- `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e` → **22/22 passed** (post-auth UX slice).
- `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e` → **23/23 passed** (post-work-thumbnail reveal slice).
- `docker compose up --build -d` → all 5 services up: caddy, web, worker, postgres, rabbitmq.
- `curl http://127.0.0.1:8080/healthz` → `ok`; `curl -k https://localhost:8443/healthz` → `ok`.
- `docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile` → valid.
- `CLEAN_BEFORE_IMPORT=true LEGACY_EXPORT_JSON=./scripts/legacy/fixtures/rails-export.json DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run legacy:import` → imported 2 users, 2 posts, 2 comments.
- `LEGACY_EXPORT_JSON=./scripts/legacy/fixtures/rails-export.json DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run legacy:verify` → 10/10 checks passed.
- `curl -k -X POST ... https://localhost:8443/api/revalidate` and `APP_URL=https://localhost:8443 ... npm run cache:revalidate` → successful cache revalidation.

## Completed Slice 14

- Added `scripts/legacy/fixtures/rails-export.json` — synthetic 2-user/2-post/2-comment Rails export fixture.
- Added `scripts/legacy/import-migration.ts` — reads `LEGACY_EXPORT_JSON`, optionally truncates (`CLEAN_BEFORE_IMPORT=true`), imports users/posts/comments with `legacyId` values, assigns posts to first imported user.
- Added `"legacy:import"` script to `package.json`.
- `CLEAN_BEFORE_IMPORT=true LEGACY_EXPORT_JSON=./scripts/legacy/fixtures/rails-export.json DATABASE_URL=... tsx scripts/legacy/import-migration.ts` → 2 users, 2 posts, 2 comments imported.
- `LEGACY_EXPORT_JSON=... DATABASE_URL=... tsx scripts/legacy/verify-migration.ts` → **10/10 checks pass**.
- `npm test` (39 passed), `npm run typecheck` remain clean.
- **Promotion checklist complete**: E2E 7/7, Compose stack up, migration import+verify 10/10.

## Completed Slice 13

- Part A: All 7 E2E smoke scenarios pass against Compose Postgres (`npm run test:e2e` exits 0).
  - Fixed Auth.js `UnsupportedStrategy`: changed `session.strategy` from `"database"` to `"jwt"`, updated callbacks to `jwt`/`session` token pattern, extended `JWT` type with `id`.
  - Fixed `RABBITMQ_URL is required` crash: made RABBITMQ_URL optional in `src/server/runtime.ts` with no-op publisher fallback.
  - Updated `tests/auth/config.test.ts` to assert `strategy: "jwt"`.
- Part B: Full Compose stack (`docker compose up --build -d`) boots all 5 services.
  - Fixed Docker build: created `rewrite/public/.gitkeep` (Dockerfile `COPY public` step required the dir to exist).
  - Fixed worker startup race: added RabbitMQ `healthcheck` and `depends_on: condition: service_healthy` for worker. Added `restart: on-failure`.
  - `curl http://localhost:8080/healthz` → `ok`. `curl http://localhost:8080/` → Linkit HTML.
- `npm run typecheck` and `npm test` (39 passed) remain green.

## Completed Slice 12

- Added `data-testid` attributes to feed section, submit link input/button, comment textarea/button, and feedback banner.
- Added `playwright.config.ts` with Chromium project, `webServer` (Next.js dev), and `globalSetup`.
- Added `tests/e2e/global-setup.ts` — runs Drizzle migrations and seeds test user + post before suite starts.
- Added `tests/e2e/auth.helpers.ts` — `loginAs` helper via Auth.js built-in sign-in page.
- Added `tests/e2e/smoke.spec.ts` — 6 scenarios: public feed, healthz, unauthenticated submit rejected, blank link rejected, authenticated submit, authenticated comment, redirect tracking.
- `npm run typecheck` and `npm test` (39 passed) remain green.

## Completed Slice 15

- Promoted the verified `rewrite/` app into the project root.
- Removed legacy Rails files/folders and the staging `rewrite/` folder.
- Added `.dockerignore` so Docker builds exclude `node_modules`, `.next`, Playwright output, and other generated artifacts.
- Replaced the legacy Rails/Heroku README with current Next/Postgres/RabbitMQ/Caddy setup and verification instructions.
- Renamed the package metadata from `linkit-rewrite` to `linkit`.
- Fixed Playwright readiness to wait on `/healthz` instead of `/`, avoiding DB queries before E2E migration setup.
- Fixed E2E setup cleanup so repeat runs remove comments/posts for the seeded test user before recreating it.
- Fixed legacy import/verify scripts to close their Postgres clients and exit cleanly.
- Verified from the project root:
  - `npm test` → 39 passed, 1 skipped.
  - `npm run typecheck` → clean.
  - `npm run build` → clean; `/` remains static with 1m revalidation.
  - `npm audit --omit=dev` → 0 vulnerabilities.
  - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e` → 7/7 passed.
  - `docker compose up --build -d` → caddy, web, worker, postgres, rabbitmq all up.
  - `curl http://127.0.0.1:8080/healthz` → `ok`.
  - `npm run legacy:import` with the Rails fixture → imported 2 users, 2 posts, 2 comments.
  - `npm run legacy:verify` with the Rails fixture → 10/10 checks passed.

## Completed Slice 16

- Surveyed the requested Awwwards/Andrés Briganti inspiration and captured the design direction in `docs/design-direction.md`.
- Interpreted the reference as sparse editorial info-page structure, strong display typography, fine-rule grid, index-like rows, restrained accent color, and non-blocking fade/transition behavior.
- Added Playwright layout acceptance in `tests/e2e/layout.spec.ts`:
  - Desktop verifies hero, info panel, feed, uppercase nav, minimum hero height, and no horizontal overflow.
  - Mobile verifies stacked readability, no horizontal overflow, and no heading/info-panel collision.
- Updated `app/page.tsx` with:
  - `data-testid="hero"` hero section.
  - Editorial info panel with Version, Signal, Queue, and Visits.
  - Feed index header and index-like feed rows.
  - Layout counters derived from the current feed items.
- Updated `app/globals.css` with deterministic first paint, subtle section-rise motion, reduced-motion support, hover treatment, mobile submit-panel fallback, and selection colors.
- Captured screenshot artifacts for visual review:
  - `test-results/layout-desktop.png`
  - `test-results/layout-mobile.png`
- Verified:
  - `npm test` → 39 passed, 1 skipped.
  - `npm run typecheck` → clean.
  - `npm run build` → clean; `/` remains static with 1m revalidation.
  - `npm audit --omit=dev` → 0 vulnerabilities.
  - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e` → 9/9 passed.
  - `docker compose up --build -d` → caddy, web, worker, postgres, rabbitmq all up with the layout changes.
  - `curl http://127.0.0.1:8080/healthz` → `ok`.

## Completed Slice 17

- Added production environment validation in `src/env.ts`.
  - Blank optional provider values normalize to `undefined`.
  - Production validation rejects placeholder or too-short `AUTH_SECRET`.
  - Production validation rejects partial Facebook, Cloudinary, and Mailgun settings.
- Added `tests/env.test.ts` for the environment contract.
- Added `scripts/check-env.ts` and `npm run env:check` for deployment preflight.
- Added `.env.production.example` with production-oriented settings and placeholders.
- Updated `README.md` with production preflight and local HTTPS smoke-check instructions.
- Updated `Caddyfile`:
  - Extracted a shared `linkit_proxy` snippet.
  - Kept HTTP on `http://localhost:8080`.
  - Added local HTTPS on `https://localhost:8443` using Caddy internal TLS.
  - Kept `CADDY_SITE_ADDRESS` configurable for deployment.
- Verified:
  - `npm test` → 45 passed, 1 skipped.
  - `npm run typecheck` → clean.
  - `npm run build` → clean; `/` remains static with 1m revalidation.
  - `npm audit --omit=dev` → 0 vulnerabilities.
  - `npm run env:check` with production-like env vars → valid.
  - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e` → 9/9 passed.
  - `docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile` → valid.
  - `curl http://127.0.0.1:8080/healthz` → `ok`.
  - `curl -k https://localhost:8443/healthz` → `ok`.

## Completed Slice 18

- Added a protected cache revalidation path for post-migration/import sequencing.
- Added `src/server/revalidate.ts` with tested authorization behavior.
- Added `app/api/revalidate/route.ts`:
  - Requires `x-linkit-revalidate-secret`.
  - Uses `revalidateTag("public-feed", "max")` and `revalidatePath("/")`.
  - Returns the revalidated surfaces for deployment logs.
- Added `scripts/revalidate-cache.ts` and `npm run cache:revalidate` so deployment/migration scripts can refresh the public feed cache after import.
- Added `REVALIDATE_SECRET` to `.env.example`, `.env.production.example`, and `docker-compose.yml`.
- Extended production env validation to require `REVALIDATE_SECRET` with at least 32 characters.
- Updated README with cache revalidation instructions.
- Verified:
  - `npm test` → 50 passed, 1 skipped.
  - `npm run typecheck` → clean.
  - `npm run build` → clean; `/` remains static with 1m revalidation and `/api/revalidate` is dynamic.
  - `npm audit --omit=dev` → 0 vulnerabilities.
  - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e` → 9/9 passed.
  - `curl -k https://localhost:8443/healthz` → `ok`.
  - `curl -k -X POST -H 'x-linkit-revalidate-secret: ...' https://localhost:8443/api/revalidate` → success.
  - `APP_URL=https://localhost:8443 REVALIDATE_SECRET=... NODE_TLS_REJECT_UNAUTHORIZED=0 npm run cache:revalidate` → success.

## Completed Slice 27 — Adjacency List + Redis + Lazy-load Comments

Replaced ltree comment system with adjacency list + Redis + lazy-load UX.

### What changed

- **Schema**: dropped `path ltree` and `reply_to_user_id`; added `parent_id uuid`, `reply_to_user_name text`, `reply_count int NOT NULL DEFAULT 0` to `comments` table. Migration: `drizzle/0002_adjacency_list.sql` (applied via psql direct + registered in drizzle tracking).
- **Indexes**: dropped GiST indexes; added `(post_id, parent_id)` btree + `parent_id` btree.
- **`src/db/schema.ts`**: removed `customType` ltree; new adjacency list columns.
- **`src/domain/linkit.ts`**: `LinkitComment` now has `parentId`, `replyToUserName`, `replyCount` (no `path`/`replyToUserId`). `CreateStoredCommentInput` uses `parentId`/`replyToUserName`. `LinkitStore` adds `listTopLevelComments`/`listRepliesForComment`, removes `listCommentsForPost`.
- **`src/db/linkit-store.ts`**: rewrote `createComment` (btree only, increments parent `reply_count`), `listTopLevelComments`, `listRepliesForComment`. Removed ltree/alias imports.
- **`src/server/redis.ts`**: ioredis client (singleton via `globalThis`), `getCachedTopLevelComments`, `setCachedTopLevelComments`, `invalidateTopLevelComments`. Graceful degradation when `REDIS_URL` unset.
- **`app/api/comments/route.ts`**: `GET ?postId=` — Redis-cached top-level comments.
- **`app/api/comments/[commentId]/replies/route.ts`**: `GET` — direct children of a comment.
- **`app/actions.ts`**: `submitComment` calls `invalidateTopLevelComments(postId)` after success.
- **`src/server/posts.ts`**: passes `parentId`/`replyToUserName` from formData instead of `parentCommentPath`/`replyToUserId`.
- **`src/feed/view-model.ts`**: removed `FlatComment`/`CommentThread`/`toFlatComments`/`flattenToTwoLevels`; added `CommentCard` type + `toCommentCard()`.
- **`app/p/[postId]/page.tsx`**: Server Component for post data; embeds `<CommentSection>` client component.
- **`components/comment-section.tsx`**: Client Component — fetches top-level via `/api/comments`, expand replies via `/api/comments/{id}/replies`, inline reply forms with `parentId`/`replyToUserName` hidden fields.
- **`docker-compose.yml`**: added Redis 7-alpine service + `REDIS_URL` env for web service.
- **`ioredis@5.10.1`** added to dependencies.

### Verified

- `npx tsc --noEmit` → clean
- `npx vitest run` → 88 passed, 0 failed, 1 skipped
- `DATABASE_URL=... npm run db:migrate` + `psql -f 0002_adjacency_list.sql` → applied
- DB schema: `parent_id uuid`, `reply_to_user_name text`, `reply_count int`, btree indexes, no ltree

## Completed Slice 28 — Detroit Editorial UI Revamp

Full visual redesign to warm linen / Detroit editorial aesthetic.

### What changed

- **Fonts**: Outfit 200/300 + Cormorant Garamond via Google Fonts `@import`. Registered as CSS variables `--font-sans` / `--font-display`.
- **Color tokens** (Tailwind + CSS variables): `ink: #1A1714`, `paper: #F5F0E8`, `surface: #EAE4D8`, `line: #D8D1C4`, `muted: #7A7470`. CSS `--c-border: rgba(26,23,20,0.09)`, `--c-border-mid: rgba(26,23,20,0.17)`.
- **Gallery**: CSS-columns masonry (3 desktop / 2 mobile), 0.5px borders, ultra-thin typography, no old flex/grid tile frame.
- **Profile page**: `.profile-pin` 3-column grid without outer border/background. `.profile-image` gets sticky 100vh with `object-fit: cover`. `.profile-detail` background `var(--c-bg)` with left border separator.
- **Back button**: changed from `history.back()` client button to `<Link href="/">← Back</Link>` — no "use client".
- **GalleryThumb**: picsum.photos fallback when `thumbnailUrl` is null.
- **Comment textarea**: `border-radius: 4px` (not pill).

## Completed Slice 29 — Sticky Profile Image + Profile Thumbnail Crop

### What changed

- **`.profile-image`**: `position: sticky; top: 0; height: 100vh; overflow: hidden`. Image fills container with `object-fit: cover; object-position: center 0%`.
- **Scroll-driven pan**: CSS `animation-timeline: scroll(root)` drives `object-position` from `center 0%` → `center 100%` as user scrolls through comments. Mobile: `animation: none`, `object-position: center center`.
- **`profileThumbnailUrl` column**: `profile_thumbnail_url text` added to `posts` table. Migration `drizzle/0003_profile_thumbnail.sql` applied.
- **Worker `image.process`**: now runs two `Promise.allSettled` uploads — standard `{ maxWidth: 736, quality: 72 }` + profile `{ maxWidth: 900, maxHeight: 1200, quality: 80 }`. Results stored in `thumbnailUrl` / `profileThumbnailUrl`.
- **Sharp uploader**: `fit: "cover", position: "top"` when `maxHeight` provided.
- **Cloudinary uploader**: `c_fill,w_X,h_Y,g_auto` when `maxHeight` provided; `c_scale` otherwise.
- **Profile page**: uses `post.profileThumbnailUrl ?? post.thumbnailUrl`.
- **TypeScript**: `LinkitPost`, `UpdatePostMetadataInput`, `FeedItem` all carry `profileThumbnailUrl: string | null`.

## Completed Slice 30 — Toast Notification System

Replaced all inline element-adjacent feedback `<p>` messages with a centered auto-dismissing toast.

### What changed

- **`components/toast.tsx`** (new): `window` CustomEvent bus. `showToast(text, tone)` dispatches `show-toast`. `<Toast />` listens via `useLayoutEffect` (runs before `useEffect`, prevents race with `FeedbackBanner`), renders fixed-center overlay, auto-dismisses after 3s with slide-up animation.
- **`app/layout.tsx`**: `<Toast />` mounted once at root.
- **`app/globals.css`**: `.toast` fixed center, `var(--c-ink)` background, uppercase tracking, `toast-in` keyframe animation.
- **`components/feedback-banner.tsx`**: now just a `useEffect` watching `searchParams`, calls `showToast`, renders `null`.
- **`app/register/form.tsx`**: removed inline `<p>` error, `useEffect` → `showToast` on `state.error`.
- **`app/signin/form.tsx`**: same for "account created" success + sign-in errors.
- **`app/settings/page.tsx`**: removed `StatusLine` component; both username + password forms use `useEffect` → `showToast`.

**Race condition fix**: Toast uses `useLayoutEffect` for listener registration. React runs `useLayoutEffect` before any `useEffect`, ensuring Toast's listener is registered before `FeedbackBanner`'s `useEffect` dispatches the event.

## Completed Slice 31 — Pinterest Seed + Settings Page

- **`app/settings/page.tsx`** + **`app/settings-actions.ts`**: `/settings` route with username (3–30 chars, alphanumeric+underscore, unique) and password change (verify current + bcrypt new) forms.
- **`scripts/seed-pins.ts`**: seeds 20 Pinterest pins via service layer (store + enqueue). Run inside worker container with `SEED_USER_ID` + `SEED_USER_EMAIL` env vars.
- **`next.config.mjs`**: `serverExternalPackages: ["ioredis"]` — prevents Next.js bundler from trying to bundle ioredis (native Node module).
- **`docker-compose.yml`**: Redis 7-alpine service added with healthcheck; `REDIS_URL` env for web service.
- Seeded 20 Pinterest pins (brutalist design, wabi-sabi ceramics, Swiss grid, scandinavian interior, film photography, industrial loft, fashion editorial). 15/20 enriched immediately; 5 hit Pinterest rate limits. `image.process` jobs queued for thumbnail generation.

## Current Status

- App running on `https://localhost:8443` via Docker Compose + Caddy.
- Dev mode: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d`.
- 22 posts in DB (20 Pinterest seeds + 2 manual).
- Toast system active across all feedback surfaces.
- Profile images sticky with scroll-driven pan; `profileThumbnailUrl` generates on new uploads.
- `npx tsc --noEmit` → clean.

## Next Steps

- E2E tests for lazy-load comment expand flow (Playwright).
- Re-enrich existing posts to generate `profileThumbnailUrl` (backfill script).
- Add `REDIS_URL` to `.env.production.example` + production env validation.
- Production deployment hardening.

## Completed Slice 19

- Added `components/site-nav.tsx`.
- Rendered `SiteNav` from `app/layout.tsx` so navigation persists across all App Router pages.
- Removed the page-local home nav from `app/page.tsx`.
- Added first-class `/signin`, `/register`, and `/work` routes so visible auth/gallery navigation no longer points at default Auth.js UI.
- Added `tests/e2e/navigation.spec.ts`.
- Verified:
  - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e -- tests/e2e/navigation.spec.ts` → 6/6 passed.

## Completed Slice 20

- Added `src/server/register.ts` with injectable `RegisterPort` interface and `registerUser` business logic (normalize email, reject blank/malformed input, enforce 8+ character passwords, bcrypt hash, duplicate-email check).
- Added `createRegisterPort(db: LinkitDb)` adapter wiring the port to Drizzle.
- Added `app/auth-actions.ts` for auth-specific server actions, keeping `components/site-nav.tsx` static and preventing Auth.js session reads from making `/` and `/work` dynamic.
  - `signInAction`: calls `signIn("credentials", { redirectTo: "/" })`, catches `AuthError`, returns `{ error }` for invalid credentials.
  - `registerAction`: runs `registerUser`, redirects to `/signin?registered=1` on success.
- Replaced static `/signin` page shell with Server Component + `SignInForm` client component using `useActionState`.
  - Shows `?registered=1` success banner from parent `searchParams` prop.
  - Shows `data-testid="auth-error"` feedback on invalid credentials.
- Replaced static `/register` page shell with Server Component + `RegisterForm` client component using `useActionState`.
  - Added missing password field.
  - Shows `data-testid="auth-error"` feedback on duplicate email or blank input.
- Updated `tests/e2e/auth.helpers.ts` `loginAs` to use `/signin` instead of `/api/auth/signin`.
- Added `tests/e2e/auth.spec.ts` covering sign-in form visibility, invalid-credentials feedback, register form visibility, invalid-registration feedback, and the full register→sign-in→submit-link flow.
- Added `tests/server/register.test.ts` — 8 unit tests for blank input, invalid email, short password, duplicate email, email normalization, successful creation, and bcrypt hash verification.
- Restored `components/site-nav.tsx` to a static persistent navigation shell with `Work`, `Sign in`, `Register`, and `Share`; sign-out UX remains a future account/menu concern.
- Verified:
  - `npm test` → 58 passed, 1 skipped (59 total).
  - `npm run typecheck` → clean.
  - `npm run build` → clean; `/` and `/work` remain static with 1m revalidation, `/signin` is dynamic because it reads `searchParams`.
  - `npm audit --omit=dev` → 0 vulnerabilities.
  - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e` → **22/22 passed**.
  - Captured visual review artifacts: `test-results/auth-signin-desktop.png`, `test-results/auth-signin-mobile.png`, `test-results/auth-register-desktop.png`, and `test-results/auth-register-mobile.png`.

## Completed Slice 21

- Added `app/work/page.tsx` using `getPublicFeedItems`.
- Rendered links as numbered catalogue tiles with real `thumbnailUrl` image surfaces when available and deterministic typographic visual fallbacks when not.
- Added `app/work/tile.tsx` as a small client component for image-loaded reveal behavior.
  - Checks `img.complete` after hydration so cached/preloaded images do not get stuck in the pre-reveal state.
  - Uses `work-thumb-loaded` to fade loaded images into the tile.
- Added a sticky desktop catalogue rail, mobile rail fallback, large faint vertical `Selection` word, provider/topic rail, compact count metadata, 5-column desktop grid, 2-column mobile grid, stable tile aspect ratios, staggered entry animation, hover/focus image motion, and reduced-motion coverage through the global motion rules.
- E2E seed data now includes a deterministic SVG thumbnail so gallery tests exercise the real image path.
- Added `tests/e2e/work-gallery.spec.ts`.
- Verified:
  - `npm test -- tests/feed/view-model.test.ts` → 2/2 passed.
  - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e -- tests/e2e/work-gallery.spec.ts` → 3/3 passed.
  - `npm test` → 58 passed, 1 skipped.
  - `npm run typecheck` → clean.
  - `npm run build` → clean; `/` and `/work` remain static with 1m revalidation.
  - `npm audit --omit=dev` → 0 vulnerabilities.
  - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e` → 23/23 passed.
  - Refreshed visual review artifacts: `test-results/work-desktop.png` and `test-results/work-mobile.png`.

## Completed Slice 22

- Rebuilt and restarted the full Docker Compose stack from the project root.
- Verified Compose services:
  - `linkit-caddy-1` up.
  - `linkit-web-1` up.
  - `linkit-worker-1` up.
  - `linkit-postgres-1` up on host port `55432`.
  - `linkit-rabbitmq-1` up and healthy on host ports `5673` and `15673`.
- Verified Caddy:
  - `docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile` → valid configuration.
  - `curl http://127.0.0.1:8080/healthz` → `ok`.
  - `curl -k https://localhost:8443/healthz` → `ok`.
  - `curl http://127.0.0.1:8080/` returned the Linkit HTML shell.
  - `curl -k https://localhost:8443/work` returned the `/work` catalogue HTML.
- Verified deployment/migration support:
  - `npm run env:check` with production-like values → valid.
  - `npm run legacy:import` with the fixture and `CLEAN_BEFORE_IMPORT=true` → imported 2 users, 2 posts, 2 comments.
  - `npm run legacy:verify` with the fixture → 10/10 checks passed.
  - Direct HTTPS `POST /api/revalidate` with `x-linkit-revalidate-secret` → `{"ok":true,"revalidated":["public-feed","/"]}`.
  - `APP_URL=https://localhost:8443 REVALIDATE_SECRET=... NODE_TLS_REJECT_UNAUTHORIZED=0 npm run cache:revalidate` → same successful response.
- Re-ran full verification after the migration import:
  - `npm test` → 58 passed, 1 skipped.
  - `npm run typecheck` → clean.
  - `npm run build` → clean; `/` and `/work` remain static with 1m revalidation.
  - `npm audit --omit=dev` → 0 vulnerabilities.
  - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e` → 23/23 passed.
- Removed unused `app/work/grid.tsx` and re-ran `npm run typecheck` plus `npm run build`, both clean.

## Completion Audit

- Deployment stack from ngrok to Caddy/Docker Compose: complete. `ngrok` is absent from the current file list; `docker-compose.yml`, `Dockerfile`, and `Caddyfile` define and verify the new stack.
- Rails/ROR removal and TypeScript rewrite: complete. Current file list contains `package.json`, Next.js app files, TypeScript source/tests, and no Rails `Gemfile`, `config.ru`, `app/controllers`, or `spec` tree.
- React/TypeScript framework choice: complete. The implementation uses Next.js, React, and TypeScript, matching the documented allowance for Next.js with selective RSC/cached rendering.
- Async messaging: complete. RabbitMQ is used via `amqplib`, with `link.enrich`, `image.process`, and `comment.notify` handlers covered by worker tests and a running worker container.
- Postgres DB: complete. Drizzle schema/migrations, Postgres-backed store, Compose Postgres, integration tests, E2E tests, and legacy import/verify all run against Postgres.
- Test-first verification stack: complete. RSpec was replaced by Vitest/Playwright in the TypeScript stack; current verification is 58 unit/integration tests plus 23 Playwright scenarios.
- Persistent resume state: complete. This file and `docs/auth-gallery-navigation-plan.md` have been maintained after each slice.
- Web tech stack/layout discussion: complete. `docs/linkit-rewrite-plan.md`, `docs/design-direction.md`, and `docs/auth-gallery-navigation-plan.md` capture the chosen CSS/JS/HTML/server stack and visual direction.
- Awwwards/Briganti style alignment: complete for current supplied references. Home layout, auth pages, persistent nav, and `/work` catalogue have Playwright layout/gallery coverage and screenshot artifacts. User-supplied screenshots can still become a future design-adjustment input, but none are currently pending in the workspace.

## Completed Slice 23

- Restored visit-count behavior for shared links:
  - `/r/[postId]` still increments `click_count`.
  - Redirects now revalidate `public-feed`, `/`, and `/p/[postId]` so profile/gallery visit counts refresh after a visit.
  - Landing gallery tiles display provider plus visit count again.
  - Profile visit count has `data-testid="profile-visits"` and E2E coverage.
- Added background image processing flow:
  - `link.enrich` enqueues `image.process` when OpenGraph metadata includes a thumbnail.
  - Direct metadata submission also enqueues `image.process`.
  - Worker binds `image.*` jobs and republishes through the existing RabbitMQ exchange.
  - Image uploader accepts resize/compression bounds; Cloudinary receives `c_limit,w_960,h_1280,q_72,f_auto` by default, with worker override support.
- Improved input feedback behavior:
  - Submit success/error feedback hides as soon as an input/select/textarea receives focus.
  - Sign-in/register action feedback also clears on field focus.
  - Registration now redirects to `/signin?registered=1`, keeping registration and sign-in as distinct auth steps.
- Updated nav sign-out label to `SIGN OUT`.
- Kept the gallery shell within the existing 1120px layout constraint.
- Verified:
  - `npm test -- tests/worker/handlers.test.ts tests/images/uploader.test.ts tests/server/posts.test.ts tests/domain/linkit-service.test.ts` → 26/26 passed.
  - `npm run typecheck` → clean.
  - `npm test` → 66 passed, 1 skipped.
  - `docker compose up --build -d` → web/Caddy/Postgres/RabbitMQ/worker stack running.
  - `docker compose build --no-cache worker && docker compose up -d worker` → worker image rebuilt/restarted with the image-processing enqueue changes.
  - `npm audit --omit=dev` → 0 vulnerabilities.
  - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e` through Caddy HTTPS → 31/31 passed.

## Slice 23 Follow-up

- Re-audited the active visit/image/input/nav objective after the goal state was reactivated.
- Restored visit-count text inside the extracted `GalleryTile` component so gallery cards again render provider plus visit count.
- Aligned smoke E2E with the current product behavior:
  - Freshly submitted links are accepted and acknowledged immediately, while visual gallery inclusion remains gated on thumbnail availability.
  - Comment submission now stays on the profile page and appends `?commented=1`.
- Made `sharp` an explicit dependency for the local Sharp-based image processor instead of relying on a transitive optional dependency.
- Verified:
  - `npm run typecheck` → clean.
  - `npm test -- tests/feed/view-model.test.ts tests/worker/handlers.test.ts tests/images/uploader.test.ts tests/server/posts.test.ts tests/domain/linkit-service.test.ts` → 35/35 passed.
  - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e -- tests/e2e/auth.spec.ts tests/e2e/smoke.spec.ts` through Caddy HTTPS/dev Compose → 18/18 passed.
  - `npm audit --omit=dev` → 0 vulnerabilities.

## Completed Slice 24

- Added keyset pagination for the gallery:
  - `LinkitStore.listPostsPage` now supports `limit`, `cursor`, and thumbnail-only filtering.
  - Postgres pagination uses `(created_at, id)` ordering with a stable descending keyset cursor.
  - Memory store pagination matches the same ordering and thumbnail filtering for domain tests.
- Added cursor encode/decode helpers with invalid-cursor rejection.
- Added `/api/gallery` as a dynamic JSON endpoint for infinite-scroll page fetches.
- Replaced the landing catalogue with a client `GalleryFeed` that starts from the cached first page, loads additional pages through `IntersectionObserver`, dedupes incoming items, and keeps the manual `More`/`Retry` control.
- Seeded E2E gallery fixtures with enough thumbnail-ready posts to exercise multiple keyset pages.
- Fixed the DB client lifecycle exposed by full E2E:
  - App-side `createDb()` now reuses one Postgres client per database URL through a `globalThis` cache, which survives Next dev hot reloads and prevents repeated request handlers from opening unbounded pools.
  - Default app pool size is capped by `POSTGRES_MAX_CONNECTIONS` or `5`.
  - Legacy migration scripts continue using explicit `createPostgresClient()` clients that they close themselves.
- Fixed profile-page flakiness exposed during verification:
  - `/p/[postId]` now loads the requested post directly by id instead of depending on the cached public feed list.
  - Added profile loader tests for direct hit and missing-post behavior.
- Verified:
  - `npm test -- tests/db/client.test.ts tests/feed/keyset.test.ts tests/feed/load-feed.test.ts tests/domain/linkit-service.test.ts tests/db/linkit-store.test.ts` → 17/17 passed.
  - `npm run typecheck` → clean.
  - `npm test` → 81 passed, 1 skipped.
  - `npm run build` → clean; `/api/gallery` and `/p/[postId]` are dynamic.
  - `npm audit --omit=dev` → 0 vulnerabilities.
  - `docker compose -f docker-compose.yml -f docker-compose.dev.yml restart web` → web restarted cleanly.
  - `curl -k https://localhost:8443/healthz` → `ok`.
  - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e` through Caddy HTTPS/dev Compose → 35/35 passed with no retries.

## Completed Slice 25

- Changed gallery thumbnail rendering to preserve original image proportions:
  - `.gallery-thumb-img` now uses `object-fit: contain` instead of `cover`, so images are fitted inside the tile frame instead of visually cropped.
  - `.gallery-thumb` now has a subtle border so contained images retain a framed presentation.
- Confirmed the Sharp processor already shrinks with aspect ratio preserved:
  - `createSharpImageUploader` uses `resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })`.
  - The uploader test now asserts both `fit: "inside"` and `withoutEnlargement: true`.
- Added a current-data backfill command:
  - `npm run images:process-existing`
  - Script: `scripts/process-existing-thumbnails.ts`
  - It selects remote, non-data, non-local `thumbnail_url` rows; downloads them; writes local WebP files under `public/uploads`; and updates Postgres to `/uploads/...`.
- Processed current Compose Postgres image data:
  - Found 4 remote thumbnails.
  - Processed 4, failed 0.
  - Updated rows now point to `/uploads/6810fb9ef109f2a8.webp`, `/uploads/94a315a4868561c8.webp`, `/uploads/b76fb49ae7638554.webp`, and `/uploads/fe15070f15c9acd5.webp`.
  - Verified output dimensions:
    - `6810fb9ef109f2a8.webp` → `960x480`
    - `94a315a4868561c8.webp` → `736x981`
    - `b76fb49ae7638554.webp` → `736x977`
    - `fe15070f15c9acd5.webp` → `564x564`
- Added browser coverage for the non-cropping UI:
  - `tests/e2e/work-gallery.spec.ts` now asserts rendered thumbnail images use `object-fit: contain`.
- Verified:
  - `npm test -- tests/images/uploader.test.ts` → 7/7 passed.
  - `npm run typecheck` → clean.
  - `npm test` → 81 passed, 1 skipped.
  - `npm run build` → clean.
  - `docker compose -f docker-compose.yml -f docker-compose.dev.yml restart web` → web restarted cleanly.
  - `curl -k https://localhost:8443/healthz` → `ok`.
  - `POST https://localhost:8443/api/revalidate` with dev secret → `{"ok":true,"revalidated":["public-feed","/"]}`.
  - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e -- tests/e2e/work-gallery.spec.ts` → 6/6 passed.
  - `curl -k -I https://localhost:8443/uploads/6810fb9ef109f2a8.webp` → `200`, `content-type: image/webp`.
  - `npm audit --omit=dev` → 0 vulnerabilities.

## Completed Slice 26

- Reworked gallery thumbnails from fixed frame fitting to dynamic-height image cards:
  - Removed the fixed gallery thumbnail `aspect-ratio` rules.
  - Removed thumbnail border/background framing.
  - Replaced `next/image` fill rendering with a normal `<img>` so intrinsic image height can define the card height.
  - Added a hydration-safe `complete`/`naturalWidth` check so already-loaded images still fade in.
- Changed Sharp processing to fixed-width proportional resizing:
  - Local Sharp processing now calls `resize({ width: 736, withoutEnlargement: false })`.
  - Height is no longer bounded or cropped; it is derived from original image proportions.
  - Cloudinary transformation was aligned to width scaling with `c_scale,w_...,q_...,f_auto`.
  - Worker default image width is now `736`.
- Improved `npm run images:process-existing`:
  - Processes remote URLs, data image URIs, and existing `/uploads/...` files.
  - Skips local uploads that are already at the target width, making reruns idempotent.
- Reprocessed current Compose Postgres image data after E2E reseeding:
  - Final DB state: 20 local `/uploads/...` thumbnails, 0 data images, 0 remote images.
  - Verified representative output dimensions:
    - `709372d6447af752.webp` → `736x368`
    - `63468ac24b419977.webp` → `736x981`
    - `08ae1fd6338c21ff.webp` → `736x977`
    - `3373f8de8fa2e723.webp` → `736x736`
    - `30a6b4b5f55b8d30.webp` → `736x920`
- Updated browser coverage:
  - `tests/e2e/work-gallery.spec.ts` now asserts thumbnail cards have `aspect-ratio: auto`, no border, no background, and image/card rendered dimensions match.
- Verified:
  - `npm test -- tests/images/uploader.test.ts tests/worker/handlers.test.ts` → 16/16 passed.
  - `npm run typecheck` → clean.
  - `npm test` → 82 passed, 1 skipped.
  - `npm run build` → clean.
  - `npm audit --omit=dev` → 0 vulnerabilities.
  - `TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e -- tests/e2e/work-gallery.spec.ts` → 6/6 passed.
  - Live Caddy browser check after final reprocess/revalidate:
    - first gallery image source `/uploads/30a6b4b5f55b8d30.webp`
    - thumbnail `aspectRatio: auto`
    - border `0px`
    - background `rgba(0, 0, 0, 0)`
    - thumbnail box `291x364`
    - image box `291x364`

## Completed Slice 27

- Added 20 Designspiration save pins to current Postgres data.
- Added `scripts/seed-designspiration-pins.ts` and `npm run seed:designspiration`.
  - The script upserts a dedicated seed user.
  - It upserts 20 `https://www.designspiration.com/save/.../` links.
  - It uses indexed Designspiration save-page metadata and palette colors because direct page fetches return a Cloudflare challenge.
  - It generates SVG palette thumbnails for each pin so the existing image pipeline can process them like normal thumbnails.
- Ran `DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run seed:designspiration`.
  - Result: `Seeded 20 Designspiration pins.`
- Ran `DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run images:process-existing`.
  - Result: `20 processed, 0 failed` for the Designspiration SVG/data thumbnails.
- Verified current DB state:
  - `20` Designspiration save pins.
  - `20` local `/uploads/...` thumbnails.
  - example URL present: `https://www.designspiration.com/save/1054182069/`.
- Revalidated gallery cache:
  - `POST https://localhost:8443/api/revalidate` with dev secret → `{"ok":true,"revalidated":["public-feed","/"]}`.
- Verified live gallery:
  - Browser check against `https://localhost:8443/` found visible Designspiration cards.
  - First visible sample: `Stripes menu book notebook reference`.
- Verified:
  - `npm run typecheck` → clean.
  - `npm test -- tests/feed/load-feed.test.ts tests/images/uploader.test.ts` → 13/13 passed.
  - `npm run build` → clean.
  - `npm audit --omit=dev` → 0 vulnerabilities.
