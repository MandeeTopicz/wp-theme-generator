# What I'd Do Next

A prioritized roadmap for the WP Theme Generator, organized by time horizon. These are specific to the unique challenges of AI-powered theme generation — not generic engineering improvements.

---

## If I Had Another Week

### 1. Theme Iteration via AI Markup Generation (P0)

The current architecture uses deterministic skeleton templates, which guarantees valid markup but doesn't support "make the header darker" style modifications. The highest-impact next feature is a hybrid approach:

- Keep the deterministic skeleton as the **base generation** path (fast, reliable)
- Add an **iteration endpoint** that takes the current manifest and a user instruction, then uses the AI to generate modified markup for specific files
- The AI receives the current template content + the instruction + the design spec, and returns updated content for only the affected files
- Validate the AI's output with the existing stack-based validator before accepting it
- If validation fails, show the user the errors and offer to retry or revert

This preserves the reliability of initial generation while unlocking the creative flexibility of AI-modified markup for refinements. The key insight is that modifying existing valid markup is easier for the AI than generating it from scratch — it has a concrete starting point.

### 2. WordPress Playground as the Primary Validation Surface (P0)

The stack-based validator catches structural errors — unclosed blocks, forbidden `wp:html`, hallucinated block names — but it cannot answer the most important question: **does the theme actually render?**

A theme can be structurally valid and still produce a blank page, a broken layout, or invisible text. The next step is to run the generated theme through WordPress Playground programmatically (headless, no UI) and evaluate the result:

- Boot Playground in a Web Worker or Node.js context (via `@wp-playground/node`)
- Install the generated theme
- Navigate to the front page
- Check for fatal PHP errors in the response
- Optionally screenshot the result and compare against a baseline (no blank pages, no missing header/footer)

This closes the gap between "structurally valid" and "visually correct."

### 3. More Skeleton Templates (P1)

The current 8 skeletons cover common patterns but miss important niches:

- **Store** — WooCommerce-aware with product grid, single-product, cart/checkout templates
- **Documentation** — sidebar navigation, hierarchical page structure, search-focused
- **Restaurant** — menu sections, hours, reservation CTA, map embed pattern
- **Event/Conference** — speaker grid, schedule, countdown hero, ticket CTA
- **Landing Page** — single-page, section-heavy, conversion-focused with multiple CTAs

Each skeleton is ~200-400 lines of hand-authored block markup. The investment is manual but the payoff is guaranteed reliability for each new site type.

### 4. Formal block.json Schema Validation (P1)

Currently the allowlist check verifies that block names exist in the `CORE_BLOCKS` set. This confirms `wp:columns` is real but doesn't validate that `{"columns":5}` is a valid attribute for it.

WordPress ships a `block.json` schema for every core block that defines allowed attributes, their types, and default values. The next level of validation is:

- Bundle or fetch `block.json` for each core block
- When validating markup, parse the JSON attributes from each block comment
- Validate each attribute against the block's schema
- Flag blocks with unknown attributes as warnings

### 5. Template Locking (P1)

Generated templates are fully editable in the Site Editor, which means end users can accidentally break the layout by deleting structural Group blocks or reordering template parts. Adding `"templateLock": "contentOnly"` to structural blocks would:

- Allow content editing (text, images, links) within the locked structure
- Prevent deletion or reordering of structural layout blocks
- Make generated themes safe for client handoff

---

## To Make This Production-Ready

### Generation Queue and Job System

Each theme generation involves an AI call that takes 10-30 seconds. The current implementation holds an HTTP connection open (SSE) for the duration. This works for moderate traffic but is fragile at scale — proxies timeout, clients disconnect, and a single slow generation blocks a server thread.

The production architecture is a job queue:

- `POST /api/generate` validates input, creates a job in Bull/BullMQ (backed by Redis), and returns `{ jobId }` immediately
- A pool of worker processes picks up jobs and runs the generation pipeline
- The client polls `GET /api/jobs/:jobId` for status, or subscribes to SSE/WebSocket for real-time progress
- This decouples request handling from generation, enables horizontal scaling of workers, and survives client disconnects

### Result Storage

Generated ZIPs are currently stored in the OS temp directory with no explicit TTL. Production needs:

- Object storage (S3, Cloudflare R2) for ZIP files with signed URLs for downloads
- A database (Postgres, SQLite) for generation metadata: session ID, manifest, validation result, creation timestamp, user account
- User accounts so people can return to previously generated themes
- Explicit TTL with cleanup: free-tier themes expire after 24 hours, authenticated users get persistent storage

### Formal Prompt Evaluation Pipeline

The prompt engineering is currently evaluated manually: generate a theme, inspect the design spec, tweak the prompt, repeat. Production needs an eval suite:

- A corpus of 20-30 theme descriptions covering diverse site types
- Expected properties for each: "palette must have at least 6 colors," "heading font must differ from body font," "WCAG AA contrast ratios must pass," "hero heading must not contain 'Welcome'"
- An automated runner that generates design specs from each description, validates against expectations, and produces a pass/fail report
- This runs on every prompt change, catching regressions before they ship

### MCP Integration

Expose the generation pipeline as an MCP (Model Context Protocol) tool so Claude, Cursor, and other MCP-compatible agents can call it directly:

```json
{
  "name": "generate_wordpress_theme",
  "description": "Generate a complete WordPress block theme from a description",
  "parameters": {
    "description": "string",
    "siteType": "string",
    "themeName": "string",
    "themeSlug": "string",
    "templateId": "string"
  }
}
```

This aligns with Automattic's own MCP strategy and makes the generator composable — an AI coding assistant could generate a theme, install it on a WordPress site, and populate it with content in a single conversation.

---

## The Hardest Unsolved Problem

The fundamental tension in AI-powered theme generation is **reliability vs. creative flexibility**.

The current architecture maximizes reliability: deterministic skeleton templates guarantee valid markup, and the AI is limited to generating a design spec (colors, typography, copy). Every theme installs and renders correctly. But layout variety is bounded by the 8 available skeletons.

A fully AI-generated approach maximizes flexibility: the AI can produce any layout, any block composition, any section structure. But markup quality is inconsistent — even the best models produce nesting errors, hallucinated blocks, or broken layouts in 20-30% of generations.

The right long-term solution is a **hybrid approach with a repair layer**:

1. **Keep deterministic skeletons as the reliable default** — users who want guaranteed results use the skeleton system
2. **Add an "experimental" AI-generated layout mode** — for users willing to accept some risk in exchange for unique layouts
3. **Build a deterministic repair pipeline** that fixes common AI markup errors without requiring regeneration:
   - Unclosed block tags → auto-close at the end of the template
   - Invalid attributes → strip unknown attributes, use defaults
   - Missing required blocks → inject with sensible defaults
   - Hallucinated blocks → replace with the nearest valid core block
   - Contrast violations → adjust colors to meet WCAG AA minimums

This is analogous to how compilers emit warnings and attempt error recovery rather than halting on the first mistake. The AI provides creative intent; the repair layer ensures structural validity. This would unlock more creative output while maintaining the reliability guarantees that make generated themes actually installable.

Building this repair layer — and deciding when to apply it vs. when to reject and retry — is the single highest-leverage investment for the next phase of this project.
