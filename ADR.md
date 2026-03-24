# Architectural Decision Records

This document captures the key architectural decisions made during development of the WP Theme Generator, including context, alternatives considered, and trade-offs accepted.

---

## ADR-001: Two-Pass AI Generation

**Status:** Accepted
**Date:** March 2026

### Context

Early prototypes used a single AI prompt that asked Claude to simultaneously decide on design aesthetics (colors, typography, spacing, mood) AND produce syntactically correct WordPress block markup for 10+ files. The results were inconsistent: the model would pick safe, generic design choices (blue/white, system sans-serif) to conserve its "attention budget" for the harder task of producing valid block markup. Alternatively, it would produce creative designs but with malformed template nesting.

The fundamental problem is that design reasoning and markup generation are cognitively different tasks. Mixing them in one prompt forces the model to context-switch constantly, degrading both outputs.

### Decision

Separate generation into two sequential API calls:

- **Pass 1 (Design Spec):** Given user input (site description, type, color preferences), produce a JSON design specification containing: color palette with semantic names, font families, spacing scale, layout preferences, and a *design narrative* — a paragraph describing the aesthetic in evocative, specific language.
- **Pass 2 (Theme Manifest):** Given the design spec from Pass 1 plus the CORE_BLOCKS allowlist, block markup examples, and ThemeManifest schema, produce the complete theme: all templates, template parts, patterns, colors, and typography.

The design narrative from Pass 1 is the bridge — it gives Pass 2 a creative brief to follow rather than making design decisions on the fly.

### Alternatives Considered

