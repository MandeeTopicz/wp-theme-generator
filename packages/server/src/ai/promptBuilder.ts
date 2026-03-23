import type { GenerateRequest, ThemeManifest } from '@wp-theme-gen/shared'
import { coreBlocks, requiredFiles } from '@wp-theme-gen/shared'
import type { DesignSpec } from './provider'

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

const DESIGN_SPEC_SCHEMA = `interface DesignSpec {
  name: string
  slug: string
  colors: { name: string; slug: string; color: string }[]
  typography: {
    fontFamilies: { name: string; slug: string; fontFamily: string }[]
  }
  layout: { contentSize: string; wideSize: string }
  designNarrative: string
  styleVariations: {
    title: string
    slug: string
    colors: { name: string; slug: string; color: string }[]
  }[]
}`

const THEME_MANIFEST_SCHEMA = `interface ThemeManifest {
  name: string
  slug: string
  themeJson: unknown
  templates: { name: string; content: string }[]
  templateParts: { name: string; content: string }[]
  patterns: { name: string; content: string }[]
  files: string[]
  colors?: { name: string; slug: string; color: string }[]
  typography?: { fontFamilies: { name: string; slug: string; fontFamily: string }[] }
  layout?: { contentSize: string; wideSize: string }
}`

export function buildPass1SystemPrompt(): string {
  return `You are a senior WordPress Full Site Editing (FSE) theme designer with deep expertise in block themes, design systems, and modern web aesthetics.

Your output must be ONLY valid JSON matching the DesignSpec schema below — no prose, no markdown, no code fences.

Avoid overused patterns: blue/white corporate themes, generic sans-serif stacks, minimal white space with no personality. Your designs should feel like they came from a professional design agency.

DesignSpec TypeScript interface:
${DESIGN_SPEC_SCHEMA}`
}

export function buildPass1UserPrompt(request: GenerateRequest): string {
  const description = request.description
    ? stripHtml(request.description)
    : stripHtml(request.prompt)

  const parts = [`Design a WordPress block theme based on this description: ${description}`]

  if (request.siteType) {
    parts.push(`Site type: ${request.siteType}`)
  }
  if (request.targetAudience) {
    parts.push(`Target audience: ${request.targetAudience}`)
  }
  if (request.colorMode) {
    parts.push(`Color mode preference: ${request.colorMode}`)
  }
  if (request.accentColor) {
    parts.push(`Accent color: ${request.accentColor}`)
  }

  parts.push('Return ONLY the JSON object, nothing else.')

  return parts.join('\n')
}

export function buildPass2SystemPrompt(design: DesignSpec): string {
  const blockList = coreBlocks.map((b) => `  - ${b}`).join('\n')
  const fileList = requiredFiles.map((f) => `  - ${f}`).join('\n')

  return `You are a senior WordPress FSE theme developer generating a complete ThemeManifest.

Design context:
${JSON.stringify(design, null, 2)}

Design narrative: ${design.designNarrative}

ALLOWED CORE BLOCKS:
${blockList}

CORRECT block markup examples:

1. Navigation:
<!-- wp:navigation {"overlayMenu":"mobile"} /-->

2. Hero with cover block:
<!-- wp:cover {"dimRatio":50} -->
<div class="wp-block-cover__inner-container">
<!-- wp:heading {"level":1} -->
<h1>Welcome</h1>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Subtitle text here</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:cover -->

3. Query loop:
<!-- wp:query -->
<!-- wp:post-template -->
<!-- wp:post-title /-->
<!-- wp:post-excerpt /-->
<!-- /wp:post-template -->
<!-- wp:query-pagination -->
<!-- wp:query-pagination-previous /-->
<!-- wp:query-pagination-numbers /-->
<!-- wp:query-pagination-next /-->
<!-- /wp:query-pagination -->
<!-- /wp:query -->

WRONG examples (DO NOT USE):

1. WRONG — wp:html (forbidden):
<!-- wp:html --><div class="custom">Bad</div><!-- /wp:html -->
CORRECT alternative: Use <!-- wp:group {"layout":{"type":"constrained"}} --> with inner blocks instead.

2. WRONG — unclosed tags:
<!-- wp:group -->
<div>Content without closing tag
CORRECT alternative: Always close blocks: <!-- wp:group -->...<!-- /wp:group -->

3. WRONG — unknown block:
<!-- wp:acme/custom-hero -->Content<!-- /wp:acme/custom-hero -->
CORRECT alternative: Use core blocks like <!-- wp:cover --> or <!-- wp:group --> to achieve the same layout.

You MUST NOT output <!-- wp:html --> anywhere. If you think you need it, use a core/group block with layout attributes instead.

Required output schema:
${THEME_MANIFEST_SCHEMA}

Required files that must appear in the output:
${fileList}

Return ONLY valid JSON matching the ThemeManifest interface. No prose, no markdown, no code fences.`
}

export function buildPass2UserPrompt(
  request: GenerateRequest,
  design: DesignSpec,
): string {
  const description = request.description
    ? stripHtml(request.description)
    : stripHtml(request.prompt)

  return `Generate the complete ThemeManifest for the "${design.name}" theme.

Original request: ${description}

The design narrative is: ${design.designNarrative}

Use the design spec colors, typography, and layout provided in the system prompt. Generate all required templates, template parts, and patterns with valid block markup.

Return ONLY the JSON object, nothing else.`
}

export function buildIterationPrompt(
  manifest: ThemeManifest,
  instruction: string,
): string {
  return `Here is the current theme manifest:
${JSON.stringify(manifest, null, 2)}

User instruction: ${instruction}

Return ONLY the changed fields as a partial ThemeManifest JSON object. Do not include unchanged fields.
Maintain existing color palette slugs and typography scale tokens.
Return ONLY valid JSON, no prose or markdown.`
}
