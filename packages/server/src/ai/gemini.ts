import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GenerateRequest } from '@wp-theme-gen/shared'
import type { AIProvider, DesignSpec, IterationResult } from './provider'
import {
  buildPass1SystemPrompt,
  buildPass1UserPrompt,
  buildIterationSystemPrompt,
  buildIterationUserPrompt,
} from './promptBuilder'
import { parseDesignSpec, ParseError } from './outputParser'

const MAX_RETRIES = 2
const BACKOFF_BASE_MS = 1000

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim()
}

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI
  private modelName: string

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GEMINI_API_KEY
    if (!key) {
      throw new Error(
        'GEMINI_API_KEY is required. Set it in your environment or .env file.',
      )
    }
    this.genAI = new GoogleGenerativeAI(key)
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  }

  async generateDesignSpec(request: GenerateRequest): Promise<DesignSpec> {
    const system = buildPass1SystemPrompt()
    const userPrompt = buildPass1UserPrompt(request)

    let lastError: Error | undefined
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const prompt =
        attempt === 0
          ? userPrompt
          : `${userPrompt}\n\nPrevious attempt failed: ${lastError?.message}. Please fix and return valid JSON.`
      const content = await this.callAPI(system, prompt)
      try {
        return parseDesignSpec(content)
      } catch (err) {
        if (err instanceof ParseError) {
          console.log('[gemini-pass1] Parse failed (attempt %d): %s', attempt + 1, err.message.slice(0, 120))
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
    console.log('[gemini-iterate] Sending iteration request (%d chars)', userPrompt.length)

    const content = await this.callAPI(system, userPrompt)
    try {
      return JSON.parse(stripCodeFences(content)) as IterationResult
    } catch {
      // Retry once with error context
      const retryContent = await this.callAPI(
        system,
        `${userPrompt}\n\nPrevious attempt returned invalid JSON. Return ONLY valid JSON.`,
      )
      return JSON.parse(stripCodeFences(retryContent)) as IterationResult
    }
  }

  private async callAPI(system: string, userPrompt: string): Promise<string> {
    let lastError: Error | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log('[gemini-api] Calling %s (attempt %d)', this.modelName, attempt + 1)
        const t0 = Date.now()
        const model = this.genAI.getGenerativeModel({ model: this.modelName })
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: system,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 16000,
          },
        })
        const text = result.response.text()
        console.log('[gemini-api] Response in %ds (%d chars)', ((Date.now() - t0) / 1000).toFixed(1), text.length)
        return stripCodeFences(text)
      } catch (err) {
        const status = (err as { status?: number }).status
        if (status === 429) {
          lastError = err as Error
          const delay = BACKOFF_BASE_MS * Math.pow(2, attempt)
          console.log('[gemini-api] Rate limited, backing off %dms', delay)
          await sleep(delay)
          continue
        }
        throw err
      }
    }
    throw new Error(
      `Gemini API rate limited after 3 attempts: ${lastError?.message}`,
    )
  }
}
