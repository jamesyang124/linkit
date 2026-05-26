# Linkit

Linkit is a fullstack TypeScript rewrite of the original Rails link-sharing app.

## Stack

- Next.js, React, TypeScript
- Tailwind CSS
- Auth.js
- Postgres with Drizzle ORM
- RabbitMQ worker jobs for link enrichment, image processing, and comment notifications
- Docker Compose with Caddy, web, worker, Postgres, and RabbitMQ
- Vitest and Playwright

## Local Development

Install dependencies:

```sh
npm install
```

Start the full development stack:

```sh
npm run dev
```

The default development app is served through Caddy at `https://localhost:8443`. The `web` container runs `next dev` with the project mounted into `/app`, so frontend/server changes hot reload without rebuilding or restarting the Compose stack. Caddy uses its internal local CA; browsers may ask you to trust the local certificate, and command-line checks should use `curl -k` unless the CA is trusted.

For direct Next.js debugging without Caddy:

```sh
npm run dev:web
```

Supporting services are still available through Docker Compose:

```sh
docker compose up -d postgres rabbitmq
```

## Docker Stack

Build and start the full stack:

```sh
npm run dev:prod-stack
```

For the raw production-style Compose command:

```sh
docker compose up --build -d
```

Caddy exposes the app at:

- `http://localhost:8080`
- `https://localhost:8443`

The local HTTPS endpoint uses Caddy's internal CA. Use `curl -k` for command-line smoke checks unless you install/trust the local Caddy root certificate.

Useful service ports:

- Postgres: `localhost:55432`
- RabbitMQ AMQP: `localhost:5673`
- RabbitMQ management: `http://localhost:15673`

## Verification

```sh
npm test
npm run typecheck
npm run build
TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e
npm audit --omit=dev
docker compose config
```

Local HTTPS smoke check:

```sh
curl -k https://localhost:8443/healthz
```

## Production Preflight

Copy `.env.production.example`, replace every placeholder, then run:

```sh
npm run env:check
```

Production checks reject placeholder `AUTH_SECRET` values and partial OAuth, Cloudinary, or Mailgun settings.

## Cache Revalidation

The public feed is cached with tag-based revalidation. Mutations revalidate the feed automatically. After a data migration or external import, refresh the cache explicitly:

```sh
APP_URL=http://localhost:8080 REVALIDATE_SECRET=development-revalidate-secret-change-me npm run cache:revalidate
```

In production, set `REVALIDATE_SECRET` to a unique 32+ character value and call `POST /api/revalidate` with the `x-linkit-revalidate-secret` header after migration/import jobs.

## Legacy Migration Check

The synthetic fixture verifies the Rails export/import contract:

```sh
CLEAN_BEFORE_IMPORT=true LEGACY_EXPORT_JSON=./scripts/legacy/fixtures/rails-export.json DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run legacy:import
LEGACY_EXPORT_JSON=./scripts/legacy/fixtures/rails-export.json DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run legacy:verify
```

See [docs/legacy-migration.md](docs/legacy-migration.md) for the export JSON shape.
