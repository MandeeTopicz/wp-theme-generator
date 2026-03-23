import { z } from 'zod'
import { validateTheme } from '@wp-theme-gen/shared'
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
})

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
      }),
    ),
  }),
  layout: z.object({
    contentSize: z.string(),
    wideSize: z.string(),
  }),
  designNarrative: z.string(),
  styleVariations: z.array(
    z.object({
      title: z.string(),
      slug: z.string(),
      colors: z.array(colorPaletteEntrySchema),
    }),
  ),
})

const themeFileSchema = z.object({
  name: z.string(),
  content: z.string(),
})

const themeManifestSchema = z.object({
  name: z.string(),
  slug: z.string(),
  themeJson: z.unknown(),
  templates: z.array(themeFileSchema),
  templateParts: z.array(themeFileSchema),
  patterns: z.array(themeFileSchema),
  files: z.array(z.string()),
  colors: z
    .array(colorPaletteEntrySchema)
    .optional(),
  typography: z
    .object({
      fontFamilies: z.array(
        z.object({
          name: z.string(),
          slug: z.string(),
          fontFamily: z.string(),
        }),
      ),
    })
    .optional(),
  layout: z
    .object({
      contentSize: z.string(),
      wideSize: z.string(),
    })
    .optional(),
})

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim()
}

export function parseDesignSpec(raw: string): DesignSpec {
  const cleaned = stripCodeFences(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
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

  return result.data
}

export function parseThemeManifest(raw: string): ThemeManifest {
  const cleaned = stripCodeFences(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
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
  const validation = validateTheme(manifest)
  if (!validation.isValid) {
    const fatalErrors = validation.errors.map((e) => e.message)
    throw new ParseError(
      `Theme manifest has fatal validation errors: ${fatalErrors.join('; ')}`,
      raw,
      fatalErrors,
    )
  }

  return manifest
}
