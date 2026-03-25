import { z } from 'zod'
import type { CopyStrings } from '@wp-theme-gen/shared'
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

const featureItemSchema = z.object({
  title: z.string(),
  description: z.string(),
})

const copyStringsSchema = z.object({
  heroHeading: z.string().optional(),
  heroSubheading: z.string().optional(),
  ctaHeading: z.string().optional(),
  ctaDescription: z.string().optional(),
  ctaButtonText: z.string().optional(),
  sectionHeading: z.string().optional(),
  aboutHeading: z.string().optional(),
  aboutDescription: z.string().optional(),
  notFoundMessage: z.string().optional(),
  copyright: z.string().optional(),
  featureItems: z.array(featureItemSchema).optional(),
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
  copyStrings: copyStringsSchema.optional(),
  styleVariations: z.array(
    z.object({
      title: z.string(),
      slug: z.string(),
      colors: z.array(colorPaletteEntrySchema),
    }).passthrough(),
  ),
}).passthrough()

/**
 * Extract JSON from AI response. Handles:
 * - Raw JSON
 * - ```json fences (with prose before/after)
 * - ``` fences without language tag
 * - JSON buried in prose (find first { to last matching })
 */
function extractJson(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  const trimmed = raw.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return trimmed
  }

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

const DEFAULT_COPY: CopyStrings = {
  heroHeading: 'A fresh perspective starts here.',
  heroSubheading: 'Discover ideas, stories, and insights crafted with care. A space designed for curious minds.',
  ctaHeading: 'Ready to dive in?',
  ctaDescription: 'Join our community and stay updated with the latest posts and features.',
  ctaButtonText: 'Get Started',
  sectionHeading: 'Latest Stories',
  aboutHeading: 'What this is all about',
  aboutDescription: 'A space dedicated to thoughtful content and creative expression. We believe in quality over quantity.',
  notFoundMessage: 'The page you are looking for has wandered off. Try searching or head back home.',
  copyright: '© 2026 All rights reserved.',
  featureItems: [
    { title: 'Thoughtful Design', description: 'Every detail considered, every element purposeful.' },
    { title: 'Quality Content', description: 'Ideas worth sharing, stories worth telling.' },
    { title: 'Built to Last', description: 'A foundation you can trust and build upon.' },
  ],
}

function fillCopyDefaults(partial?: Partial<CopyStrings>, themeName?: string): CopyStrings {
  const copy = { ...DEFAULT_COPY }
  if (partial) {
    if (partial.heroHeading) copy.heroHeading = partial.heroHeading
    if (partial.heroSubheading) copy.heroSubheading = partial.heroSubheading
    if (partial.ctaHeading) copy.ctaHeading = partial.ctaHeading
    if (partial.ctaDescription) copy.ctaDescription = partial.ctaDescription
    if (partial.ctaButtonText) copy.ctaButtonText = partial.ctaButtonText
    if (partial.sectionHeading) copy.sectionHeading = partial.sectionHeading
    if (partial.aboutHeading) copy.aboutHeading = partial.aboutHeading
    if (partial.aboutDescription) copy.aboutDescription = partial.aboutDescription
    if (partial.notFoundMessage) copy.notFoundMessage = partial.notFoundMessage
    if (partial.copyright) copy.copyright = partial.copyright
    if (partial.featureItems?.length) {
      copy.featureItems = partial.featureItems.slice(0, 3)
      while (copy.featureItems.length < 3) {
        copy.featureItems.push(DEFAULT_COPY.featureItems[copy.featureItems.length]!)
      }
    }
  }
  if (themeName) {
    copy.copyright = copy.copyright.replace('All rights reserved.', `${themeName}. All rights reserved.`)
  }
  return copy
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

  const data = result.data as Record<string, unknown>

  // Support legacy heroHeading/heroSubheading fields if copyStrings is missing
  const legacyCopy: Partial<CopyStrings> = {}
  if (data.heroHeading && typeof data.heroHeading === 'string') {
    legacyCopy.heroHeading = data.heroHeading
  }
  if (data.heroSubheading && typeof data.heroSubheading === 'string') {
    legacyCopy.heroSubheading = data.heroSubheading
  }

  const rawCopyStrings = (data.copyStrings ?? legacyCopy) as Partial<CopyStrings>
  const copyStrings = fillCopyDefaults(rawCopyStrings, data.name as string)

  return {
    ...result.data,
    copyStrings,
  } as DesignSpec
}
