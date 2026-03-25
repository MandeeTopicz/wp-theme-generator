# WP Theme Generator — Implementation Task List

Status: **Done** | **Partial** | **Todo**

_Last synced with repo state 2026-03-25. Run `pnpm test` before marking gates._

---

## Phase 0 - Foundation

| ID | Status | Notes |
|----|--------|--------|
| T-001 | **Done** | pnpm monorepo, `packages/client`, `server`, `shared` |
| T-002 | **Done** | Root `tsconfig.json`, strict, path aliases |
| T-003 | **Done** | ESLint + Prettier at root |
| T-004 | **Done** | Vitest in shared, server, client |
| T-005 | **Done** | `ThemeManifest`, `ThemeJson`, `BlockTemplate`, `GenerateRequest`, `CopyStrings`, `TemplateCatalog` |
| T-006 | **Done** | `CORE_BLOCKS` ~106 entries + tests; `requiredFiles` lists 3 core paths |
| T-007 | **Done** | `.env.example`, dotenv, `.gitignore`; server validates API key at provider construction |
| T-008 | **Done** | Git repo with incremental commits |

---

## Phase 1 - Validation Engine

| ID | Status | Notes |
|----|--------|--------|
| T-010 | **Done** | `themeSlug` regex validator + tests |
| T-011 | **Done** | `themeJson` Zod schema validator + tests |
| T-012 | **Done** | Forbidden `wp:html` / `wp:freeform` scan + tests |
| T-013 | **Done** | Stack-based nesting validator + tests |
| T-014 | **Done** | Core block allowlist warnings + tests |
| T-015 | **Partial** | Pattern PHP header validation not in `validateTheme` (patterns have correct headers via assembler) |
| T-016 | **Partial** | `style.css` header validation not standalone (header generated deterministically by assembler) |
| T-017 | **Done** | `validateTheme` composes slug, theme.json, markup, required files, contrast checks + integration tests |

---

## Phase 2 - Assembly & Packaging

| ID | Status | Notes |
|----|--------|--------|
| T-020 | **Done** | `buildStyleCSS` with WordPress theme header + layout safety CSS |
| T-021 | **Done** | `buildThemeJSON` with colors, typography, spacing, styles block, luminance-based theme detection |
| T-022 | **Done** | `buildTemplateFile` with skip-link, header/footer part references, no-double-wrap detection |
| T-023 | **Done** | `buildPatternFile` with PHP registration headers (Title, Slug, Categories, BlockTypes) |
| T-024 | **Done** | `buildStyleVariation` — 3 variations: dark, high-contrast, AI-designed third variation |
| T-025 | **Done** | `createZip` with archiver, correct directory structure + tests |
| T-026 | **Done** | Temp ZIP storage + `GET /api/download/:sessionId` + `GET /api/playground/:sessionId` |
| T-027 | **Done** | Assembly + validation + zip integration tests |

---

## Phase 3 - AI Integration

| ID | Status | Notes |
|----|--------|--------|
| T-030 | **Done** | `AIProvider` interface + factory function (`createAIProvider`) |
| T-031 | **Done** | `GeminiProvider` — `@google/generative-ai` SDK, retry with backoff, `gemini-2.5-flash` default |
| T-032 | **Done** | `AnthropicProvider` — `@anthropic-ai/sdk`, retry with backoff, `claude-sonnet-4-20250514` default |
| T-033 | **Done** | `buildPass1SystemPrompt` — 5 archetypes, negative examples, CopyStrings schema, role locking |
| T-034 | **Done** | `buildPass1UserPrompt` — sanitized description, site type, color palette, target audience |
| T-035 | **Done** | `parseDesignSpec` — Zod validation, JSON extraction from code fences, retry-friendly errors |
| T-036 | **Done** | Prompt injection sanitization (HTML strip, pattern removal) + tests |
| T-037 | **Done** | Provider tests (factory, retry logic, backoff calculations) |

---

## Phase 4 - Template Skeleton System

