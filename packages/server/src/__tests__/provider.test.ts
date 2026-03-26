import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAIProvider } from '../ai/provider'

describe('createAIProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.GEMINI_API_KEY
    delete process.env.AI_PROVIDER
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('throws if Anthropic API key is missing for default provider', () => {
    expect(() => createAIProvider()).toThrow(/API_KEY is required/)
  })

  it('returns a provider with complete() when Anthropic key is present', () => {
    const provider = createAIProvider({ apiKey: 'sk-test-key' })
    expect(typeof provider.complete).toBe('function')
  })

  it('returns a provider with iterateTheme() when Anthropic key is present', () => {
    const provider = createAIProvider({ apiKey: 'sk-test-key' })
    expect(typeof provider.iterateTheme).toBe('function')
  })

  it('throws "not yet implemented" for openai provider', () => {
    expect(() => createAIProvider({ provider: 'openai' })).toThrow(
      'OpenAI provider not yet implemented',
    )
  })

  it('throws "not yet implemented" for local provider', () => {
    expect(() => createAIProvider({ provider: 'local' })).toThrow(
      'Local provider not yet implemented',
    )
  })

  it('returns gemini provider when AI_PROVIDER=gemini and key is set', () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key'
    const provider = createAIProvider({ provider: 'gemini' })
    expect(typeof provider.complete).toBe('function')
  })
})
