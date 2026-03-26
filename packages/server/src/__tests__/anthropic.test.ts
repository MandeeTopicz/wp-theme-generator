import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnthropicProvider } from '../ai/anthropic'

const validIterationJson = JSON.stringify({
  templates: [{ name: 'index.html', content: '<!-- wp:paragraph --><p>ok</p><!-- /wp:paragraph -->' }],
})

const mockCreate = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  class MockRateLimitError extends Error {
    status = 429
    constructor(message: string) {
      super(message)
      this.name = 'RateLimitError'
    }
  }

  class MockAPIError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.name = 'APIError'
      this.status = status
    }
  }

  return {
    default: class {
      messages = { create: mockCreate }
      constructor() {}
      static RateLimitError = MockRateLimitError
      static APIError = MockAPIError
    },
  }
})

function makeResponse(text: string) {
  return { content: [{ type: 'text', text }] }
}

const emptyManifest = {
  templates: [] as { name: string; content: string }[],
  templateParts: [] as { name: string; content: string }[],
  patterns: [] as { name: string; content: string }[],
}

describe('AnthropicProvider', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  it('complete returns model text on success', async () => {
    mockCreate.mockResolvedValueOnce(makeResponse('model output'))
    const provider = new AnthropicProvider('sk-test')
    const result = await provider.complete('system text', 'user text')
    expect(result).toBe('model output')
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('iterateTheme returns parsed IterationResult on success', async () => {
    mockCreate.mockResolvedValueOnce(makeResponse(validIterationJson))
    const provider = new AnthropicProvider('sk-test')
    const result = await provider.iterateTheme(emptyManifest, 'update the hero')
    expect(result.templates).toHaveLength(1)
    expect(result.templates![0]!.name).toBe('index.html')
  })

  it('iterateTheme retries on ParseError and succeeds on second attempt', async () => {
    mockCreate
      .mockResolvedValueOnce(makeResponse('not valid json'))
      .mockResolvedValueOnce(makeResponse(validIterationJson))

    const provider = new AnthropicProvider('sk-test')
    const result = await provider.iterateTheme(emptyManifest, 'fix it')
    expect(result.templates).toHaveLength(1)
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('throws after 3 failed parse attempts', async () => {
    mockCreate
      .mockResolvedValueOnce(makeResponse('bad json 1'))
      .mockResolvedValueOnce(makeResponse('bad json 2'))
      .mockResolvedValueOnce(makeResponse('bad json 3'))

    const provider = new AnthropicProvider('sk-test')
    await expect(provider.iterateTheme(emptyManifest, 'x')).rejects.toThrow()
    expect(mockCreate).toHaveBeenCalledTimes(3)
  })

  it('retries on 429 with backoff', async () => {
    const rateLimitError = new Error('rate limited')
    Object.assign(rateLimitError, { status: 429 })

    mockCreate
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce(makeResponse(validIterationJson))

    const provider = new AnthropicProvider('sk-test')
    const result = await provider.iterateTheme(emptyManifest, 'x')
    expect(result.templates).toHaveLength(1)
    expect(mockCreate).toHaveBeenCalledTimes(2)
  }, 10000)

  it('throws actionable message on 500 error', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const apiError = new (
      Anthropic as unknown as { APIError: new (status: number, message: string) => Error }
    ).APIError(500, 'Internal server error')

    mockCreate.mockRejectedValueOnce(apiError)

    const provider = new AnthropicProvider('sk-test')
    await expect(provider.iterateTheme(emptyManifest, 'x')).rejects.toThrow('Claude API error')
  })

  it('throws on missing API key', () => {
    expect(() => new AnthropicProvider('')).toThrow('ANTHROPIC_API_KEY')
  })
})
