# What I'd Do Next

A prioritized roadmap for the WP Theme Generator, organized by time horizon. These are specific to the unique challenges of AI-powered file generation — not generic engineering improvements.

---

## If I Had Another Week

### 1. WordPress Playground as the Primary Validation Surface (P0)

Right now we validate block markup with a regex scanner and stack-based nesting parser. This catches structural errors — unclosed blocks, forbidden `wp:html`, hallucinated block names — but it cannot answer the most important question: **does the theme actually render?**

A theme can be structurally valid and still produce a blank page, a broken layout, or invisible text. The only true validation is whether WordPress renders it correctly. The next step is to run the generated theme through WordPress Playground programmatically (headless, no UI) and evaluate the result:

- Boot Playground in a Web Worker or Node.js context (via `@wp-playground/node`)
- Install the generated theme
- Navigate to the front page
- Check for fatal PHP errors in the response
- Optionally screenshot the result and compare against a baseline (no blank pages, no missing header/footer)

This closes the gap between "structurally valid" and "visually correct." A theme that renders a blank white page should be flagged as a generation failure and retried, even if every block comment is properly nested.

### 2. Formal block.json Schema Validation (P0)

Currently the allowlist check verifies that block names exist in the `CORE_BLOCKS` set. This confirms `wp:columns` is real but doesn't validate that `{"columns":5}` is a valid attribute for it.

WordPress ships a `block.json` schema for every core block that defines allowed attributes, their types, and default values. The next level of validation is:

- Bundle or fetch `block.json` for each core block
- When validating markup, parse the JSON attributes from each block comment
- Validate each attribute against the block's schema — catching `{"align":"invalid-value"}`, `{"level":"huge"}` (must be number), or missing required attributes
- Flag blocks with unknown attributes as warnings (the AI sometimes invents `{"customSpacing":"large"}`)

This would catch a significant class of errors that currently pass validation but cause rendering issues in WordPress.

### 3. WordPress Pattern Directory Registration (P1)

Generated patterns already have the correct PHP header format (`Title`, `Slug`, `Categories`, `Block Types`). They are valid pattern files that WordPress recognizes locally. But they aren't submitted to the WordPress Pattern Directory.

Adding a `POST /api/publish-patterns` endpoint would:

- Authenticate with the Pattern Directory API (requires a wordpress.org account)
- Submit each pattern with proper metadata
- Return the Pattern Directory URLs for the published patterns

This makes generated themes immediately discoverable by the entire WordPress ecosystem — not just the person who generated them.

### 4. Template Locking (P1)

Generated templates are fully editable in the Site Editor, which means end users can accidentally break the layout by deleting structural Group blocks or reordering template parts. Adding `"templateLock": "contentOnly"` to structural blocks in generated templates would:

- Allow content editing (text, images, links) within the locked structure
- Prevent deletion or reordering of structural layout blocks
- Make generated themes safe for client handoff

This is a critical feature for agencies generating themes for clients who will edit content but shouldn't modify structure.

### 5. WooCommerce Template Support (P1)

The generator currently produces 6 templates (index, single, page, 404, search, archive). WooCommerce requires additional templates: `shop.html`, `single-product.html`, `cart.html`, `checkout.html`, `order-confirmation.html`.

Implementation requires:

- Adding WooCommerce blocks to the `CORE_BLOCKS` allowlist (`woocommerce/product-collection`, `woocommerce/cart`, `woocommerce/checkout`, etc.)
- Extending the Pass 2 prompt with WooCommerce template examples
- Updating the assembler to place WooCommerce templates in the correct directory
- Adding a "Store" option to the site type selector in the form

This unlocks the e-commerce use case, which is significant for Automattic given WooCommerce's market position.

---

## To Make This Production-Ready

### Generation Queue and Job System

Each theme generation takes 60-120 seconds. The current implementation holds an HTTP connection open for the entire duration. This is fragile at scale — proxies timeout, clients disconnect, and a single slow generation blocks a server thread.

