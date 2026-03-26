# Architectural Decision Records

---

## ADR-001: 4-Step Sequential AI Pipeline

**Status:** Accepted
**Date:** March 2026

### Context

Three generation architectures were attempted before landing on the current approach:

**Attempt 1 — Single-shot full generation:** One AI call asking for all theme files. Produced structurally broken markup in ~30% of generations. The AI lost coherence generating 8+ files in one response, producing unclosed blocks, hallucinated block names, and inconsistent color application.

**Attempt 2 — AI design spec + deterministic skeleton templates:** The AI generated a design spec (colors, typography, copy), then 8 hand-crafted skeleton templates were populated with those tokens. Structurally reliable but visually generic — every "portfolio" theme looked the same regardless of the user's description because layout decisions were baked into the skeletons, not driven by the AI.

**Attempt 3 (current) — Sequential focused pipeline:** The AI makes 4 small, focused calls. Each call builds on the previous. No static skeletons.

### Decision

Implement a 4-step sequential pipeline:

1. **Design Brief** — colors, typography, concrete layout decisions, copy
2. **Header + Footer** — template parts using the brief's tokens
3. **Homepage** — index.html + hero pattern using the full brief
4. **Inner Templates** — single, page, archive, 404

`theme.json` and `style.css` are built deterministically from the design brief after the pipeline completes.

### Why This Works

Each call is focused enough that the AI applies real design judgment rather than defaulting to safe patterns. The design brief step is the most important — it makes concrete layout decisions (heroStyle, headerStyle, sectionsOrder, visualTension) that give the markup generation calls specific creative direction.

The key insight from Attempt 2's failure: the problem wasn't that the AI was generating markup — the problem was that static skeletons were deciding layout before the AI had any creative input. The current architecture lets the AI decide what sections appear, in what order, with what visual treatment — then execute that decision in focused markup calls.

### Consequences

- Generation takes 60-120 seconds (4 sequential calls) vs. 10-30 seconds (1 call)
- Output quality is substantially higher — themes have distinct visual personalities driven by the user's description
- Each step's output is independently validated by Zod schemas with recovery logic

---

## ADR-002: Prompt Engineering — Concrete Layout Instructions Over Style Labels

**Status:** Accepted
**Date:** March 2026

### Context

Early design brief prompts used an "archetype" system — 5 buckets (editorial, bold-saas, minimal-portfolio, warm-approachable, clean-professional). The AI picked the closest archetype and everything downstream followed that bucket's patterns. Every photography portfolio landed in minimal-portfolio. Every business site landed in bold-saas. The buckets became the ceiling.

### Decision

Replace archetypes with concrete layout decisions in the design brief output:

- `heroStyle`: one of full-bleed-cover, split-layout, typography-hero, centered-minimal
- `headerStyle`: one of transparent-overlay, solid-bar, minimal-centered
- `sectionsOrder`: array of section names in homepage order
- `visualTension`: 1-2 sentences describing what creates visual interest

These are specific compositional decisions, not style labels. The markup generation calls receive these decisions as direct instructions and execute them — not interpret a label.

### Consequences

- No two themes have the same homepage structure unless the AI makes identical decisions
- The `visualTension` field gives the AI permission to be specific about design choices
- Removed the 5-bucket ceiling — the AI can make any combination of layout decisions

---

## ADR-003: AIProvider Interface — complete() Method

**Status:** Accepted
**Date:** March 2026

### Context

The original `AIProvider` interface had a `generateDesignSpec()` method — tightly coupled to the single-call architecture. Moving to a 4-step pipeline required the interface to support arbitrary system/user prompt pairs.

### Decision

Replace `generateDesignSpec()` with a single `complete(systemPrompt, userMessage)` method. The pipeline calls this method 4 times with different prompts. Both `AnthropicProvider` and `GeminiProvider` implement this method plus `iterateTheme()` for the iteration feature.

### Consequences

- Provider swap remains a config change
- The interface is now truly generic — adding a 5th pipeline step requires no interface changes
- Each provider implements retry logic with exponential backoff independently

---

## ADR-004: Deterministic theme.json From Design Brief

**Status:** Accepted
**Date:** March 2026

### Context

