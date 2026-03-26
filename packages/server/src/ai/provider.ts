import { AnthropicProvider } from './anthropic'
import { GeminiProvider } from './gemini'
import type { IterationResult } from './outputParser'

export interface AIProvider {
  complete(systemPrompt: string, userMessage: string): Promise<string>
  iterateTheme(
    manifest: {
      templates: { name: string; content: string }[]
      templateParts: { name: string; content: string }[]
      patterns: { name: string; content: string }[]
    },
    instruction: string,
  ): Promise<IterationResult>
}

export interface CreateAIProviderOptions {
  provider?: string
  apiKey?: string
}

export function createAIProvider(options: CreateAIProviderOptions = {}): AIProvider {
  const provider = options.provider ?? process.env.AI_PROVIDER ?? 'anthropic'

  if (provider === 'gemini') {
    return new GeminiProvider(options.apiKey)
  }

  if (provider === 'openai') {
    throw new Error('OpenAI provider not yet implemented')
  }

  if (provider === 'local') {
    throw new Error('Local provider not yet implemented')
  }

  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required. Set it in your environment or .env file.')
  }

  return new AnthropicProvider(apiKey)
}