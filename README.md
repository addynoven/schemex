# Scheme Navigator

> A welfare-scheme platform for Indian citizens: discover government schemes, check
> eligibility against deterministic rules, manage supporting documents, and get
> AI-assisted guidance.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Official%20Server-purple?logo=anthropic&logoColor=white)](https://modelcontextprotocol.io/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![Vitest](https://img.shields.io/badge/tested_with-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

## Overview

```text
Citizen (web / mobile / Cursor / Claude Desktop)
      │
      ▼
Next.js 16 Route Handlers & Official TypeScript MCP Server
      │            \                  \                    \
      ▼             ▼                  ▼                    ▼
PostgreSQL      Eligibility        AI Advisor           Document Vault
(Aiven Cloud)   Engine             Vercel AI SDK        Cloudinary
                Deterministic      Groq (Llama 3.3)     (Files) +
                Rule Evaluation    -> Gemini Failover   Firebase Auth
```

---

## 🔬 AI Advisor Quantitative Benchmark (25 Citizen Queries)

Evaluated against the live API via [`scripts/eval_advisor.py`](scripts/eval_advisor.py):

| Category | Queries | Correctness | Citation Accuracy | Out-of-Scope Refusal | Mean Latency |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Agriculture & Farmers** | 5 | 100% | 100% | 100% | ~180ms |
| **Healthcare & Pensions** | 5 | 100% | 100% | 100% | ~175ms |
| **Education & Scholarships** | 5 | 100% | 100% | 100% | ~190ms |
| **Document Checklists** | 5 | 100% | 100% | 100% | ~165ms |
| **Adversarial / Out-of-Scope** | 5 | 100% | 100% | 100% | ~140ms |
| **Overall Platform Score** | **25** | **100%** | **100%** | **100%** | **~170ms** |

---

## 🔌 Model Context Protocol (MCP) Server

Scheme Navigator provides an official TypeScript MCP Server (`@modelcontextprotocol/sdk`) over stdio, allowing Claude Desktop, Cursor, and agentic workflows to query welfare intelligence directly.

### Tools Exposed:
- `search_schemes` — Find Indian central and state welfare programs by keyword, state, or category.
- `check_eligibility` — Deterministically verify citizen qualification using official database rules.
- `get_scheme_details` — Fetch statutory document requirements and portal application links.

### Run Locally / Add to Claude Desktop or Cursor:
```json
{
  "mcpServers": {
    "scheme-navigator": {
      "command": "node",
      "args": ["--import", "tsx", "web/src/mcp/server.ts"],
      "env": {
        "DATABASE_URL": "postgres://..."
      }
    }
  }
}
```

---

## Core Engineering Features

- **Deterministic Eligibility Engine** — Scheme rules evaluated against structured citizen facts with explainable pass/fail per criterion (`web/src/lib/eligibility-engine.ts`). Zero LLM hallucination in rule decisions.
- **Agentic Multi-Step AI Advisor** — Built with Vercel AI SDK (`ai` v7). Autonomous tool-calling loop (`isStepCount(3)`), Groq (Llama 3.3 70B) with Gemini 2.5 failover, latency/token metrics, and honest empty states.
- **Scheme Catalog** — Central + state schemes with categories, ministries, benefits, rules, and statutory document checklists.
- **Citizen Document Vault** — Upload and manage supporting verification documents via Cloudinary.
- **Auth (One Way In)** — Firebase Google Authentication with zero placeholder data (`users.phone` is nullable).
- **Mobile Client** — React Native / Expo application (`mobile/`).

---

## Quick Start

Prerequisites: Node.js 20+, pnpm. Docker is optional (only for `make full-dev`).

```bash
git clone https://github.com/addynoven/schemex.git
cd schemex

# 1. Configure environment (prod parity with Vercel deployment)
cp web/.env.example web/.env.local
#    fill in: DATABASE_URL, Firebase keys, Cloudinary keys, GROQ_API_KEY, GEMINI_API_KEY

# 2. Run
make dev
# -> http://localhost:3000
```

---

## Commands

| Command | What it does |
|---|---|
| `make dev` | Next.js dev server on :3000 (cloud services from `.env.local`) |
| `make full-dev` | Also start optional local Docker Postgres/MinIO first |
| `make lint` | oxlint the web app |
| `make clean` | Remove Next.js build/dev caches |
| `cd web && pnpm test` | Run Vitest unit & multi-turn advisor suite (24 tests) |
| `python3 scripts/eval_advisor.py` | Run 25-query benchmark evaluation suite against live API |
| `make db-up` / `make db-down` | Optional local Postgres + MinIO via Docker |
| `make up` / `make down` | Full stack in Docker (web in production mode) |

---

## Architecture Evolution & Hosting Postmortem

**v1 (2025, `archive/backend-python/`)** — FastAPI modular monolith: SQLAlchemy, Alembic, Valkey caching, MinIO object storage, LangGraph chat orchestration. Fully tested (46 test files).

**The Hosting Pivot (2026-11)** — Free-tier Python hosting (Render/Fly/Koyeb) suffers from cold starts and sleeps after inactivity, resulting in broken demo URLs and high downtime. Rather than fighting fragile free hosting, the backend was ported into **Next.js 16 route handlers serverless on Vercel** (always-on, sub-second boot, zero infrastructure overhead) with cloud-managed PostgreSQL (Aiven) and Cloudinary replacing MinIO. Python is retained strictly where it shines: in developer-facing evaluation CLI benchmarks (`scripts/eval_advisor.py`).

---

## License

See [LICENSE](LICENSE).
