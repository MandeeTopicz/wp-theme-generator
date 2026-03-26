import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider } from './provider'
import type { IterationResult } from './outputParser'
import {
  buildIterationSystemPrompt,
  buildIterationUserPrompt,
} from './promptBuilder'
import { parseIterationResult, ParseError } from './outputParser'

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'
const BACKOFF_BASE_MS = 1000

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class AnthropicProvider implements AIProvider {
  private client: Anthropic

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required. Set it in your environment or .env file.')
    }
    this.client = new Anthropic({ apiKey })
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    console.log('[anthropic] complete() %d system + %d user chars', systemPrompt.length, userMessage.length)
    return this.callAPI(systemPrompt, userMessage)
  }

  async iterateTheme(
    manifest: {
      templates: { name: string; content: string }[]
      templateParts: { name: string; content: string }[]
      patterns: { name: string; content: string }[]
    },
    instruction: string,
  ): Promise<IterationResult> {
    const system = buildIterationSystemPrompt()
    const userPrompt = buildIterationUserPrompt(manifest, instruction)

    let lastError: Error | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
      const prompt = attempt === 0
        ? userPrompt
        : `${userPrompt}\n\nPrevious attempt failed: ${lastError?.message}. Return valid JSON only.`
      const content = await this.callAPI(system, prompt)
      try {
        return parseIterationResult(content)
      } catch (err) {
        if (err instanceof ParseError) {
          lastError = err
          continue
        }
        throw err
      }
    }
    throw lastError ?? new Error('Failed to generate iteration result')
  }

  private async callAPI(system: string, userPrompt: string): Promise<string> {
    let lastError: Error | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log('[anthropic] Calling %s (attempt %d)', MODEL, attempt + 1)
        const t0 = Date.now()
        const response = await this.client.messages.create({
          model: MODEL,
          max_tokens: 16000,
          system,
          messages: [{ role: 'user', content: userPrompt }],
        })
        console.log('[anthropic] Response in %ds, stop=%s', ((Date.now() - t0) / 1000).toFixed(1), response.stop_reason)
        const block = response.content[0]
        if (block.type === 'text') return block.text
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
          throw new Error(`Claude API error (${err.status}): ${err.message}`)
        }
        throw err
      }
    }
    throw new Error(`Claude API rate limited after 3 attempts: ${lastError?.message}`)
  }
}