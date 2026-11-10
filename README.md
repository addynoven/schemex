# Scheme Navigator

> A welfare-scheme platform for Indian citizens: discover government schemes, check
> eligibility against deterministic rules, manage supporting documents, and get
> AI-assisted guidance.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![Vitest](https://img.shields.io/badge/tested_with-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

## Overview

```text
Citizen (web / mobile)
      |
      v
Next.js route handlers  (the entire backend, serverless on Vercel)
      |            \                \                    \
      v             v                v                    v
PostgreSQL      Eligibility      AI advisor         Document vault
(all data)      engine           Groq -> Gemini     Cloudinary
                deterministic    failover,          (files) +
                rule evaluation  streaming          Firebase Auth
```

Four engineering problems drive the design:

- **Discovery** — make a large scheme catalog (central + state) searchable and browsable.
- **Eligibility** — evaluate structured rules deterministically instead of asking an LLM
  to make the decision. Every result is explainable per criterion.
- **Documents** — connect citizen documents to scheme requirements.
- **Assistance** — conversational guidance with provider failover, while core business
  rules stay separate from generation.

## Features

- **Deterministic eligibility engine** — scheme rules evaluated against structured
  citizen facts with explainable pass/fail per criterion
  (`web/src/app/api/eligibility/explain/route.ts`).
- **Scheme catalog** — central + state schemes with categories, ministries, benefits,
  rules, and required documents.
- **AI advisor** — multilingual (English/Hindi/Hinglish) chat with Groq as primary
  provider and Gemini failover.
- **Citizen document vault** — upload and manage supporting documents (Cloudinary).
- **Auth** — Firebase Authentication (email/password + Google).
- **Administration** — scheme management, canonical documents, user management.
- **Mobile app** — React Native / Expo client (separate track, `mobile/`).

## Quick start

Prerequisites: Node.js 20+, pnpm. Docker is optional (only for `make full-dev`).

```bash
git clone https://github.com/addynoven/schemex.git
cd schemex

# 1. Configure environment (same keys as the Vercel deployment — prod parity)
cp web/.env.example web/.env.local
#    fill in: DATABASE_URL, Firebase keys, Cloudinary keys, GROQ_API_KEY, GEMINI_API_KEY

# 2. Run
make dev
# -> http://localhost:3000  (first boot ~40s: pnpm supply-chain check; then <1s)
```

## Commands

| Command | What it does |
|---|---|
| `make dev` | Next.js dev server on :3000 (cloud services from `.env.local`) |
| `make full-dev` | Also start optional local Docker Postgres/MinIO first |
| `make lint` | oxlint the web app |
| `make clean` | Remove Next.js build/dev caches |
| `cd web && pnpm test` | Vitest test suite |
| `make db-up` / `make db-down` | Optional local Postgres + MinIO via Docker |
| `make up` / `make down` | Full stack in Docker (web in production mode) |

## Repository structure

```text
web/                      Next.js 16 app — UI modules + the entire API (route handlers)
  src/app/api/            13 API route groups: auth, chat, eligibility, schemes, vault...
  src/lib/                db, auth, chat advisor, session
  src/modules/            10 feature modules (check, results, vault, tracking, admin...)
archive/backend-python/   v1 — FastAPI modular monolith (~17K LOC, 46 test files),
                          incl. the LangGraph tool-augmented advisor and
                          docs/AGENTIC_CHAT_ARCHITECTURE_PLAN.md
archive/scheme-backend-go/ Go backend experiment (inactive)
mobile/                   React Native / Expo client
knowledge/                scheme source data (central + state ministries)
docs/                     architecture notes
AGENTS.md                 orientation for AI agents / new sessions
```

## Version history

**v1 (2025, `archive/backend-python/`)** — FastAPI modular monolith: SQLAlchemy,
Alembic, Valkey caching, MinIO object storage, LangGraph chat orchestration with a
tool-augmented advisor and SSE streaming. Fully tested (46 test files).

**The hosting pivot (2026-11)** — v1's deployment story hit a wall: every free Python
hosting tier sleeps after inactivity, so a demo URL is never reliably up. Rather than
pay for hosting, the backend was ported into Next.js route handlers and deployed on
Vercel (serverless, always-on, free tier) with cloud-managed Postgres (Aiven) and
Cloudinary replacing MinIO. The deterministic eligibility engine was ported verbatim.
v1 is preserved in `archive/` as the architecture-evolution reference — including its
tool-augmented advisor design, which the current single-shot advisor is being upgraded
to (see Roadmap).

## Roadmap

1. **Tool-augmented advisor** — replace keyword routing + single-shot LLM calls with a
   tool-call loop (`check_eligibility`, `get_scheme_details`), following v1's
   `docs/AGENTIC_CHAT_ARCHITECTURE_PLAN.md`.
2. **Eval suite** — rubric-scored citizen questions vs the live API (answer correctness,
   citation accuracy, refusal handling) published in this README.
3. **MCP server** — expose `check_eligibility`, `get_scheme_details`, `search_schemes`
   via the official TypeScript SDK.
4. **Mobile** — Expo client release track.

## License

See [LICENSE](LICENSE).
