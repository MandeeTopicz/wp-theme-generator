import type { Request, Response, NextFunction } from 'express'

const VALID_SITE_TYPES = ['blog', 'portfolio', 'business', 'store', 'docs']
const MAX_DESCRIPTION_LENGTH = 1000

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

function sanitizeStrings(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = stripHtml(obj[key] as string)
    }
  }
}

export function sanitize(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.body || typeof req.body !== 'object') {
    next()
    return
  }

  sanitizeStrings(req.body as Record<string, unknown>)

  const errors: { field: string; message: string }[] = []
  const body = req.body as Record<string, unknown>

  if (typeof body.description === 'string' && body.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push({
      field: 'description',
      message: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`,
    })
  }

  if (body.siteType !== undefined && !VALID_SITE_TYPES.includes(body.siteType as string)) {
    errors.push({
      field: 'siteType',
      message: `siteType must be one of: ${VALID_SITE_TYPES.join(', ')}`,
    })
  }

  if (errors.length > 0) {
    res.status(400).json({ error: true, code: 'VALIDATION_ERROR', errors })
    return
  }

  next()
}
