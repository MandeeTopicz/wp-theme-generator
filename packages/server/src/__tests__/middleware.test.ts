import { describe, it, expect, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { errorHandler } from '../middleware/errorHandler'
import { sanitize } from '../middleware/sanitize'
import { ParseError } from '../ai/outputParser'

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  return res
}

function mockReq(body?: Record<string, unknown>) {
  return { body } as Request
}

const noop = vi.fn() as unknown as NextFunction

describe('errorHandler', () => {
  it('returns { error: true, code, message } shape', () => {
    const res = mockRes()
    errorHandler(new Error('fail'), {} as Request, res, noop)
    const json = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(json).toHaveProperty('error', true)
    expect(json).toHaveProperty('code')
    expect(json).toHaveProperty('message')
  })

  it('never includes stack trace in response', () => {
    const res = mockRes()
    const err = new Error('fail')
    err.stack = 'Error: fail\n    at Object.<anonymous> (test.ts:1:1)'
    errorHandler(err, {} as Request, res, noop)
    const json = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(JSON.stringify(json)).not.toContain('at Object')
  })

  it('returns 500 for unknown errors', () => {
    const res = mockRes()
    errorHandler(new Error('unknown'), {} as Request, res, noop)
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('returns 422 for ParseError', () => {
    const res = mockRes()
    errorHandler(new ParseError('bad parse', 'raw'), {} as Request, res, noop)
    expect(res.status).toHaveBeenCalledWith(422)
    const json = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(json.code).toBe('PARSE_ERROR')
  })
})

describe('sanitize', () => {
  it('strips <script> tags from description', () => {
    const req = mockReq({ description: '<script>alert("xss")</script>Hello' })
    const res = mockRes()
    const next = vi.fn()
    sanitize(req, res, next)
    expect((req.body as Record<string, unknown>).description).toBe('alert("xss")Hello')
    expect(next).toHaveBeenCalled()
  })

  it('returns 400 for description over 1000 chars', () => {
    const req = mockReq({ description: 'a'.repeat(1001) })
    const res = mockRes()
    const next = vi.fn()
    sanitize(req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })
})
