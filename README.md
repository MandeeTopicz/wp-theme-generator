# WP Theme Generator

An AI-powered WordPress Block Theme generator that turns natural language descriptions into complete, installable WordPress themes with live preview.

Built as an Automattic coding challenge submission, this project explores how generative AI can lower the barrier to WordPress Full Site Editing (FSE) theme development. Instead of requiring knowledge of theme.json schemas, block markup syntax, and template hierarchy, users describe what they want in plain English and receive a production-ready block theme — complete with style variations, validated markup, and a live WordPress preview powered by WordPress Playground. The goal aligns with WordPress's core mission: democratizing publishing by making theme creation accessible to anyone.

## What It Does

- **Natural language to complete WordPress Block Theme** — describe your site and get a full theme with templates, template parts, patterns, and theme.json
- **Two-pass Claude AI generation** — Pass 1 generates a design spec (colors, typography, layout narrative), Pass 2 uses that spec to produce all theme files with consistent design language
- **Live preview via WordPress Playground** — renders the generated theme in a real browser-based WordPress instance using WebAssembly, no server required
- **Iteration chat with diff view** — type "make the header darker" and see exactly which files changed, with line-level diffs
- **Zero `wp:html` blocks** — enforced by a stack-based block markup validator that catches nesting errors, forbidden blocks, and invalid attributes
- **3 style variations per theme** — dark mode, high-contrast (WCAG AA), and an AI-designed variation named after the design narrative
- **Download as installable ZIP** — drop it into any WordPress 6.0+ site via Appearance > Themes > Upload

## Prerequisites

- Node.js 20+
- pnpm 10+
- An Anthropic API key (claude-sonnet-4-5)

## Setup

```bash
git clone https://github.com/MandeeTopicz/wp-theme-generator.git
cd wp-theme-generator
pnpm install
cp .env.example packages/server/.env
# Add ANTHROPIC_API_KEY to packages/server/.env
```

## Running

```bash
# Terminal 1 — client
pnpm --filter @wp-theme-gen/client dev

# Terminal 2 — server
pnpm --filter @wp-theme-gen/server dev

# Open http://localhost:5173
```

## Testing

```bash
pnpm test          # all unit + integration tests
pnpm typecheck     # TypeScript across all packages
pnpm lint          # ESLint across all packages
```

The test suite covers:

- **packages/shared** (49 tests) — theme slug validation, theme.json schema validation, block markup nesting/allowlist/forbidden-block checks, query loop validation, color contrast ratio calculations, and the top-level `validateTheme` orchestrator
- **packages/server** (64 tests) — theme assembler (style.css generation, theme.json with styles block, template wrapping, pattern PHP headers, style variations), ZIP packager (archive structure, file contents), AI layer (prompt builder, output parser with JSON extraction, provider interface, Anthropic retry/backoff logic), Express routes (generate, download, iterate, validate endpoints), middleware (error handler, rate limiter, sanitizer)
- **packages/client** (4 tests) — hook exports, App module structure, ThemeForm module structure, routing configuration

## Architecture

### Monorepo Structure

```
packages/
  shared/    @wp-theme-gen/shared — types, validators, constants
  server/    @wp-theme-gen/server — Express API, AI layer, theme assembler
  client/    @wp-theme-gen/client — React + Vite frontend, Playground preview
```

**packages/shared** is the single source of truth for `ThemeManifest`, `BlockTemplate`, `ColorPaletteEntry`, and all validation logic. Both client and server import from `@wp-theme-gen/shared`, so type drift between frontend and backend is caught at compile time. The validators here enforce WordPress block markup rules: no `wp:html` blocks, proper comment nesting via a stack-based parser, block names checked against a `CORE_BLOCKS` allowlist, and theme.json structure validated with Zod schemas.

**packages/server** is an Express API with four routes: `POST /api/generate` (two-pass AI generation + assembly + ZIP), `POST /api/iterate` (AI-powered theme modification), `POST /api/validate` (standalone validation), and `GET /api/download/:sessionId` (ZIP delivery). The AI layer defines a provider interface (`AIProvider`) with a factory function that reads `AI_PROVIDER` from the environment, making provider swaps a config change. The theme assembler builds `style.css`, `theme.json` (with styles block for proper background/text colors), template files (with skip-link + header/footer parts), pattern files (with PHP registration headers), and style variations.

**packages/client** is a React 18 + Vite app with Tailwind CSS. The multi-step form wizard collects theme requirements across 5 steps (description, identity, typography, layout, review). On submit, it navigates immediately to the result page (no waiting for the API) where a generation context tracks progress. The result page has a two-panel layout: left sidebar (file tree, download, iterate chat, validation summary) and main content area with tabs (Live Preview via WordPress Playground, Design System, Validation). Files can be inspected in a slide-over panel with syntax highlighting and diff view after iterations.

### Generation Pipeline

User input flows through a 5-step form that collects site description, theme name/slug, color preferences, typography choices, and layout options. On submit, the server runs **Pass 1**: a Claude prompt that produces a design specification — a JSON object containing color palette (with semantic names), font families, spacing scale, and a design narrative that describes the aesthetic in evocative language. This narrative is the key to non-generic output.

**Pass 2** receives the design spec as context along with the full `CORE_BLOCKS` allowlist, block markup examples, and the `ThemeManifest` JSON schema. Claude generates the complete manifest: all templates (`index.html`, `single.html`, `page.html`, `404.html`, `search.html`, `archive.html`), template parts (`header.html`, `footer.html`), patterns, and color/typography definitions.

The manifest is then validated (slug format, theme.json schema, block markup nesting/allowlist), assembled into files (with skip links, header/footer part references, pattern PHP headers), packaged into a ZIP with correct directory structure, and stored in the OS temp directory keyed by session ID. The client receives the manifest and validation result, renders the result page, and optionally boots WordPress Playground to show a live preview with the theme installed and sample content seeded.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `PORT` | No | Server port (default 3001) |
| `AI_PROVIDER` | No | AI provider: `anthropic` / `openai` / `local` (default `anthropic`) |

## Known Limitations

- **Style variations sometimes need regeneration** to get truly distinct palettes — the AI occasionally produces variations that are too similar to the base theme
- **WordPress Playground takes 15-30 seconds to boot** on first load — this is inherent to loading a full WordPress instance via WebAssembly in the browser
- **Generated templates use seeded sample content for preview** — real site content will look different; the preview is a demonstration of the theme's design, not a representation of the user's actual content
- **No WooCommerce template support yet** — `shop.html`, `single-product.html`, `cart.html`, and `checkout.html` are not generated
- **Rate limited to 5 generations per 15 minutes per IP** — this is a safety measure for the API cost; production deployment would need a proper job queue
- **The iteration feature regenerates affected files** but cannot do fine-grained block-level edits — asking to "change the heading font size in the hero pattern" will regenerate the entire pattern file, not surgically edit one attribute
- **Font loading depends on system/Google Fonts availability** — generated themes reference font families by name but don't bundle font files; WordPress handles loading via theme.json font-face declarations in production
