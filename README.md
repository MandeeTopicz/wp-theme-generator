# WP Theme Generator

An AI-powered WordPress Block Theme generator that turns natural language descriptions into complete, installable WordPress themes with live preview.

Built as an Automattic coding challenge submission, this project explores how generative AI can produce high-quality WordPress Full Site Editing (FSE) themes from plain English descriptions. Users describe what they want across a 6-step form and receive a production-ready block theme — complete with style variations, validated markup, and a live WordPress preview powered by WordPress Playground.

## What It Does

- **Natural language to complete WordPress Block Theme** — describe your site and get a full theme with templates, template parts, patterns, and theme.json
- **4-step AI generation pipeline** — the AI makes sequential, focused calls: design brief → header/footer → homepage → inner page templates. Each step builds on the previous, producing coherent, distinctive output
- **Live preview via WordPress Playground** — renders the generated theme in a real browser-based WordPress instance using WebAssembly
- **Zero `wp:html` blocks** — enforced by a stack-based block markup validator
- **Style variations** — dark and light variations per theme
- **Download as installable ZIP** — drop into any WordPress 6.0+ site via Appearance > Themes > Upload
- **Iteration** — modify generated themes with natural language instructions
- **SSE streaming** — real-time progress as each pipeline step completes
- **153 tests passing** (`pnpm test` across shared, server, and client) — validators, assembler, packager, AI layer, routes, and integration tests

## Prerequisites

- Node.js 20+
- pnpm 10+
- An Anthropic API key (default) or Gemini API key

## Setup

```bash
git clone https://github.com/MandeeTopicz/wp-theme-generator.git
cd wp-theme-generator
pnpm install
cp .env.example packages/server/.env
# Add your API key to packages/server/.env
# Default provider is Anthropic: set ANTHROPIC_API_KEY
# Or use Gemini: set AI_PROVIDER=gemini and GEMINI_API_KEY
```

## Running

```bash
pnpm dev
# Client: http://localhost:5173
# Server: http://localhost:3001
```

Or separately:

```bash
# Terminal 1
pnpm --filter @wp-theme-gen/client dev

# Terminal 2
pnpm --filter @wp-theme-gen/server dev
```

## Testing

```bash
pnpm test          # all unit + integration tests
pnpm typecheck     # TypeScript across all packages
pnpm lint          # ESLint across all packages
```

## Architecture

### Monorepo Structure

```
packages/
  shared/    @wp-theme-gen/shared — types, validators, constants
  server/    @wp-theme-gen/server — Express API, AI pipeline, theme assembler
  client/    @wp-theme-gen/client — React + Vite frontend, Playground preview
```

### Generation Pipeline

The core of the application is a 4-step sequential AI pipeline in `packages/server/src/theme/pipeline.ts`:

**Step 1 — Design Brief**
A single AI call produces a structured design brief: color system (6 colors with semantic roles: base, surface, foreground, muted, accent, accent-foreground), typography (2 Google Font pairings), layout personality (heroStyle, headerStyle, sectionsOrder, visualTension), and all copy strings. Critically, this step makes concrete layout decisions — not archetype labels — that inform all subsequent steps.

**Step 2 — Header + Footer**
A focused AI call generates `header.html` and `footer.html` template parts using the design brief's color slugs and typography. The system prompt contains explicit structural rules and a concrete example of correct block markup.

**Step 3 — Homepage**
A focused AI call generates `index.html` and `hero.php` using the full design brief. The prompt enforces real-website layout principles: left-aligned body text, varied section backgrounds, correct post card structure (image above title), and proper query loop grid layout.

**Step 4 — Inner Page Templates**
A focused AI call generates `single.html`, `page.html`, `archive.html`, and `404.html`.

After the pipeline completes, `theme.json` and `style.css` are built deterministically from the design brief's color and typography tokens by `assembler.ts` — ensuring consistent design token application regardless of what the AI generated in the markup.

### Why Sequential Focused Calls

Early versions used a single AI call to generate everything, then a hybrid approach with static skeleton templates. Both failed for the same reason: the AI either lost coherence over long outputs, or the static templates produced visually generic results regardless of the user's input.

The sequential pipeline solves this by keeping each call small and focused. The AI doesn't need to hold the entire theme in context — it only needs to know the design brief and generate one component at a time. Each call is specific enough that the AI can apply real design judgment rather than defaulting to safe, generic patterns.

### Key Files

| File | Purpose |
|------|---------|
| `packages/server/src/ai/promptBuilder.ts` | System and user prompts for all 4 pipeline steps |
| `packages/server/src/theme/pipeline.ts` | Orchestrates the 4 AI calls, typed progress callbacks |
| `packages/server/src/ai/outputParser.ts` | Zod validators and recovery logic for each step's output |
| `packages/server/src/theme/assembler.ts` | Builds theme.json, style.css, wraps template files |
| `packages/server/src/theme/packager.ts` | Assembles and zips the final theme |
| `packages/shared/src/validation/` | Block markup validator, theme.json validator, slug validator |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (if using Anthropic) | Anthropic API key (default provider) |
| `GEMINI_API_KEY` | Yes (if using Gemini) | Google Gemini API key |
| `AI_PROVIDER` | No | `anthropic` (default) or `gemini` |
| `CLAUDE_MODEL` | No | Claude model ID (default `claude-sonnet-4-20250514`) |
| `GEMINI_MODEL` | No | Gemini model ID (default `gemini-2.5-flash`) |
| `PORT` | No | Server port (default 3001) |

## Known Limitations

- **Generation takes 60-120 seconds** — 4 sequential AI calls with full theme generation per call
- **WordPress Playground takes 15-30 seconds to boot** on first load
- **No WooCommerce template support** — store templates not generated
- **Hero background images** — the cover block is generated without a background image URL; users add their own via the WordPress editor
- **Font loading** — themes reference Google Fonts by name; WordPress handles loading via theme.json declarations
