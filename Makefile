.PHONY: install dev migrate seed test typecheck build test-e2e db-generate check-env help

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "  install       Install Node dependencies"
	@echo "  dev           Start full Docker stack (web + worker + Postgres + RabbitMQ + Redis + Caddy)"
	@echo "  migrate       Apply pending database migrations"
	@echo "  seed          Seed test accounts and sample posts"
	@echo ""
	@echo "  test          Run Vitest unit/integration tests"
	@echo "  typecheck     TypeScript type check (tsc --noEmit)"
	@echo "  build         Production Next.js build"
	@echo "  test-e2e      Run Playwright E2E tests (requires TEST_DATABASE_URL)"
	@echo ""
	@echo "  db-generate   Generate Drizzle migration after schema changes"
	@echo "  check-env     Validate production environment variables"

install:
	npm install

dev:
	npm run dev

migrate:
	npm run db:migrate

seed:
	npm run seed:dev

test:
	npm test

typecheck:
	npm run typecheck

build:
	npm run build

test-e2e:
	npm run test:e2e

db-generate:
	npm run db:generate

check-env:
	npm run env:check
