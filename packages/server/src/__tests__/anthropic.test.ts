import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnthropicProvider } from '../ai/anthropic'
import type { DesignSpec } from '../ai/provider'

const validDesignSpec: DesignSpec = {
  name: 'Test Theme',
  slug: 'test-theme',
  colors: [{ name: 'Primary', slug: 'primary', color: '#1a1a1a' }],
  typography: {
    fontFamilies: [
      { name: 'Inter', slug: 'inter', fontFamily: 'Inter, sans-serif' },
    ],
  },
  layout: { contentSize: '620px', wideSize: '1200px' },
  designNarrative: 'A bold theme',
  styleVariations: [],
}

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

describe('AnthropicProvider', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  it('generateDesignSpec returns a DesignSpec on success', async () => {
    mockCreate.mockResolvedValueOnce(
      makeResponse(JSON.stringify(validDesignSpec)),
    )
    const provider = new AnthropicProvider('sk-test')
    const result = await provider.generateDesignSpec({ prompt: 'test' })
    expect(result.name).toBe('Test Theme')
    expect(result.slug).toBe('test-theme')
  })

  it('retries once on ParseError and succeeds on second attempt', async () => {
    mockCreate
      .mockResolvedValueOnce(makeResponse('not valid json'))
      .mockResolvedValueOnce(makeResponse(JSON.stringify(validDesignSpec)))

    const provider = new AnthropicProvider('sk-test')
    const result = await provider.generateDesignSpec({ prompt: 'test' })
    expect(result.name).toBe('Test Theme')
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('throws after 2 failed parse attempts', async () => {
    mockCreate
      .mockResolvedValueOnce(makeResponse('bad json 1'))
      .mockResolvedValueOnce(makeResponse('bad json 2'))

    const provider = new AnthropicProvider('sk-test')
    await expect(
      provider.generateDesignSpec({ prompt: 'test' }),
    ).rejects.toThrow()
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('retries on 429 with backoff', async () => {
    const rateLimitError = new Error('rate limited')
    Object.assign(rateLimitError, { status: 429 })

    mockCreate
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce(makeResponse(JSON.stringify(validDesignSpec)))

    const provider = new AnthropicProvider('sk-test')
    const result = await provider.generateDesignSpec({ prompt: 'test' })
    expect(result.name).toBe('Test Theme')
    expect(mockCreate).toHaveBeenCalledTimes(2)
  }, 10000)

  it('throws actionable message on 500 error', async () => {
    // Import the mocked module to get the mock class
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const apiError = new (
      Anthropic as unknown as { APIError: new (status: number, message: string) => Error }
    ).APIError(500, 'Internal server error')

    mockCreate.mockRejectedValueOnce(apiError)

    const provider = new AnthropicProvider('sk-test')
    await expect(
      provider.generateDesignSpec({ prompt: 'test' }),
    ).rejects.toThrow('Claude API error')
  })

  it('throws on missing API key', () => {
    expect(() => new AnthropicProvider('')).toThrow('ANTHROPIC_API_KEY')
  })
})
