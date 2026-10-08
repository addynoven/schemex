# Auto-detect available CPU cores (defaults to 16 on this machine, fallback to 4)
NUM_CORES ?= $(shell nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

.PHONY: help dev start dev-frontend dev-web db-up db-down up down clean lint

help:
	@echo "🏛️ Scheme Navigator — Developer Commands"
	@echo "--------------------------------------------------"
	@echo "  make dev                 : Start PostgreSQL/MinIO and the Next.js app"
	@echo "  make start               : Alias for make dev"
	@echo "  make dev-web             : Run Next.js frontend only (port 3000)"
	@echo "  make dev-frontend        : Alias for make dev-web"
	@echo "  make db-up               : Start PostgreSQL + MinIO services with Docker"
	@echo "  make db-down             : Stop Docker database & S3 services"
	@echo "  make up                  : Start entire stack inside Docker containers"
	@echo "  make down                : Stop all Docker stack services"
	@echo "  make lint                : Format & typecheck codebase"
	@echo "  make clean               : Clean temporary cache & pytest artifacts"

dev:
	docker compose up -d postgres minio minio-createbuckets
	cd web && pnpm dev

start:
	$(MAKE) dev

dev-web:
	cd web && npm run dev

dev-frontend:
	cd web && npm run dev

db-up:
	docker compose up -d postgres minio minio-createbuckets

db-down:
	docker compose stop postgres minio minio-createbuckets

up:
	docker compose up -d

down:
	docker compose down

clean:
	rm -rf .pytest_cache .coverage htmlcov __pycache__ */__pycache__ */*/__pycache__ app/**/__pycache__
	rm -rf frontend/dist

lint:
	cd web && pnpm lint


