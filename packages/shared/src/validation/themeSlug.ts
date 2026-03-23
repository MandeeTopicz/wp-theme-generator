const VALID_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function validateThemeSlug(slug: string): {
  valid: boolean
  suggestion?: string
} {
  if (VALID_SLUG.test(slug)) {
    return { valid: true }
  }
  const suggestion = toSlug(slug)
  return { valid: false, suggestion }
}
