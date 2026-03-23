import Anthropic from '@anthropic-ai/sdk'
import type { GenerateRequest, ThemeManifest } from '@wp-theme-gen/shared'
import type { AIProvider, DesignSpec } from './provider'
import {
  buildPass1SystemPrompt,
  buildPass1UserPrompt,
  buildPass2SystemPrompt,
  buildPass2UserPrompt,
  buildIterationPrompt,
} from './promptBuilder'
import { parseDesignSpec, parseThemeManifest, ParseError } from './outputParser'

const MODEL = 'claude-sonnet-4-5'
const MAX_RETRIES = 2
const BACKOFF_BASE_MS = 1000

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class AnthropicProvider implements AIProvider {
  private client: Anthropic

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is required. Set it in your environment or .env file.',
      )
    }
    this.client = new Anthropic({ apiKey })
  }

  async generateDesignSpec(request: GenerateRequest): Promise<DesignSpec> {
    const system = buildPass1SystemPrompt()
    const userPrompt = buildPass1UserPrompt(request)

    let lastError: Error | undefined
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const content = await this.callAPI(
        system,
        attempt === 0
          ? userPrompt
          : `${userPrompt}\n\nPrevious attempt failed: ${lastError?.message}. Please fix and return valid JSON.`,
      )
      try {
        return parseDesignSpec(content)
      } catch (err) {
        if (err instanceof ParseError) {
          lastError = err
          continue
        }
        throw err
      }
    }
    throw lastError ?? new Error('Failed to generate design spec')
  }

  async generateThemeManifest(
    request: GenerateRequest,
    design: DesignSpec,
  ): Promise<ThemeManifest> {
    const system = buildPass2SystemPrompt(design)
    const userPrompt = buildPass2UserPrompt(request, design)

    let lastError: Error | undefined
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const errorSuffix =
        lastError instanceof ParseError && lastError.validationErrors
          ? `\n\nPrevious attempt had validation errors:\n${lastError.validationErrors.join('\n')}\nPlease fix and return valid JSON.`
          : ''
      const content = await this.callAPI(
        system,
        attempt === 0 ? userPrompt : `${userPrompt}${errorSuffix}`,
      )
      try {
        return parseThemeManifest(content)
      } catch (err) {
        if (err instanceof ParseError) {
          lastError = err
          continue
        }
        throw err
      }
    }
    throw lastError ?? new Error('Failed to generate theme manifest')
  }

  async iterateTheme(
    manifest: ThemeManifest,
    instruction: string,
  ): Promise<Partial<ThemeManifest>> {
    const prompt = buildIterationPrompt(manifest, instruction)
    const content = await this.callAPI(
      'You are a WordPress theme developer. Return ONLY valid JSON.',
      prompt,
    )
    const raw = content
      .replace(/^```(?:json)?\s*\n?/m, '')
      .replace(/\n?```\s*$/m, '')
      .trim()
    return JSON.parse(raw) as Partial<ThemeManifest>
  }

  private async callAPI(system: string, userPrompt: string): Promise<string> {
    let lastError: Error | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await this.client.messages.create({
          model: MODEL,
          max_tokens: 32000,
          system,
          messages: [{ role: 'user', content: userPrompt }],
        })
        if (response.stop_reason === 'max_tokens') {
          console.warn('Response truncated (max_tokens reached). Retrying may help.')
        }
        const block = response.content[0]
        if (block.type === 'text') {
          return block.text
        }
        throw new Error('Unexpected response format from Claude API')
      } catch (err) {
        if (
          err instanceof Anthropic.RateLimitError ||
          (err instanceof Error && 'status' in err && (err as { status: number }).status === 429)
        ) {
          lastError = err as Error
          await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt))
          continue
        }
        if (err instanceof Anthropic.APIError) {
          throw new Error(
            `Claude API error (${err.status}): ${err.message}. Check your API key and try again.`,
          )
        }
        throw err
      }
    }
    throw new Error(
      `Claude API rate limited after 3 attempts: ${lastError?.message}`,
    )
  }
}
