# Linkit

A full-stack link-sharing app. Share links, browse by source, comment, save favourites. Built as a TypeScript rewrite of the original Rails app (2014).

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, RSC + client components) |
| Auth | Auth.js v5 — credentials + Facebook OAuth, JWT strategy |
| Database | PostgreSQL + Drizzle ORM |
| Cache | Redis — gallery pages pre-warmed every 60s, comment threads 60s TTL |
| Queue | RabbitMQ — async link enrichment, image processing, email notifications |
| Images | Sharp (local) or Cloudinary |
| Styling | Tailwind CSS v3, 5 built-in themes |
| Tests | Vitest (unit/integration) + Playwright (E2E) |
| Dev infra | Docker Compose + Caddy (local HTTPS) |

## Quick Start

```sh
make install       # npm install
cp .env.example .env
make migrate       # apply DB migrations
make dev           # full Docker stack: https://localhost:8443
```

Caddy uses its internal local CA — browsers may prompt to trust it once. Use `curl -k` for CLI checks.

Seed test accounts and sample posts:

```sh
make seed
```

## Development

```sh
make test          # Vitest unit + integration tests
make typecheck     # tsc --noEmit
make build         # production Next.js build
make test-e2e      # Playwright E2E (requires TEST_DATABASE_URL)
```

Direct Next.js dev (without Caddy, useful for quick iteration):

```sh
npm run dev:web    # start Next.js only — needs Docker services running separately
docker compose up -d postgres rabbitmq redis
```

Worker (runs standalone alongside `dev:web`):

```sh
npm run worker
```

## Service Ports

| Service | Address |
|---------|---------|
| App (HTTPS via Caddy) | https://localhost:8443 |
| App (HTTP via Caddy) | http://localhost:8080 |
| Postgres | localhost:55432 |
| RabbitMQ AMQP | localhost:5673 |
| RabbitMQ management | http://localhost:15673 |

## Database

```sh
make db-generate   # generate Drizzle migration after schema changes
make migrate       # apply pending migrations
```

Migration files live in `drizzle/`. Always run `db:generate` then `migrate` after editing `src/db/schema.ts`.

## Environment Variables

Copy `.env.example` → `.env`. Required variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `RABBITMQ_URL` | RabbitMQ AMQP URL |
| `REDIS_URL` | Redis connection URL |
| `AUTH_SECRET` | Auth.js JWT secret (32+ chars in prod) |
| `REVALIDATE_SECRET` | Cache revalidation API guard |
| `AUTH_TRUST_HOST` | Set `true` behind a reverse proxy |
| `APP_URL` | Public URL (used for email links) |

Optional: `AUTH_FACEBOOK_ID/SECRET`, `CLOUDINARY_*`, `MAILGUN_API_KEY/DOMAIN`, `EMBEDLY_API_KEY`.

Validate production env before deploy:

```sh
make check-env
```

## Architecture Notes

- **Gallery feed**: first N pages per provider pre-warmed in Redis on worker startup and every 60s. API route reads from Redis; DB fallback on cold start or non-standard page size.
- **Keyset pagination**: cursor = base64url `{ providerName, createdAt, id }`. No OFFSET. Stable under concurrent inserts/deletes.
- **Async jobs**: RabbitMQ topic exchange `linkit.events`. Dead-letter exchange `linkit.dead`. Worker handles `link.enrich`, `image.process`, `comment.notify`.
- **Post visibility**: gated on `thumbnailUrl IS NOT NULL` — unprocessed posts are hidden until the image job completes.
- **JWT sessions**: required by Auth.js v5 credentials provider. No DB session table needed.

See `docs/architecture.md` and `docs/decisions.md` for full reasoning.

## Production Preflight

```sh
npm run env:check      # validate all required env vars
curl -k https://localhost:8443/healthz
```

## Cache Revalidation

Mutations revalidate the feed automatically. After a data import, force a full refresh:

```sh
APP_URL=http://localhost:8080 \
REVALIDATE_SECRET=your-secret \
npm run cache:revalidate
```

Or call `POST /api/revalidate` with header `x-linkit-revalidate-secret: <secret>`.

---

## Origin Story — 2014 Rails App

The original Linkit was a Rails app built in 2014 — a personal link-sharing tool deployed on Heroku with Redis and PostgreSQL. Below is the original README, preserved as a snapshot of how the same product was built with the tools of that era.

---

### linkit (2014)

- Production URL: [https://linkit-dev.herokuapp.com/](https://linkit-dev.herokuapp.com/)

Share links and posts.

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-12-07.png)

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-12-03-1.png)

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-11-25-2.png)

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-10-14.png)

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-10-09.png)

#### To-do List (2014)

- Production with http version.
- Capybara and integration test should on.
- Prepare to deploy.
- Email links should direct to **production** url.

#### Notes

**AJAX pattern (Rails)**

```ruby
# Set form to remote: true for AJAX
form_for root_path, remote: true do |f|
  # ...
end

# Respond with JS template
def action
  respond_to do |f|
    f.js { render "js_file/erb" }
  end
end
```

`ajaxSuccess` listens to Ajax calls from the document; `$.ajax().success()` fires the request.

**Session & cookie security**

Each request creates a server-side session; a cookie carries the session ID. Rails CookieStore (since Rails 2) stores the session hash on the client, signed with SHA1 using `config.secret_key_base`. Force SSL to secure the cookie.

**Redis flush (Heroku)**

```sh
redis-cli -h mummichog.redistogo.com -p 9160 -a ${redis_basic_auth_credential} flushall
```
