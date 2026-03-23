import { z } from 'zod'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')

const paletteEntry = z.object({
  name: z.string(),
  slug: z.string(),
  color: hexColor,
})

const fontFamilyEntry = z.object({
  name: z.string(),
  slug: z.string(),
  fontFamily: z.string(),
})

const templatePartEntry = z.object({
  name: z.string(),
  area: z.string(),
  title: z.string().optional(),
})

const themeJsonSchema = z
  .object({
    version: z.literal(3),
    settings: z
      .object({
        color: z
          .object({
            palette: z.array(paletteEntry).optional(),
          })
          .passthrough()
          .optional(),
        typography: z
          .object({
            fontFamilies: z.array(fontFamilyEntry).optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional(),
    templateParts: z.array(templatePartEntry).optional(),
  })
  .passthrough()

function formatPath(path: (string | number)[]): string {
  return path
    .map((p, i) => (typeof p === 'number' ? `[${p}]` : i === 0 ? p : `.${p}`))
    .join('')
}

export function validateThemeJson(json: unknown): {
  valid: boolean
  errors: { path: string; message: string }[]
} {
  if (json === null || json === undefined || typeof json !== 'object') {
    return {
      valid: false,
      errors: [{ path: '', message: 'Input must be an object' }],
    }
  }

  const result = themeJsonSchema.safeParse(json)

  if (result.success) {
    return { valid: true, errors: [] }
  }

  const errors = result.error.issues.map((issue) => ({
    path: formatPath(issue.path as (string | number)[]),
    message: issue.message,
  }))

  return { valid: false, errors }
}
