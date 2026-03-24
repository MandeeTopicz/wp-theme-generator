import { z } from 'zod'
import type { ThemeManifest } from '@wp-theme-gen/shared'
import type { DesignSpec } from './provider'

export class ParseError extends Error {
  constructor(
    message: string,
    public raw: string,
    public validationErrors?: string[],
  ) {
    super(message)
    this.name = 'ParseError'
  }
}

const colorPaletteEntrySchema = z.object({
  name: z.string(),
  slug: z.string(),
  color: z.string(),
}).passthrough()

const designSpecSchema = z.object({
  name: z.string(),
  slug: z.string(),
  colors: z.array(colorPaletteEntrySchema),
  typography: z.object({
    fontFamilies: z.array(
      z.object({
        name: z.string(),
        slug: z.string(),
        fontFamily: z.string(),
      }).passthrough(),
    ),
  }).passthrough(),
  layout: z.object({
    contentSize: z.string(),
    wideSize: z.string(),
  }).passthrough(),
  designNarrative: z.string(),
  styleVariations: z.array(
    z.object({
      title: z.string(),
      slug: z.string(),
      colors: z.array(colorPaletteEntrySchema),
    }).passthrough(),
  ),
}).passthrough()

const themeFileSchema = z.object({
  name: z.string(),
  content: z.string(),
}).passthrough()

const themeManifestSchema = z.object({
  name: z.string().default(''),
  slug: z.string().default(''),
  themeJson: z.unknown().optional().default({ version: 3 }),
  templates: z.array(themeFileSchema).default([]),
  templateParts: z.array(themeFileSchema).default([]),
  patterns: z.array(themeFileSchema).default([]),
  files: z.array(z.string()).default([]),
  colors: z.array(colorPaletteEntrySchema).optional(),
  typography: z
    .object({
      fontFamilies: z.array(
        z.object({
          name: z.string(),
          slug: z.string(),
          fontFamily: z.string(),
        }).passthrough(),
      ),
    })
    .passthrough()
    .optional(),
  layout: z
    .object({
      contentSize: z.string(),
      wideSize: z.string(),
    })
    .passthrough()
    .optional(),
}).passthrough()

/**
 * Extract JSON from AI response. Handles:
 * - Raw JSON
 * - ```json fences (with prose before/after)
 * - ``` fences without language tag
 * - JSON buried in prose (find first { to last matching })
 */
function extractJson(raw: string): string {
  // Try 1: strip code fences (greedy — find fenced block anywhere)
  const fenceMatch = raw.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  // Try 2: raw string is already JSON
  const trimmed = raw.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return trimmed
  }

  // Try 3: find the first { and match to its closing }
  const start = raw.indexOf('{')
  if (start !== -1) {
    let depth = 0
    let inString = false
    let escape = false
    for (let i = start; i < raw.length; i++) {
      const ch = raw[i]
      if (escape) {
        escape = false
        continue
      }
      if (ch === '\\' && inString) {
        escape = true
        continue
      }
      if (ch === '"') {
        inString = !inString
        continue
      }
      if (inString) continue
      if (ch === '{') depth++
      if (ch === '}') {
        depth--
        if (depth === 0) {
          return raw.slice(start, i + 1)
        }
      }
    }
  }

  return trimmed
}

export function parseDesignSpec(raw: string): DesignSpec {
  const cleaned = extractJson(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('Failed to parse design spec JSON. First 500 chars:', raw.slice(0, 500))
    throw new ParseError('Invalid JSON in design spec response', raw)
  }

  const result = designSpecSchema.safeParse(parsed)
  if (!result.success) {
    const errors = result.error.issues.map(
      (i) => `${i.path.join('.')}: ${i.message}`,
    )
    throw new ParseError(
      `Design spec validation failed: ${errors.join('; ')}`,
      raw,
      errors,
    )
  }

  return result.data as DesignSpec
}

export function parseThemeManifest(raw: string): ThemeManifest {
  const cleaned = extractJson(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('Failed to parse theme manifest JSON. First 500 chars:', raw.slice(0, 500))
    throw new ParseError('Invalid JSON in theme manifest response', raw)
  }

  const result = themeManifestSchema.safeParse(parsed)
  if (!result.success) {
    const errors = result.error.issues.map(
      (i) => `${i.path.join('.')}: ${i.message}`,
    )
    throw new ParseError(
      `Theme manifest schema validation failed: ${errors.join('; ')}`,
      raw,
      errors,
    )
  }

  const manifest = result.data as ThemeManifest

  // Validate index template has sufficient content and required blocks
  const indexTemplate = manifest.templates?.find(
    (t) => t.name === 'index' || t.name === 'index.html',
  )
  if (indexTemplate) {
    const content = indexTemplate.content
    const hasStructure =
      content.includes('wp:cover') ||
      content.includes('wp:query') ||
      (content.includes('wp:group') && content.length > 300)
    if (content.length < 800 || !hasStructure) {
      throw new ParseError(
        `index template is too thin (${content.length} chars, hasStructure=${hasStructure}). Must contain wp:cover or wp:group hero AND wp:query loop with color attributes. Current content: ${content.slice(0, 200)}`,
        raw,
      )
    }
  }

  return manifest
}
