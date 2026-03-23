# WP Theme Generator — implementation task list

Status: **Done** | **Partial** | **Todo**

_Last synced with repo state; run `pnpm test` before marking gates._

---

## Phase 0 · Foundation

| ID | Status | Notes |
|----|--------|--------|
| T-001 | **Done** | pnpm monorepo, `packages/client`, `server`, `shared` |
| T-002 | **Done** | Root `tsconfig.json`, strict, path aliases |
| T-003 | **Done** | ESLint + Prettier at root |
| T-004 | **Done** | Vitest in shared, server, client |
| T-005 | **Done** | `ThemeManifest`, `ThemeJson`, `BlockTemplate`, `GenerateRequest` |
| T-006 | **Partial** | `CORE_BLOCKS` >90 entries + tests; `requiredFiles` only lists 3 paths (PRD expects full theme file manifest, e.g. 11+ paths) |
| T-007 | **Partial** | `.env.example`, dotenv, `.gitignore`; server does not yet fail fast on missing `ANTHROPIC_API_KEY` |
| T-008 | **Done** | Git repo present (verify remote/branch naming vs PRD if needed) |

---

## Phase 1 · Validation engine

| ID | Status | Notes |
|----|--------|--------|
| T-010 | **Done** | `themeSlug` + tests |
| T-011 | **Done** | `themeJson` Zod + tests |
| T-012 | **Done** | Forbidden `wp:html` scan + tests |
| T-013 | **Done** | Stack-based nesting + tests |
| T-014 | **Done** | Core block allowlist warnings + tests |
| T-015 | **Todo** | Standalone pattern PHP header validator (Title / Slug / Categories) not in `validateTheme` |
| T-016 | **Todo** | Standalone `style.css` header validator not implemented |
| T-017 | **Done** | `validateTheme` composes slug, theme.json, markup, required files + integration tests |

---

## Phase 2 · Assembly & packaging

| ID | Status | Notes |
|----|--------|--------|
| T-020 | **Done** | `buildStyleCSS` |
| T-021 | **Done** | `buildThemeJSON` (from manifest fields) |
| T-022 | **Done** | `buildTemplateFile` (header/footer parts on templates) |
| T-023 | **Done** | `buildPatternFile` |
| T-024 | **Partial** | `buildStyleVariation` exists; assembler ships **2** variations (dark, high-contrast) — PRD wants **3** (+ AI third) |
| T-025 | **Done** | `createZip` + tests |
| T-026 | **Todo** | Temp ZIP storage + `GET /api/download/:id` |
| T-027 | **Done** | Assembly → validate → zip integration tests (`assembly.integration.test.ts`) |

---

## Phase 3 · AI integration

| ID | Status | Notes |
|----|--------|--------|
| T-030 | **Todo** | `AIProvider` + `AnthropicProvider` (SDK is a dependency only) |
| T-031 – T-039 | **Todo** | Prompt builders, two-pass flow, retries, rate limit, `pnpm test:integration` with real generate |

---

## Phase 4 · Express API

| ID | Status | Notes |
|----|--------|--------|
| T-040 | **Partial** | Express, CORS, JSON, `GET /health` — no split `app.ts`/`server.ts`, no request logging middleware |
| T-041 | **Todo** | `POST /api/generate` |
| T-042 | **Todo** | `GET /api/download/:sessionId` |
| T-043 | **Todo** | `POST /api/iterate` |
| T-044 | **Todo** | `POST /api/validate` |
| T-045 | **Todo** | Global error handler |
| T-046 | **Todo** | Input sanitization middleware |

---

## Phase 5 · React frontend

| ID | Status | Notes |
|----|--------|--------|
| T-050 | **Partial** | Vite + React + TS, `/api` proxy; `react-router-dom` installed but not used; **Tailwind not added** |
| T-051 – T-061 | **Todo** | Theme wizard, generation panel, file explorer, preview, iteration chat, etc. |

---

## Phase 6 · Quality & polish

| ID | Status | Notes |
|----|--------|--------|
| T-070 – T-075 | **Todo** | A11y injection, contrast checks, prompt-injection guards, query-loop quality, caching, UI polish |
| T-076 | **Partial** | `pnpm test`, `pnpm lint`, `pnpm typecheck` all exit 0; full Phase 6 bar (a11y, contrast, injection, `test:integration` generate) still open |

---

## Phase 7 · Documentation & submission

| ID | Status | Notes |
|----|--------|--------|
| T-080 | **Partial** | Minimal `README.md` — needs env vars, architecture, screenshots, limitations per PRD |
| T-081 | **Todo** | `ADR.md` |
| T-082 | **Todo** | `NEXT.md` |
| T-083 | **Todo** | Git narrative / PR hygiene per PRD |
| T-084 | **Todo** | Manual WordPress install smoke (3 themes) |
| T-085 | **Todo** | Final deliverable checklist |

---

## Suggested next slices (in order)

1. **T-006** — Expand `requiredFiles` to PRD minimum set; align `validateTheme` + integration fixture `files` array.
2. **T-015 / T-016** — Wire pattern + `style.css` checks into `validateTheme` (or post-assembler pass).
3. **T-024** — Third style variation from manifest / DesignSpec.
4. **T-040 + T-041 + T-026 + T-042** — Generate API + ZIP persistence + download (unblocks end-to-end).
5. **T-030 – T-036** — Two-pass Claude + `ThemeManifest` parsing + validation retry loop.
6. **T-050 + wizard (T-051–T-053)** — Tailwind, Router, real UI.

---

## Quick verification

```bash
pnpm test        # currently green
pnpm lint
pnpm typecheck
```
