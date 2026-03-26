import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIProvider } from './provider'
import type { IterationResult } from './outputParser'
import {
  buildIterationSystemPrompt,
  buildIterationUserPrompt,
} from './promptBuilder'
import { parseIterationResult, ParseError } from './outputParser'

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
      throw new Error('GEMINI_API_KEY is required. Set it in your environment or .env file.')
    }
    this.genAI = new GoogleGenerativeAI(key)
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    console.log('[gemini] complete() %d system + %d user chars', systemPrompt.length, userMessage.length)
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
        console.log('[gemini] Calling %s (attempt %d)', this.modelName, attempt + 1)
        const t0 = Date.now()
        const model = this.genAI.getGenerativeModel({ model: this.modelName })
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: system,
          generationConfig: { temperature: 0.7, maxOutputTokens: 16000 },
        })
        const text = stripCodeFences(result.response.text())
        console.log('[gemini] Response in %ds (%d chars)', ((Date.now() - t0) / 1000).toFixed(1), text.length)
        return text
      } catch (err) {
        if ((err as { status?: number }).status === 429) {
          lastError = err as Error
          await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt))
          continue
        }
        throw err
      }
    }
    throw new Error(`Gemini API rate limited after 3 attempts: ${lastError?.message}`)
  }
}