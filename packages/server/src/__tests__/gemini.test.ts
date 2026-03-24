import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GeminiProvider } from '../ai/gemini'

// Mock @google/generative-ai
const mockGenerateContent = vi.fn()
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}))

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}))

const validDesignSpecJson = JSON.stringify({
  name: 'Test',
  slug: 'test',
  colors: [{ name: 'Primary', slug: 'primary', color: '#000' }],
  typography: { fontFamilies: [{ name: 'Inter', slug: 'inter', fontFamily: 'Inter' }] },
  layout: { contentSize: '620px', wideSize: '1200px' },
  designNarrative: 'Bold',
  styleVariations: [],
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GeminiProvider', () => {
  it('throws on missing GEMINI_API_KEY', () => {
    const origKey = process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY
    expect(() => new GeminiProvider()).toThrow('GEMINI_API_KEY is required')
    process.env.GEMINI_API_KEY = origKey
  })

  it('has the three required AIProvider methods', () => {
    const provider = new GeminiProvider('test-key')
    expect(typeof provider.generateDesignSpec).toBe('function')
    expect(typeof provider.generateThemeManifest).toBe('function')
    expect(typeof provider.iterateTheme).toBe('function')
  })

  it('strips markdown code fences from response', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => '```json\n' + validDesignSpecJson + '\n```' },
    })
    const provider = new GeminiProvider('test-key')
    const result = await provider.generateDesignSpec({
      prompt: 'test', description: 'test', siteType: 'blog',
    })
    expect(result.name).toBe('Test')
  })

  it('retries on ParseError with error appended to prompt', async () => {
    mockGenerateContent
      .mockResolvedValueOnce({
        response: { text: () => 'not valid json' },
      })
      .mockResolvedValueOnce({
        response: { text: () => validDesignSpecJson },
      })
    const provider = new GeminiProvider('test-key')
    const result = await provider.generateDesignSpec({
      prompt: 'test', description: 'test', siteType: 'blog',
    })
    expect(result.name).toBe('Test')
    expect(mockGenerateContent).toHaveBeenCalledTimes(2)
    // Second call should contain error message in prompt
    const secondCall = mockGenerateContent.mock.calls[1]![0]
    const userText = secondCall.contents[0].parts[0].text as string
    expect(userText).toContain('Previous attempt failed')
  })
})
