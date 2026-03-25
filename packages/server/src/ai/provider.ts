import type {
  GenerateRequest,
  ColorPaletteEntry,
  ThemeTypography,
  ThemeLayout,
  CopyStrings,
} from '@wp-theme-gen/shared'
import { AnthropicProvider } from './anthropic'
import { GeminiProvider } from './gemini'

export interface DesignSpec {
  name: string
  slug: string
  archetype?: string
  colors: ColorPaletteEntry[]
  typography: ThemeTypography
  layout: ThemeLayout
  designNarrative: string
  copyTone?: string
  copyStrings: CopyStrings
  styleVariations: {
    title: string
    slug: string
    colors: ColorPaletteEntry[]
  }[]
}

export interface IterationResult {
  templates?: { name: string; content: string }[]
  templateParts?: { name: string; content: string }[]
  patterns?: { name: string; content: string }[]
}

export interface AIProvider {
  generateDesignSpec(request: GenerateRequest): Promise<DesignSpec>
  iterateTheme(
    manifest: { templates: { name: string; content: string }[]; templateParts: { name: string; content: string }[]; patterns: { name: string; content: string }[] },
    instruction: string,
  ): Promise<IterationResult>
}

export interface CreateAIProviderOptions {
  provider?: string
  apiKey?: string
}

export function createAIProvider(
  options: CreateAIProviderOptions = {},
): AIProvider {
  const provider = options.provider ?? process.env.AI_PROVIDER ?? 'gemini'

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
    throw new Error(
      'ANTHROPIC_API_KEY is required. Set it in your environment or .env file.',
    )
  }

  return new AnthropicProvider(apiKey)
}
