# AGENTS.md — read this first (agent / new-session orientation)

Last verified: 2026-11-10. If reality contradicts this file, fix this file in the same commit.

## What this repo is (30 seconds)

**Scheme Navigator** — a welfare-scheme platform for Indian citizens: scheme catalog,
deterministic eligibility engine, document vault, and an AI advisor.
The **live stack is Next.js 16 (TypeScript, Turbopack) deployed on Vercel** — the entire
backend is Next.js route handlers under `web/src/app/api/` (13 route groups).
The old Python/FastAPI backend is **v1, archived** in `archive/backend-python`
(~17K LOC, 46 test files) — reference only, do not resurrect.

## LIVE dependency map (all cloud, verified from code)

| Service | Role | Where |
|---|---|---|
| Aiven cloud PostgreSQL | all app data | `DATABASE_URL` in `web/.env.local` |
| Cloudinary | document file storage | `web/src/app/api/vault/documents/*` |
| Firebase Auth | sign-in / sign-up (live path) | `web/src/modules/auth/repositories/auth.repository.ts`, `web/src/lib/firebase.ts` |
| Groq API | primary LLM (chat advisor) | `web/src/lib/chat-server.ts` |
| Gemini API | LLM failover | `web/src/lib/chat-server.ts` |

Local dev = same services as production (prod parity via `web/.env.local`).
Env template: `web/.env.example`. All real env files are gitignored (verified).

## Things that LOOK real but are NOT used (don't waste time)

- `compose.yaml` postgres/minio containers — the app never connects to them
  (no S3/MinIO SDK anywhere in `web/`; Cloudinary replaced MinIO).
  `make dev` does NOT start them; `make full-dev` does (optional local infra).
- `archive/backend-python/` — v1 monolith. Its crown jewel is the architecture doc
  `docs/AGENTIC_CHAT_ARCHITECTURE_PLAN.md` (v2 tool-augmented advisor blueprint).
- `archive/scheme-backend-go/` — dead experiment.
- `scripts/*.py`, root `.env.example`, `root.env.example` — v1-era artifacts.

## Commands

```bash
make dev        # Next.js dev server on :3000 (the normal workflow)
make full-dev   # also start optional Docker postgres/minio first
make lint       # oxlint in web/
make clean      # remove Next.js caches
cd web && pnpm test   # vitest
```

## Key files

- `web/src/lib/chat-server.ts` — LIVE chat advisor. Known anti-patterns (deliberate
  week-2 target, do not "fix" piecemeal): single-shot LLM call, brittle keyword routing
  (`lower.includes("eligibility")`, `"namaskar"`, ...), eager DB scheme pre-fetch into the
  prompt, hardcoded fallback scheme lists, silent `catch` blocks. The plan is to replace
  it with a tool-call loop (`check_eligibility`, `get_scheme_details`) per
  `docs/AGENTIC_CHAT_ARCHITECTURE_PLAN.md`.
- `web/src/app/api/eligibility/explain/route.ts` — deterministic eligibility engine
  (409 lines, ported from v1, working). Do NOT re-port.
- `web/src/app/api/` — the entire backend (auth, chat, eligibility, schemes, vault,
  admin, profiles, stats, documents...).
- `web/src/modules/` — 10 UI modules (admin, auth, check, home, profile, results,
  schemes, support, tracking, vault).
- `mobile/` — Expo app, separate track.

## Known gotchas / housekeeping (as of 2026-11-10)

- **Next.js 16 is NOT the Next.js in your training data** — see the auto-generated
  block in `web/AGENTS.md`; read `node_modules/next/dist/docs/` before writing code.
- `middleware.ts` is deprecated in Next 16 (→ `proxy`); codemod:
  `npx @next/codemod@canary middleware-to-proxy .` (run inside `web/`).
- Run `pnpm approve-builds` once in `web/` (pnpm blocks build scripts of
  `@firebase/util` + `protobufjs`; also adds ~37s to first boot otherwise).
- **GOOGLE-ONLY AUTH (user law, 2026-11-11: "only one way in")**: sign-in and
  sign-up happen exclusively via the Firebase Google popup on `/login` — single
  button, no tabs. Deleted: `/register` page, LoginForm (email/password/phone form),
  login Sign-Up tabs. No phone, OTP, SMS, or email/password auth in the product.
  Dormant leftovers (week-1 cleanup candidates): email/password paths in
  `/api/auth/login` + `/api/auth/register` (still called internally by the Google
  sync flow), Firebase email methods in `auth.repository`, better-auth catch-all
  route (`api/auth/[...all]`), dead `src/components/AuthGuard.tsx` (react-router
  style, imports nonexistent `@/router`, imported nowhere).
- **`users.phone` is nullable (altered 2026-11-10)** — profile-page metadata only,
  never used for auth. The eligibility engine never reads it. Do NOT insert
  fake/placeholder phones; users without one get NULL.
- First `make dev` boot can take ~40s (pnpm supply-chain check) before Next boots (<1s).

## Current work state (roadmap owner: `/home/neon/vault/Job Hunt Dossier.md` §10)

- Week 1 (repo rescue): Makefile modernized ✅ · README rewritten ✅ · this file ✅ ·
  remaining: live-deploy diagnostic clickthrough, `pnpm approve-builds`,
  middleware→proxy, mixed-auth cleanup.
- Week 2: tool-augmented advisor (tool-call loop replacing keyword heuristics).
- Week 3: eval suite (Python CLI vs live API → README table) + MCP server + README v2.
- Week 4: applications.