1. **Single-pass with strict JSON schema constraints** — Constrained decoding (via Anthropic's tool use or JSON mode) could enforce output structure, but cannot enforce *quality* of design decisions. The model still defaults to generic choices when the structural constraints are demanding.
2. **XML output format** — XML is more natural for nested markup, but WordPress block markup is specifically HTML-comment-based. Translating XML to block comments adds a fragile conversion layer.
3. **Streaming generation with validation checkpoints** — Generate file-by-file, validating each before proceeding. Theoretically sound but dramatically increases API round-trips (10+ calls per theme) and loses cross-file design coherence.

### Consequences

- Token cost and latency are roughly 2x compared to single-pass (two API calls instead of one)
- Output quality is dramatically more consistent — design decisions are coherent across all files because Pass 2 works from an explicit spec rather than improvising
- Debugging is easier: when a theme looks wrong, you can inspect the Pass 1 output to determine whether the design spec or the markup generation is at fault
- The design narrative technique proved to be the single most impactful change for output quality — it transforms the model from "generate a generic theme" to "express this specific aesthetic"

---

## ADR-002: AIProvider Interface for Swap Pattern

**Status:** Accepted
**Date:** March 2026

### Context

The project specification explicitly requires that "swapping the AI provider should not be a major rewrite." This implies an abstraction layer between the application logic and the specific AI SDK.

### Decision

Define an `AIProvider` TypeScript interface with three methods:

```typescript
interface AIProvider {
  generateDesignSpec(input: GenerateRequest): Promise<DesignSpec>
  generateThemeManifest(spec: DesignSpec, input: GenerateRequest): Promise<ThemeManifest>
  iterateTheme(manifest: ThemeManifest, instruction: string): Promise<Partial<ThemeManifest>>
}
```

A factory function `createAIProvider()` reads the `AI_PROVIDER` environment variable and returns the corresponding implementation. The Anthropic implementation is fully built; OpenAI and Local stubs exist to demonstrate the swap pattern.

### Alternatives Considered

1. **Direct Anthropic SDK calls everywhere** — Simplest initially, but provider swap requires finding and replacing every SDK call site. Violates the spec requirement.
2. **Strategy pattern with runtime dependency injection** — More flexible but over-engineered for three methods. The factory function achieves the same goal with less abstraction.
3. **Separate npm packages per provider** — Each provider as its own package with a shared interface. Clean separation but unnecessary overhead for a project where only one provider is fully implemented.

### Consequences

- Minor indirection cost (one factory function, one interface) but provider swap is genuinely a config change: set `AI_PROVIDER=openai` and implement the three methods
- Enables future A/B testing of providers on the same input
- The interface naturally documents what each provider must support

---

## ADR-003: pnpm Monorepo with Shared Types Package

**Status:** Accepted
**Date:** March 2026

### Context

This is a full-stack TypeScript application where the client and server both need to understand the `ThemeManifest` type, validation rules, and constants like `CORE_BLOCKS`. In a two-package setup without shared types, these definitions drift apart over time — the client expects `templateParts` but the server sends `template_parts`, causing runtime bugs that TypeScript cannot catch.

### Decision

Use pnpm workspaces with three packages:

- `packages/shared` (`@wp-theme-gen/shared`) — all types, validators, constants
- `packages/server` (`@wp-theme-gen/server`) — imports from shared
- `packages/client` (`@wp-theme-gen/client`) — imports from shared

Both client and server declare `@wp-theme-gen/shared` as a workspace dependency. TypeScript's project references ensure that changing a type in shared immediately surfaces errors in consuming packages.

### Alternatives Considered

1. **Separate repositories with published shared npm package** — Proper for large teams but adds CI/CD complexity for a solo project. Publishing and versioning a shared package for two consumers is overhead without benefit here.
2. **Single package with co-located client/server code** — Simpler initially but loses the ability to deploy client and server independently. Also makes it harder to reason about what code runs where.
3. **No sharing — duplicate types in client and server** — The fastest path to "working" but guarantees type drift. Validation logic would need to be duplicated or omitted from the client entirely.

### Consequences

- Single source of truth for `ThemeManifest`, `BlockTemplate`, `ColorPaletteEntry`, all validators
- TypeScript compiler catches client/server mismatches at build time, not at runtime
- Slightly more complex initial setup (workspace config, package.json references)
- `pnpm -r test` / `pnpm -r typecheck` / `pnpm -r lint` run across all packages in one command

---

## ADR-004: Anthropic Claude over OpenAI

**Status:** Accepted
**Date:** March 2026

### Context

The generator needs an LLM that can reliably produce large, structured JSON outputs containing WordPress block markup. The Pass 2 prompt is substantial: it includes the design spec from Pass 1, the full CORE_BLOCKS allowlist (~60 blocks), block markup examples, and the ThemeManifest JSON schema. The output is a single JSON object containing 10-15 files of nested block markup. This demands strong instruction-following over long context windows.

### Decision

Use Claude claude-sonnet-4-5 as the primary AI provider.

### Alternatives Considered

1. **GPT-4o** — Strong general capability but less consistent on deeply nested JSON at this scale. In testing, GPT-4o would occasionally produce valid JSON with invalid block markup nesting, or truncate long template files. The instruction-following for "never use wp:html" was also less reliable.
2. **Local models via Ollama** — Insufficient instruction-following for valid block markup generation. Even the best local models (Llama 3, Mixtral) struggle with the structural constraints of WordPress block comments at the scale of a full theme.
3. **Google Gemini** — Strong structured output capabilities but less WordPress ecosystem alignment. Automattic's March 2026 launch of the official Claude Connector for WordPress.com signals strategic alignment between Anthropic and the WordPress ecosystem.

### Consequences

- Dependency on Anthropic API availability and pricing
- The AIProvider interface (ADR-002) mitigates vendor lock-in
- Claude claude-sonnet-4-5 handles the large Pass 2 context window well and follows the "no wp:html" constraint reliably
- Token costs are meaningful (~$0.10-0.30 per generation depending on theme complexity)

---

## ADR-005: Stack-Based Block Markup Validator

**Status:** Accepted
**Date:** March 2026

### Context

WordPress block markup uses HTML comment syntax (`<!-- wp:group -->...<!-- /wp:group -->`) that must be properly nested. This is structurally similar to XML nesting but lives inside HTML comments, which standard HTML parsers ignore. AI-generated markup frequently has nesting errors: unclosed blocks, mismatched open/close pairs, or blocks nested inside blocks that don't support inner blocks.

### Decision

Implement a three-pass validator:

1. **Forbidden block scan** — regex check for `wp:html`, `wp:freeform`, and other blocks that bypass the block editor. These indicate the AI took a shortcut instead of using proper core blocks.
2. **Stack-based nesting validator** — parse block comments sequentially, pushing opening blocks onto a stack and popping on close. Catch mismatches (closing `wp:group` when `wp:column` is on top), unclosed blocks (non-empty stack at EOF), and unexpected closes (empty stack on close tag).
3. **Allowlist check** — every block name must exist in the `CORE_BLOCKS` set. Catches hallucinated blocks like `wp:hero-section` or `wp:custom-layout` that the AI sometimes invents.

Each error includes the file path, line number, block name, severity (fatal/warning), and a human-readable suggestion for fixing it.

### Alternatives Considered

1. **Regex-only validation** — Can catch forbidden blocks and verify individual block syntax, but fundamentally cannot validate nesting depth. A regex cannot determine that `<!-- /wp:group -->` closes the wrong block when there are multiple nested groups.
2. **Full HTML parser (e.g., parse5, htmlparser2)** — These parsers treat HTML comments as irrelevant content to skip, which is the opposite of what we need. We specifically need to parse the comments and ignore the HTML.
3. **WordPress PHP validation** — Running the markup through WordPress's `parse_blocks()` PHP function would be authoritative, but requires a PHP runtime or a WordPress instance. Adding this dependency for validation alone is disproportionate. (WordPress Playground could serve this role in the future — see NEXT.md.)

### Consequences

- Catches the most common AI generation errors before they reach the packager
- Diagnostic errors are actionable: "Unclosed block wp:group at line 14 in templates/index.html"
- Cannot catch semantic errors (e.g., a `wp:query` block that queries the wrong post type) — only structural errors
- The allowlist needs manual updates when WordPress adds new core blocks (currently ~60 blocks)

---

## ADR-006: Style Variations as First-Class Output

**Status:** Accepted
**Date:** March 2026

### Context

WordPress theme.json supports style variations — alternative color/typography schemes stored as JSON files in a `styles/` directory. Users can switch between them in the Site Editor without changing the theme. Most AI-generated themes deliver a single design, leaving users with no alternatives unless they regenerate entirely.

### Decision

Every generated theme includes 3 style variations by default:

1. **Dark mode** — inverts the base palette luminance
2. **High-contrast** — adjusts all color pairs to meet WCAG AA contrast ratios (4.5:1 minimum)
3. **AI-designed** — a third variation whose name and palette come from the Pass 1 design narrative

The assembler generates each variation as a separate `styles/*.json` file with the correct theme.json v3 schema.

### Alternatives Considered

1. **Single theme.json only** — Simpler but delivers less value. Users who want alternatives must regenerate.
2. **User-triggered variation generation** — "Generate more variations" button that makes additional API calls. Gives users control but increases cost and latency.
3. **Variation as a separate API call** — Decouple variation generation from theme generation. Cleaner separation but means the base theme ships without variations, and users may never discover the feature.

### Consequences

- Increases Pass 2 prompt complexity and output size (3 additional JSON objects per theme)
- Each generated theme is immediately more valuable — users get a design *system*, not just a design
- The high-contrast variation provides accessibility value out of the box
- Dark mode variation quality depends on the base palette — some color schemes don't invert cleanly

---

## ADR-007: Security Considerations

**Status:** Accepted
**Date:** March 2026

### Context

The application accepts user text input, passes it to an AI model, receives generated code, and packages it into downloadable files. Each step in this pipeline has security implications.

### Decision

Implement defense-in-depth across the pipeline:

- **Prompt injection mitigation:** User input is sanitized before inclusion in AI prompts. HTML tags are stripped, and known injection patterns (`ignore previous instructions`, `system:`, `<|im_start|>`) are removed. The system prompt uses role-locking language. This doesn't guarantee safety against all prompt injection but raises the bar significantly.
- **Theme slug path traversal prevention:** Theme slugs are validated with a strict regex (`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`) before being used in file paths. This prevents directory traversal via slugs like `../../etc/passwd`.
- **API key handling:** The Anthropic API key lives in the server's `.env` file and is never returned to the client. No endpoint exposes configuration or environment variables.
- **ZIP content safety:** All file contents in the ZIP are AI-generated text (CSS, JSON, HTML, PHP pattern headers). No user-uploaded binary files are included. The ZIP is assembled server-side using the `archiver` library with known file paths.
- **Rate limiting:** `POST /api/generate` is rate-limited to 5 requests per 15 minutes per IP using `express-rate-limit`. This prevents API cost abuse.
- **Stack trace sanitization:** The error handler middleware never includes stack traces in HTTP responses, even in development. Error responses follow a consistent `{ error: true, code: string, message: string }` shape.

### Alternatives Considered

1. **LLM output sandboxing** — Running generated theme code in a sandboxed environment before packaging. Valuable for production but disproportionate complexity for this scope. WordPress Playground partially serves this role for preview.
2. **Content Security Policy headers** — The client serves from Vite's dev server and loads WordPress Playground in a cross-origin iframe. Strict CSP would break Playground's WebAssembly loading. A more nuanced CSP policy is needed for production.
3. **User authentication** — Not implemented. All operations are anonymous and session-based. Production deployment would add authentication to associate themes with user accounts and enforce per-user rate limits.

### Consequences

- The application is defensively coded against the most common attack vectors for AI-powered code generation tools
- No security measure is absolute — prompt injection mitigation is best-effort, not guaranteed
- The lack of authentication means rate limiting is IP-based, which is imprecise (shared IPs, VPNs)
- ZIP contents are trusted because we control the generation pipeline end-to-end — there is no user file upload path

---

## ADR-008: Design Creativity — Making AI Non-Generic

**Status:** Accepted
**Date:** March 2026

### Context

LLMs default to generic, safe outputs. Without explicit guidance, generated WordPress themes converge on the same archetype: blue primary color, white background, system sans-serif font, full-width hero with stock-photo-style placeholder text, three-column feature grid. This is technically correct but creatively worthless.

The challenge is that "be creative" is not a useful instruction — it produces randomness, not quality. We need the model to be *specifically* creative within the constraints of valid WordPress block themes.

### Decision

Four techniques work together to push output quality beyond generic:

1. **Negative examples in Pass 1:** The design spec prompt explicitly prohibits common generic choices: "Do NOT use: blue/white corporate palette, system sans-serif as the only font, minimal white space with no personality, generic tech-startup aesthetics." This forces the model to explore outside its default distribution.

2. **Design narrative as creative constraint:** Pass 1 produces a *narrative* — not just color codes and font names, but a paragraph like "This theme evokes a dimly lit jazz club: deep burgundy backgrounds, warm amber accents, serif headings that feel hand-set, generous spacing that lets each element breathe." This narrative is injected into Pass 2, giving the markup generator a creative brief to follow rather than making aesthetic decisions on the fly.

3. **Negative examples in Pass 2:** The template generation prompt includes examples of what NOT to produce: "Do not generate templates that look like Bootstrap defaults. Do not use wp:html for any layout that can be achieved with wp:group, wp:columns, or wp:cover."

4. **Style variations as exploration:** By requiring 3 style variations, the model must explore the design space beyond a single palette. The third variation is named after the design narrative (e.g., "Jazz Club After Hours"), which anchors the creative exploration to the theme's identity.

### Alternatives Considered

1. **Fine-tuning on high-quality themes** — Training a model on curated WordPress themes would embed design taste directly. But fine-tuning is expensive, not portable across model providers, and creates a static design aesthetic that doesn't adapt to user input.
2. **Curated template library** — Pre-design 50 theme templates and let the AI pick/customize one. Reliable but defeats the purpose of generation — users get variations on existing themes, not truly new ones.
3. **User-provided design references** — Let users upload screenshots or provide URLs of sites they like. Powerful but adds friction and raises copyright questions. Better suited as a future enhancement than a core feature.

### Consequences

- Output is non-deterministic but consistently higher quality than unconstrained generation
- The design narrative technique is the most impactful single change — removing it causes immediate regression to generic output
- Negative examples slightly increase prompt size but dramatically reduce "boring" outputs
- Some users may want generic/corporate themes — the current approach makes these harder to generate intentionally. A future "style preset" option could address this.