The production architecture is a job queue:

- `POST /api/generate` validates input, creates a job in Bull/BullMQ (backed by Redis), and returns `{ jobId }` immediately
- A pool of worker processes picks up jobs and runs the two-pass generation pipeline
- The client polls `GET /api/jobs/:jobId` for status, or subscribes to an SSE/WebSocket stream for real-time progress
- Progress events map to the UI steps: "Designing color system..." → "Generating templates..." → "Validating..." → "Packaging..."

This decouples request handling from generation, enables horizontal scaling of workers, and survives client disconnects.

### Result Storage

Generated ZIPs are currently stored in the OS temp directory with no explicit TTL — they're cleaned up by the OS eventually. This works for development but not for production.

Production needs:

- Object storage (S3, Cloudflare R2) for ZIP files with signed URLs for downloads
- A database (Postgres, SQLite) for generation metadata: session ID, manifest, validation result, creation timestamp, user account
- User accounts so people can return to previously generated themes
- Generation history with the ability to compare versions (especially useful with the iteration feature)
- Explicit TTL with cleanup: free-tier themes expire after 24 hours, authenticated users get persistent storage

### Formal Prompt Evaluation Pipeline

The prompt engineering in this project is currently evaluated manually: generate a theme, inspect the output, tweak the prompt, repeat. This is fine for initial development but doesn't scale.

Production needs an eval suite:

- A corpus of 20-30 theme descriptions covering diverse site types (blog, portfolio, restaurant, nonprofit, store)
- Expected properties for each: "must contain a query loop," "palette must have at least 6 colors," "must not use wp:html," "heading font must differ from body font," "WCAG AA contrast ratios must pass"
- An automated runner that generates themes from each description, validates against expectations, and produces a pass/fail report
- This runs on every prompt change, catching regressions before they ship

This is how you iterate on prompt quality at scale — manual testing catches obvious problems but misses subtle regressions across the distribution of possible inputs.

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
    "themeSlug": "string"
  }
}
```

This aligns with Automattic's own MCP strategy and makes the generator composable — an AI coding assistant could generate a theme, install it on a WordPress site, and populate it with content in a single conversation.

---

## The Hardest Unsolved Problem

The fundamental tension in AI-generated file systems is **reliability vs. creativity**.

Constraining the model heavily — strict JSON schemas, negative examples, CORE_BLOCKS allowlists, forbidden block lists — produces valid but sometimes uninspired output. The model plays it safe to satisfy all constraints, defaulting to simple layouts and conservative design choices.

Loosening constraints produces creative, surprising output — unusual color combinations, complex nested layouts, inventive pattern compositions — but occasionally broken output: unclosed blocks, hallucinated attributes, templates that render with invisible text or broken layouts.

The current approach tilts toward reliability: the validator catches structural errors, the assembler adds missing boilerplate (skip links, template part references), and the style system ensures visible text via theme.json styles. But the creative ceiling is limited by how tightly we constrain the model.

The right long-term solution is a **separate validation-and-repair layer**: let the model be creative in Pass 2, then run the output through a deterministic repair pipeline that fixes common errors without requiring a full regeneration:

- Unclosed block tags → auto-close at the end of the template
- Invalid attributes → strip unknown attributes, use defaults for invalid values
- Missing required blocks → inject with sensible defaults (e.g., add `wp:post-content` to `single.html` if missing)
- Contrast violations → adjust colors to meet WCAG AA minimums
- Hallucinated blocks → replace with the nearest valid core block (e.g., `wp:hero-section` → `wp:cover`)

This is analogous to how compilers emit warnings and attempt error recovery rather than halting on the first mistake. The model provides the creative intent; the repair layer ensures structural validity. This decoupling would allow us to loosen prompt constraints significantly, unlocking more creative output while maintaining the reliability guarantees that make generated themes actually installable.

Building this repair layer is the single highest-leverage investment for the next phase of this project.
