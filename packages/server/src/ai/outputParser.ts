import { z } from 'zod'
import type { CopyStrings } from '@wp-theme-gen/shared'

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

export function extractJson(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/)
  if (fenceMatch) return fenceMatch[1]!.trim()

  const trimmed = raw.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed

  const start = raw.indexOf('{')
  if (start !== -1) {
    let depth = 0
    let inString = false
    let escape = false
    for (let i = start; i < raw.length; i++) {
      const ch = raw[i]
      if (escape) { escape = false; continue }
      if (ch === '\\' && inString) { escape = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') depth++
      if (ch === '}') {
        depth--
        if (depth === 0) return raw.slice(start, i + 1)
      }
    }
  }

  return trimmed
}

function parseJson(raw: string, context: string): unknown {
  const cleaned = extractJson(raw)
  try {
    return JSON.parse(cleaned)
  } catch {
    console.error(`[${context}] Failed to parse JSON. First 500 chars:`, raw.slice(0, 500))
    throw new ParseError(`Invalid JSON in ${context} response`, raw)
  }
}

const colorEntrySchema = z.object({
  name: z.string(),
  slug: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{3,8}$/, 'Must be a hex color'),
})

const fontFamilySchema = z.object({
  name: z.string(),
  slug: z.string(),
  fontFamily: z.string(),
})

const featureItemSchema = z.object({
  title: z.string(),
  description: z.string(),
})

const copyStringsSchema = z.object({
  heroHeading: z.string(),
  heroSubheading: z.string(),
  ctaHeading: z.string(),
  ctaDescription: z.string(),
  ctaButtonText: z.string(),
  sectionHeading: z.string(),
  aboutHeading: z.string(),
  aboutDescription: z.string(),
  notFoundMessage: z.string(),
  copyright: z.string(),
  featureItems: z.array(featureItemSchema).min(3).max(3),
})

const layoutPersonalitySchema = z.object({
  heroStyle: z.enum(['full-bleed-cover', 'split-layout', 'typography-hero', 'centered-minimal']),
  heroHeight: z.enum(['100vh', '85vh', '70vh']),
  headerStyle: z.enum(['transparent-overlay', 'solid-bar', 'minimal-centered']),
  sectionsOrder: z.array(z.string()).min(2).max(6),
  visualTension: z.string(),
})

const styleVariationSchema = z.object({
  title: z.string(),
  slug: z.string(),
  colors: z.array(colorEntrySchema),
})

const designBriefSchema = z.object({
  name: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase-hyphenated'),
  colors: z.array(colorEntrySchema).min(6).max(8),
  typography: z.object({
    fontFamilies: z.array(fontFamilySchema).min(1).max(3),
  }),
  layout: z.object({
    contentSize: z.string(),
    wideSize: z.string(),
  }),
  layoutPersonality: layoutPersonalitySchema,
  copyStrings: copyStringsSchema,
  styleVariations: z.array(styleVariationSchema).min(1),
})

export type DesignBrief = z.infer<typeof designBriefSchema>

const DEFAULT_FEATURE_ITEMS = [
  { title: 'Thoughtful Design', description: 'Every detail considered, every element purposeful and intentional.' },
  { title: 'Quality Content', description: 'Ideas worth sharing, stories worth telling to the people who matter.' },
  { title: 'Built to Last', description: 'A solid foundation you can trust and continue to build upon.' },
]

export function parseDesignBrief(raw: string): DesignBrief {
  const parsed = parseJson(raw, 'design brief')
  const data = parsed as Record<string, unknown>

  // Recovery: inject default layoutPersonality if missing
  if (!data.layoutPersonality) {
    data.layoutPersonality = {
      heroStyle: 'full-bleed-cover',
      heroHeight: '85vh',
      headerStyle: 'solid-bar',
      sectionsOrder: ['features', 'latest-posts', 'cta'],
      visualTension: 'Strong typographic contrast between display and body text.',
    }
  }

  // Recovery: fix featureItems count
  const copy = data.copyStrings as Record<string, unknown> | undefined
  if (copy && Array.isArray(copy.featureItems)) {
    while (copy.featureItems.length < 3) {
      copy.featureItems.push(DEFAULT_FEATURE_ITEMS[copy.featureItems.length]!)
    }
    copy.featureItems = copy.featureItems.slice(0, 3)
  }

  const result = designBriefSchema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    throw new ParseError(
      `Design brief validation failed: ${errors.join('; ')}`,
      raw,
      errors,
    )
  }

  return result.data
}

const headerFooterSchema = z.object({
  header: z.string().min(10),
  footer: z.string().min(10),
})

export type HeaderFooterResult = z.infer<typeof headerFooterSchema>

export function parseHeaderFooter(raw: string): HeaderFooterResult {
  const parsed = parseJson(raw, 'header/footer')
  const result = headerFooterSchema.safeParse(parsed)

  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    throw new ParseError(`Header/footer validation failed: ${errors.join('; ')}`, raw, errors)
  }

  if (!result.data.header.includes('wp:')) {
    throw new ParseError('Header markup missing WordPress blocks', raw)
  }
  if (!result.data.footer.includes('wp:')) {
    throw new ParseError('Footer markup missing WordPress blocks', raw)
  }

  return result.data
}

const homepageSchema = z.object({
  indexTemplate: z.string().min(10),
  heroPattern: z.string().min(10),
})

export type HomepageResult = z.infer<typeof homepageSchema>

export function parseHomepage(raw: string): HomepageResult {
  const parsed = parseJson(raw, 'homepage')
  const result = homepageSchema.safeParse(parsed)

  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    throw new ParseError(`Homepage validation failed: ${errors.join('; ')}`, raw, errors)
  }

  if (!result.data.indexTemplate.includes('wp:template-part')) {
    throw new ParseError('Homepage template must reference header/footer template parts', raw)
  }

  return result.data
}

const innerTemplatesSchema = z.object({
  single: z.string().min(10),
  page: z.string().min(10),
  archive: z.string().min(10),
  '404': z.string().min(10),
})

export type InnerTemplatesResult = z.infer<typeof innerTemplatesSchema>

export function parseInnerTemplates(raw: string): InnerTemplatesResult {
  const parsed = parseJson(raw, 'inner templates')
  const result = innerTemplatesSchema.safeParse(parsed)

  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    throw new ParseError(`Inner templates validation failed: ${errors.join('; ')}`, raw, errors)
  }

  return result.data
}

const iterationResultSchema = z.object({
  templates: z.array(z.object({ name: z.string(), content: z.string() })).optional(),
  templateParts: z.array(z.object({ name: z.string(), content: z.string() })).optional(),
  patterns: z.array(z.object({ name: z.string(), content: z.string() })).optional(),
})

export type IterationResult = z.infer<typeof iterationResultSchema>

export function parseIterationResult(raw: string): IterationResult {
  const parsed = parseJson(raw, 'iteration')
  const result = iterationResultSchema.safeParse(parsed)

  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    throw new ParseError(`Iteration result validation failed: ${errors.join('; ')}`, raw, errors)
  }

  const data = result.data
  const hasChanges =
    (data.templates?.length ?? 0) > 0 ||
    (data.templateParts?.length ?? 0) > 0 ||
    (data.patterns?.length ?? 0) > 0

  if (!hasChanges) {
    throw new ParseError('Iteration result contains no changed files', raw)
  }

  return data
}