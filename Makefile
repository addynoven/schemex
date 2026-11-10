# Scheme Navigator — Next.js/TypeScript stack
# The app's live dependencies are cloud services (Aiven Postgres, Cloudinary, Firebase,
# Groq/Gemini) configured via web/.env.local — same env as the Vercel deployment.
# Docker infra below is optional (only needed if you point DATABASE_URL at local Postgres).

.PHONY: help dev start full-dev dev-web db-up db-down up down lint clean

help:
	@echo "🏛️ Scheme Navigator — Developer Commands (Next.js/TypeScript stack)"
	@echo "------------------------------------------------------------------"
	@echo "  make dev      : Next.js dev server :3000 (uses cloud services from .env.local)"
	@echo "  make start    : Alias for make dev"
	@echo "  make full-dev : Also start Docker Postgres/MinIO first (optional local infra)"
	@echo "  make dev-web  : Next.js dev server only (port 3000)"
	@echo "  make db-up    : Start Docker PostgreSQL + MinIO"
	@echo "  make db-down  : Stop Docker PostgreSQL + MinIO"
	@echo "  make up       : Start the full stack in Docker (web in production mode)"
	@echo "  make down     : Stop all Docker services"
	@echo "  make lint     : oxlint the web app"
	@echo "  make clean    : Remove Next.js build/dev caches"

dev:
	cd web && pnpm dev

start:
	$(MAKE) dev

full-dev:
	docker compose up -d postgres minio minio-createbuckets
	cd web && pnpm dev

start:
	$(MAKE) dev

dev-web:
	cd web && pnpm dev

db-up:
	docker compose up -d postgres minio minio-createbuckets

db-down:
	docker compose stop postgres minio minio-createbuckets

up:
	docker compose up -d

down:
	docker compose down

lint:
	cd web && pnpm lint

clean:
	rm -rf web/.next web/tsconfig.tsbuildinfo web/coverage
