# Linkit Rewrite Plan

## Summary

Rewrite the legacy Rails app into a Next.js fullstack TypeScript app with Postgres, RabbitMQ workers, Caddy, and Docker Compose. Build the rewrite in an isolated `rewrite/` folder first, then promote it to the project root only after the new app is verified.

Keep the existing core behavior: public link feed, authenticated link submission, comments, click-count redirects, link metadata/thumbnail processing, email notifications, and migration of existing Rails data.

Use the Awwwards Andres Briganti "Info page" inspiration as visual direction: editorial layout, strong typography, sparse navigation, smooth transitions/fades, and polished image-forward feed presentation. User-supplied screenshots become the final layout source of truth.

## Key Changes

- Replace Rails/RSpec/Slim/jQuery with `Next.js + React + TypeScript`.
- Keep the existing Rails root as read-only reference while the new app is built under `rewrite/`.
- Use `shadcn/ui + Tailwind CSS` with custom styling.
- Use `Auth.js` for credentials/OAuth auth.
- Use `Postgres` as the application database.
- Use `Drizzle ORM` for schema, migrations, typed queries, and Auth.js integration.
- Use `RabbitMQ` with `amqplib` and a dedicated worker container.
- Replace ngrok/Heroku deployment with Docker Compose and Caddy.

## Implementation

- Create the new Next app structure under `rewrite/` while preserving the Rails root as migration/reference material.
- Treat `rewrite/` as the only active implementation workspace until promotion:
  - `rewrite/app` and related Next files for the web app.
  - `rewrite/src` for shared server/domain/worker code.
  - `rewrite/tests` for Vitest and Playwright tests.
  - `rewrite/docker-compose.yml`, `rewrite/Caddyfile`, and service Dockerfiles for the new stack.
- Do not delete or move legacy Rails files during the rewrite phase.
- Add Docker Compose services:
  - `caddy`
  - `web`
  - `worker`
  - `postgres`
  - `rabbitmq`
- Configure Caddy for HTTPS termination, reverse proxying, and health-check routing.
- Model data for users, auth accounts/sessions, posts, comments, and legacy ID traceability.
- Use server actions for app-only mutations such as creating posts and comments.
- Use route handlers for Auth.js, health checks, redirects, and future webhooks.
- Use RabbitMQ jobs:
  - `link.enrich`
  - `image.process`
  - `comment.notify`
- Add bounded retries and dead-letter handling for worker failures.
- Import Rails users, posts, comments, counts, timestamps, source URLs, provider names, image URLs, and thumbnail URLs into Postgres.

## Performance Strategy

- Use hybrid cached Next rendering, not pure SPA.
- Keep the public landing/feed fast with static or cached rendering and minimal client JS.
- Isolate auth-dependent UI so it does not force the whole feed route dynamic.
- Use RSC selectively for cached read paths.
- Avoid unnecessary route-handler round trips from server components.

## Test Plan

- Write failing tests first before implementation.
- Replace RSpec with:
  - `Vitest`
  - `React Testing Library`
  - `Playwright`
- Cover these acceptance scenarios:
  - visitor can view cached public feed
  - signed-in user can submit a link
  - blank or duplicate links are rejected
  - link metadata job enriches a post
  - redirect increments click count
  - signed-in user can comment
  - comment notification job is enqueued
  - migrated Rails data appears correctly
  - Caddy routes HTTPS traffic to the app
  - Docker Compose stack boots from a clean checkout
- Add migration verification scripts comparing source and target counts and relationships.
- Add a final promotion check:
  - all tests pass from `rewrite/`
  - Docker Compose stack boots from `rewrite/`
  - migrated data is verified
  - Caddy routes to the new app
  - screenshots/layout acceptance is complete
- After the promotion check passes, lift `rewrite/` contents to the project root and remove legacy Rails files/folders in one explicit cleanup step.

## Assumptions

- Backend is `Next.js fullstack`, not a separate Express/Fastify API.
- New implementation lives under `rewrite/` until it is fully verified.
- Legacy Rails files stay untouched until the final promotion cleanup.
- Async stack is `RabbitMQ`.
- Auth stack is `Auth.js`.
- Styling stack is `shadcn/ui + Tailwind CSS + custom CSS`.
- "RSpec" means the same test-first discipline, translated to the TypeScript stack.
- If usage reaches 90%, persist resume state in `.codex/goal-state.md`.
