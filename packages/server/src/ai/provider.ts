import type {
  GenerateRequest,
  ThemeManifest,
  ColorPaletteEntry,
  ThemeTypography,
  ThemeLayout,
} from '@wp-theme-gen/shared'
import { AnthropicProvider } from './anthropic'

export interface DesignSpec {
  name: string
  slug: string
  colors: ColorPaletteEntry[]
  typography: ThemeTypography
  layout: ThemeLayout
  designNarrative: string
  styleVariations: {
    title: string
    slug: string
    colors: ColorPaletteEntry[]
  }[]
}

export interface AIProvider {
  generateDesignSpec(request: GenerateRequest): Promise<DesignSpec>
  generateThemeManifest(
    request: GenerateRequest,
    design: DesignSpec,
  ): Promise<ThemeManifest>
  iterateTheme(
    manifest: ThemeManifest,
    instruction: string,
  ): Promise<Partial<ThemeManifest>>
}

export interface CreateAIProviderOptions {
  provider?: string
  apiKey?: string
}

export function createAIProvider(
  options: CreateAIProviderOptions = {},
): AIProvider {
  const provider = options.provider ?? process.env.AI_PROVIDER ?? 'anthropic'

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
