import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAIProvider } from '../ai/provider'

describe('createAIProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.AI_PROVIDER
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('throws if ANTHROPIC_API_KEY is missing', () => {
    expect(() => createAIProvider()).toThrow('ANTHROPIC_API_KEY is required')
  })

  it('returns an object with all three methods when key is present', () => {
    const provider = createAIProvider({ apiKey: 'sk-test-key' })
    expect(typeof provider.generateDesignSpec).toBe('function')
    expect(typeof provider.generateThemeManifest).toBe('function')
    expect(typeof provider.iterateTheme).toBe('function')
  })

  it('throws "not yet implemented" for openai provider', () => {
    expect(() => createAIProvider({ provider: 'openai' })).toThrow(
      'OpenAI provider not yet implemented',
    )
  })
})
