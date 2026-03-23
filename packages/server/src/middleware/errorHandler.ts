import type { Request, Response, NextFunction } from 'express'
import { ParseError } from '../ai/outputParser'

interface ErrorResponse {
  error: true
  code: string
  message: string
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  console.error(err.stack ?? err.message)

  let status = 500
  let code = 'INTERNAL_ERROR'
  let message = 'Something went wrong'

  if (err instanceof ParseError) {
    status = 422
    code = 'PARSE_ERROR'
    message = err.message
  } else if (err.name === 'ValidationError' || err.message.includes('validation')) {
    status = 400
    code = 'VALIDATION_ERROR'
    message = err.message
  } else if (
    'status' in err &&
    (err as { status: number }).status === 429
  ) {
    status = 429
    code = 'RATE_LIMITED'
    message = 'AI service is busy, please try again shortly'
  }

  const body: ErrorResponse = { error: true, code, message }
  res.status(status).json(body)
}
