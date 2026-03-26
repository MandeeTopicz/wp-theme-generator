import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GeminiProvider } from '../ai/gemini'

const mockGenerateContent = vi.fn()

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      constructor() {}
      getGenerativeModel() {
        return { generateContent: mockGenerateContent }
      }
    },
  }
})

function makeResponse(text: string) {
  return { response: { text: () => text } }
}

describe('GeminiProvider', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset()
    process.env.GEMINI_API_KEY = 'test-key'
  })

  it('throws on missing API key', () => {
    const savedKey = process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY
    expect(() => new GeminiProvider()).toThrow('GEMINI_API_KEY')
    process.env.GEMINI_API_KEY = savedKey
  })

  it('complete() returns text from API response', async () => {
    mockGenerateContent.mockResolvedValueOnce(makeResponse('{"hello":"world"}'))
    const provider = new GeminiProvider('test-key')
    const result = await provider.complete('system prompt', 'user message')
    expect(result).toBe('{"hello":"world"}')
    expect(mockGenerateContent).toHaveBeenCalledTimes(1)
  })

  it('complete() strips code fences from response', async () => {
    mockGenerateContent.mockResolvedValueOnce(makeResponse('```json\n{"hello":"world"}\n```'))
    const provider = new GeminiProvider('test-key')
    const result = await provider.complete('system', 'user')
    expect(result).toBe('{"hello":"world"}')
  })

  it('complete() retries on 429 and succeeds', async () => {
    const rateLimitError = Object.assign(new Error('rate limited'), { status: 429 })
    mockGenerateContent
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce(makeResponse('{"ok":true}'))

    const provider = new GeminiProvider('test-key')
    const result = await provider.complete('system', 'user')
    expect(result).toBe('{"ok":true}')
    expect(mockGenerateContent).toHaveBeenCalledTimes(2)
  }, 10000)

  it('complete() throws after 3 rate limit failures', async () => {
    const rateLimitError = Object.assign(new Error('rate limited'), { status: 429 })
    mockGenerateContent
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError)

    const provider = new GeminiProvider('test-key')
    await expect(provider.complete('system', 'user')).rejects.toThrow('rate limited')
  }, 15000)

  it('iterateTheme() returns parsed iteration result', async () => {
    const iterResult = {
      templates: [{ name: 'index.html', content: '<!-- wp:paragraph --><p>updated</p><!-- /wp:paragraph -->' }],
    }
    mockGenerateContent.mockResolvedValueOnce(makeResponse(JSON.stringify(iterResult)))

    const provider = new GeminiProvider('test-key')
    const result = await provider.iterateTheme(
      { templates: [], templateParts: [], patterns: [] },
      'Make the hero bigger',
    )
    expect(result.templates).toHaveLength(1)
    expect(result.templates![0]!.name).toBe('index.html')
  })

  it('iterateTheme() retries on parse failure', async () => {
    const iterResult = {
      templateParts: [{ name: 'header.html', content: '<!-- wp:group --><!-- /wp:group -->' }],
    }
    mockGenerateContent
      .mockResolvedValueOnce(makeResponse('not valid json'))
      .mockResolvedValueOnce(makeResponse(JSON.stringify(iterResult)))

    const provider = new GeminiProvider('test-key')
    const result = await provider.iterateTheme(
      { templates: [], templateParts: [], patterns: [] },
      'Update the header',
    )
    expect(result.templateParts![0]!.name).toBe('header.html')
    expect(mockGenerateContent).toHaveBeenCalledTimes(2)
  })
})