| ID | Status | Notes |
|----|--------|--------|
| T-040 | **Done** | `TemplateSkeleton` type, `ColorSlotMap` type |
| T-041 | **Done** | `resolveColorSlugs` — luminance sorting, saturation/contrast analysis, semantic role assignment |
| T-042 | **Done** | `interpolateCopy` — placeholder replacement with HTML entity escaping |
| T-043 | **Done** | 8 skeleton builders: starter, editorial, portfolio, bold, minimal, magazine, starter-plus, creative |
| T-044 | **Done** | `TEMPLATE_CATALOG` in shared — metadata for all 8 templates |
| T-045 | **Done** | `getTemplateSkeleton` factory function |

---

## Phase 5 - Express API

| ID | Status | Notes |
|----|--------|--------|
| T-050 | **Done** | Express, CORS, JSON (5MB limit), `GET /health`, `GET /api/check-key` |
| T-051 | **Done** | `POST /api/generate` — Zod validation, SSE streaming, design spec + template assembly + validation + ZIP |
| T-052 | **Done** | `GET /api/download/:sessionId` — ZIP delivery with Content-Disposition |
| T-053 | **Done** | `GET /api/playground/:sessionId` — ZIP fetch for WordPress Playground |
| T-054 | **Done** | `POST /api/validate` — standalone validation endpoint |
| T-055 | **Done** | `POST /api/iterate` — returns 501 (not supported in template-first architecture) |
| T-056 | **Done** | Rate limiter (5 req / 15 min per IP on generate) |
| T-057 | **Done** | Error handler middleware (no stack traces, consistent shape) |
| T-058 | **Done** | Input sanitization middleware (HTML strip, description length, siteType enum) |
| T-059 | **Done** | Route integration tests (SSE generate, download, validate) |

---

## Phase 6 - React Frontend

| ID | Status | Notes |
|----|--------|--------|
| T-060 | **Done** | Vite + React 18 + TypeScript + Tailwind CSS 4 + React Router DOM v6 |
| T-061 | **Done** | 6-step ThemeForm wizard (description, identity, color palette, typography, layout, review) |
| T-062 | **Done** | StepDescription — textarea, site type selector, 7 suggestion pills |
| T-063 | **Done** | StepIdentity — theme name, slug input with live validation |
| T-064 | **Done** | StepColorPalette — 8 presets with per-color customization via color picker |
| T-065 | **Done** | StepTypography — heading font, body font, type scale selection |
| T-066 | **Done** | StepLayout — hero style (4 options with SVG wireframes), navigation, sidebar, footer |
| T-067 | **Done** | StepReview — summary of all selections, generate button |
| T-068 | **Done** | GenerationContext — SSE parsing, progress tracking, sessionStorage caching |
| T-069 | **Done** | GenerationPanel — file tree, download button, validation summary |
| T-070 | **Done** | PlaygroundPreview — WordPress Playground in iframe, theme install/activate, viewport toggle |
| T-071 | **Done** | ResultPage — tabs (Live, Design System, Validation), file inspector with syntax highlighting |
| T-072 | **Done** | Client routing (/, /generate, /result/:sessionId) |
| T-073 | **Done** | Client tests (hooks, App structure, ThemeForm structure, routing) |

---

## Phase 7 - Quality & Polish

| ID | Status | Notes |
|----|--------|--------|
| T-080 | **Done** | WCAG contrast checks in validation (4.5:1 ratio, luminance math) |
| T-081 | **Done** | Prompt injection guards (HTML strip, pattern removal, role locking) |
| T-082 | **Done** | Query loop validation (missing post-template, missing post-title warnings) |
| T-083 | **Done** | `pnpm test` (120 tests), `pnpm lint`, `pnpm typecheck` all exit 0 |
| T-084 | **Partial** | Manual WordPress install smoke testing — done for subset of templates |

---

## Phase 8 - Documentation & Submission

| ID | Status | Notes |
|----|--------|--------|
| T-090 | **Done** | `README.md` — setup, env vars, architecture, generation pipeline, known limitations |
| T-091 | **Done** | `ADR.md` — 8 architectural decisions with context, alternatives, consequences |
| T-092 | **Done** | `NEXT.md` — prioritized roadmap (iteration, Playground validation, more skeletons, production readiness) |
| T-093 | **Done** | Git history with incremental, well-scoped commits (conventional commits format) |

---

## Quick Verification

```bash
pnpm test        # 120 tests passing
pnpm lint        # clean
pnpm typecheck   # clean
```