Early versions asked the AI to generate `theme.json` as part of the pipeline. This produced inconsistent results — color slugs in the JSON didn't always match slugs used in the markup, font size definitions varied, spacing scale was inconsistent.

### Decision

Build `theme.json` deterministically from the design brief's color and typography tokens in `assembler.ts`. The assembler uses luminance detection to derive background/text/accent slug assignments, ensuring WCAG-aware color application. Font sizes and spacing scales are fixed and consistent across all themes.

### Consequences

- Color slug consistency guaranteed — markup and theme.json always use the same slugs
- No AI call needed for theme.json — faster, more reliable
- Fixed font size scale (small/medium/large/x-large/xx-large/huge) and spacing scale (20/40/60/80/120/160) that markup generation prompts reference explicitly

---

## ADR-005: pnpm Monorepo with Shared Types Package

**Status:** Accepted  
**Date:** March 2026

### Context

Client and server both need `ThemeManifest`, `BlockTemplate`, validators, and constants. Without a shared package, types drift apart — the client expects `templateParts` but the server sends `template_parts`.

### Decision

Three packages: `@wp-theme-gen/shared` (types, validators, constants), `@wp-theme-gen/server`, `@wp-theme-gen/client`. Both server and client declare shared as a workspace dependency.

### Consequences

- Single source of truth for all types and validators
- TypeScript compiler catches client/server mismatches at build time
- `pnpm -r test` / `typecheck` / `lint` run across all packages

---

## ADR-006: Stack-Based Block Markup Validator

**Status:** Accepted
**Date:** March 2026

### Context

WordPress block markup uses HTML comment syntax that must be properly nested. Standard HTML parsers skip comments. We need structural validation of the comment-based block tree.

### Decision

Three-pass validator: (1) forbidden block scan for `wp:html` and similar, (2) stack-based nesting validator that pushes/pops block opens/closes and catches mismatches and unclosed blocks, (3) allowlist check against ~106 known core blocks.

### Consequences

- Catches structural errors in AI-generated markup before packaging
- Cannot catch semantic errors (wrong post type in query, invalid attribute values)
- Allowlist needs updates as WordPress adds new core blocks

---

## ADR-007: Security Considerations

**Status:** Accepted
**Date:** March 2026

### Decisions Made

- **Prompt injection:** Strip HTML tags and known injection patterns from user input before inclusion in prompts. System prompts use role-locking language.
- **Path traversal:** Theme slugs validated with strict regex before use in file paths.
- **API keys:** Never returned to client. Server-only environment variables.
- **Rate limiting:** 5 generations per 15 minutes per IP.
- **Input validation:** Zod on all API inputs. Description capped at 1000 characters.
- **Error responses:** Stack traces never included in HTTP responses.

---

## ADR-008: Design Quality — Making AI Produce Non-Generic Output

**Status:** Accepted
**Date:** March 2026

### Context

LLMs default to safe, generic output. Without explicit guidance, themes converge on the same patterns — navy/white/orange palettes, system fonts, centered text everywhere, full-width color blocks for every section.

### Decisions Made

1. **Concrete design decisions over labels** — the design brief produces `heroStyle: "typography-hero"` not `archetype: "minimal"`. The AI executes a specific layout decision, not a vague style.

2. **Layout discipline in markup prompts** — the homepage prompt explicitly forbids centering everything, requires varied section backgrounds, specifies that post card titles go below images not on top, and requires the query loop grid on `wp:post-template` not `wp:query`.

3. **Distinctive color palettes** — the design brief prompt forbids default WordPress blue (#0073aa) and requires the accent to have 4.5:1 contrast against base. Surface must be noticeably different from base. No two colors may share the same hex.

4. **Specific Google Font pairings** — the prompt provides 7 curated pairings and explicitly forbids generic system fonts.

5. **Copy with personality** — heroHeadings must be 4-10 words with a point of view, never "Welcome to...". ctaButtonText must be a specific action, never "Learn More" or "Get Started".

### Consequences

- Output is non-deterministic but consistently higher quality than generic defaults
- The layout discipline rules (left-align body text, vary backgrounds) were the single highest-impact change to visual quality
- Some variance remains — the AI occasionally reverts to generic patterns, which is why the prompts include explicit forbidden examples
