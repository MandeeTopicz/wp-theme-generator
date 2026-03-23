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
  const fileList = requiredFiles.map((f) => `  - ${f}`).join('\n')

  return `You are a senior WordPress FSE theme developer generating a complete ThemeManifest.

Design context (use these colors, fonts, layout):
${JSON.stringify({ colors: design.colors, typography: design.typography, layout: design.layout }, null, 2)}

Design narrative: ${design.designNarrative}

RULES:
- Use ONLY core/ blocks (e.g. core/group, core/paragraph, core/cover, core/query, core/post-template, etc.)
- NEVER use <!-- wp:html --> — use core/group with layout attributes instead
- Always close block tags: <!-- wp:group -->...<!-- /wp:group -->
- Self-closing is fine: <!-- wp:post-title /-->
- Keep markup SHORT: 5-15 lines per template

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

Use the design spec colors, typography, and layout provided in the system prompt.

Generate these files:
- templates: index.html, single.html, page.html, archive.html, search.html, 404.html
- templateParts: header.html, footer.html
- patterns: hero.php, cta.php, query-loop.php

IMPORTANT: Keep each template's block markup SHORT — 5-15 lines of block comments max. Do not generate verbose HTML. Use self-closing blocks like <!-- wp:post-title /-->.

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
