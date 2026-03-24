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

  async generateThemeManifest(
    request: GenerateRequest,
    design: DesignSpec,
  ): Promise<ThemeManifest> {
    const system = buildPass2SystemPrompt(design)
    const userPrompt = buildPass2UserPrompt(request, design)
    console.log('[pass2] Sending to Claude (%d char system, %d char user prompt)', system.length, userPrompt.length)

    let lastError: Error | undefined
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      let retryPrompt = userPrompt
      if (attempt > 0 && lastError) {
        const thinMatch = lastError.message.match(/too thin \((\d+) chars\)/)
        if (thinMatch) {
          retryPrompt = `CRITICAL FAILURE: Your previous response generated an index.html template that was only ${thinMatch[1]} characters long containing just a paragraph block. This is WRONG.

The index.html MUST contain ALL of these elements:
1. <!-- wp:template-part {"slug":"header","tagName":"header"} /-->
2. A <!-- wp:cover --> or <!-- wp:group --> block for the hero section with at minimum a heading and paragraph
3. A <!-- wp:query --> block with <!-- wp:post-template --> containing <!-- wp:post-title /-->, <!-- wp:post-excerpt /-->, and <!-- wp:post-featured-image /-->
4. <!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->

Do not generate a template with only wp:paragraph blocks. The template must be at minimum 500 characters long.

Here is the EXACT structure required:
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
<!-- wp:cover {"overlayColor":"primary","minHeight":100,"minHeightUnit":"vh","isDark":true,"align":"full"} -->
<div class="wp-block-cover alignfull"><!-- wp:group {"layout":{"type":"constrained"}} --><div class="wp-block-group"><!-- wp:site-title {"level":1} /--><!-- wp:site-tagline /--></div><!-- /wp:group --></div>
<!-- /wp:cover -->
<!-- wp:query {"queryId":1,"query":{"perPage":6,"postType":"post"}} -->
<div class="wp-block-query"><!-- wp:post-template {"layout":{"type":"grid","columnCount":3}} --><!-- wp:post-featured-image {"isLink":true} /--><!-- wp:post-title {"isLink":true,"level":3} /--><!-- wp:post-excerpt /--><!-- /wp:post-template --><!-- wp:query-pagination --><div class="wp-block-query-pagination"><!-- wp:query-pagination-previous /--><!-- wp:query-pagination-numbers /--><!-- wp:query-pagination-next /--></div><!-- /wp:query-pagination --></div>
<!-- /wp:query -->
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->

${userPrompt}`
        } else {
          const errorSuffix =
            lastError instanceof ParseError && lastError.validationErrors
              ? `\n\nPrevious attempt had validation errors:\n${lastError.validationErrors.join('\n')}\nPlease fix and return valid JSON.`
              : `\n\nPrevious attempt failed: ${lastError.message}\nPlease fix and return valid JSON.`
          retryPrompt = `${userPrompt}${errorSuffix}`
        }
        console.log(`[generate] Retrying Pass 2 (attempt ${attempt + 1}): ${lastError.message.slice(0, 100)}`)
      }
      const t0 = Date.now()
      const content = await this.callAPI(system, retryPrompt)
      console.log('[pass2] Claude responded in %ds (%d chars)', ((Date.now() - t0) / 1000).toFixed(1), content.length)
      try {
        const manifest = parseThemeManifest(content)
        const indexTpl = manifest.templates?.find((t) => t.name === 'index' || t.name === 'index.html')
        console.log('[pass2] Parsed manifest: %d templates, %d parts, %d patterns, index=%d chars',
          manifest.templates?.length ?? 0,
          manifest.templateParts?.length ?? 0,
          manifest.patterns?.length ?? 0,
          indexTpl?.content?.length ?? 0,
        )
        return manifest
      } catch (err) {
        if (err instanceof ParseError) {
          console.log('[pass2] Parse failed: %s', err.message.slice(0, 150))
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
        console.log('[api] Calling Claude %s (attempt %d, %d system + %d user chars)', MODEL, attempt + 1, system.length, userPrompt.length)
        const t0 = Date.now()
        const response = await this.client.messages.create({
          model: MODEL,
          max_tokens: 32000,
          system,
          messages: [{ role: 'user', content: userPrompt }],
        })
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
        console.log('[api] Response: stop=%s, %d content blocks, %ds', response.stop_reason, response.content.length, elapsed)
        if (response.usage) {
          console.log('[api] Tokens: input=%d, output=%d', response.usage.input_tokens, response.usage.output_tokens)
        }
        if (response.stop_reason === 'max_tokens') {
          console.warn('[api] WARNING: Response truncated (max_tokens reached)')
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
