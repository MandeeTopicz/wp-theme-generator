import Anthropic from '@anthropic-ai/sdk'
import type { GenerateRequest } from '@wp-theme-gen/shared'
import type { AIProvider, DesignSpec, IterationResult } from './provider'
import {
  buildPass1SystemPrompt,
  buildPass1UserPrompt,
  buildIterationSystemPrompt,
  buildIterationUserPrompt,
} from './promptBuilder'
import { parseDesignSpec, ParseError } from './outputParser'

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'
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
    console.log('[pass1] Sending to Claude (%d char system, %d char user prompt)', system.length, userPrompt.length)

    let lastError: Error | undefined
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) console.log('[pass1] Retry attempt %d...', attempt + 1)
      const t0 = Date.now()
      const content = await this.callAPI(
        system,
        attempt === 0
          ? userPrompt
          : `${userPrompt}\n\nPrevious attempt failed: ${lastError?.message}. Please fix and return valid JSON.`,
      )
      console.log('[pass1] Claude responded in %ds (%d chars)', ((Date.now() - t0) / 1000).toFixed(1), content.length)
      try {
        const spec = parseDesignSpec(content)
        console.log('[pass1] Parsed design spec: %s (%d colors, narrative: %d chars)', spec.name, spec.colors?.length ?? 0, spec.designNarrative?.length ?? 0)
        return spec
      } catch (err) {
        if (err instanceof ParseError) {
          console.log('[pass1] Parse failed: %s', err.message.slice(0, 120))
          lastError = err
          continue
        }
        throw err
      }
    }
    throw lastError ?? new Error('Failed to generate design spec')
  }

  async iterateTheme(
    manifest: { templates: { name: string; content: string }[]; templateParts: { name: string; content: string }[]; patterns: { name: string; content: string }[] },
    instruction: string,
  ): Promise<IterationResult> {
    const system = buildIterationSystemPrompt()
    const userPrompt = buildIterationUserPrompt(manifest, instruction)
    const content = await this.callAPI(system, userPrompt)
    const raw = content
      .replace(/^```(?:json)?\s*\n?/m, '')
      .replace(/\n?```\s*$/m, '')
      .trim()
    return JSON.parse(raw) as IterationResult
  }

  private async callAPI(system: string, userPrompt: string): Promise<string> {
    let lastError: Error | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log('[api] Calling Claude %s (attempt %d, %d system + %d user chars)', MODEL, attempt + 1, system.length, userPrompt.length)
        const t0 = Date.now()
        const response = await this.client.messages.create({
          model: MODEL,
          max_tokens: 16000,
          system,
          messages: [{ role: 'user', content: userPrompt }],
        })
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
        console.log('[api] Response: stop=%s, %d content blocks, %ds', response.stop_reason, response.content.length, elapsed)
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
