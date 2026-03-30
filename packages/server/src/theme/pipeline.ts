import type { GenerateRequest } from '@wp-theme-gen/shared'
import type { AIProvider } from '../ai/provider'
import type { DesignBrief, HeaderFooterResult, HomepageResult, InnerTemplatesResult } from '../ai/outputParser'
import {
  buildDesignBriefSystemPrompt,
  buildDesignBriefUserPrompt,
  buildHeaderFooterSystemPrompt,
  buildHeaderFooterUserPrompt,
  buildHomepageSystemPrompt,
  buildHomepageUserPrompt,
  buildInnerTemplatesSystemPrompt,
  buildInnerTemplatesUserPrompt,
  type DesignBriefForMarkup,
} from '../ai/promptBuilder'
import {
  parseDesignBrief,
  parseHeaderFooter,
  parseHomepage,
  parseInnerTemplates,
  ParseError,
} from '../ai/outputParser'

export interface PipelineProgress {
  step: 'brief' | 'header-footer' | 'homepage' | 'inner-templates' | 'assembling' | 'validating' | 'packaging'
  message: string
}

export interface PipelineResult {
  brief: DesignBrief
  headerFooter: HeaderFooterResult
  homepage: HomepageResult
  innerTemplates: InnerTemplatesResult
}

export type ProgressCallback = (progress: PipelineProgress) => void

export async function runGenerationPipeline(
  request: GenerateRequest,
  provider: AIProvider,
  onProgress: ProgressCallback,
): Promise<PipelineResult> {
  // Step 1: Design Brief
  onProgress({ step: 'brief', message: 'Crafting design brief...' })

  const briefRaw = await provider.complete(
    buildDesignBriefSystemPrompt(),
    buildDesignBriefUserPrompt(request),
  )

  const brief = parseDesignBrief(briefRaw)
  console.log('[pipeline] Brief: %s | hero=%s | header=%s | sections=%s',
    brief.name,
    brief.layoutPersonality.heroStyle,
    brief.layoutPersonality.headerStyle,
    brief.layoutPersonality.sectionsOrder.join(','),
  )

  const markupBrief: DesignBriefForMarkup = {
    name: brief.name,
    slug: brief.slug,
    colors: brief.colors,
    typography: brief.typography,
    layoutPersonality: brief.layoutPersonality,
    copyStrings: brief.copyStrings,
  }

  // Step 2: Header + Footer
  onProgress({ step: 'header-footer', message: 'Building header and footer...' })

  const headerFooterRaw = await provider.complete(
    buildHeaderFooterSystemPrompt(),
    buildHeaderFooterUserPrompt(markupBrief),
  )

  const headerFooter = parseHeaderFooter(headerFooterRaw)
  console.log('[pipeline] Header/footer: %d + %d chars',
    headerFooter.header.length,
    headerFooter.footer.length,
  )

  // Step 3: Homepage
  onProgress({ step: 'homepage', message: 'Designing homepage layout...' })

  const homepageRaw = await provider.complete(
    buildHomepageSystemPrompt(),
    buildHomepageUserPrompt(markupBrief, headerFooter.header),
  )

  const homepage = parseHomepage(homepageRaw)

  // Ensure index.html references the hero pattern instead of inlining hero markup
  const heroPatternRef = `<!-- wp:pattern {"slug":"${brief.slug}/hero"} /-->`
  if (!homepage.indexTemplate.includes('wp:pattern')) {
    // Inject hero pattern reference right after the header template-part
    homepage.indexTemplate = homepage.indexTemplate.replace(
      /(<!--\s*wp:template-part\s*\{[^}]*"slug"\s*:\s*"header"[^}]*\}\s*\/-->)/,
      `$1\n\n${heroPatternRef}`,
    )
    console.log('[pipeline] Injected hero pattern reference into index.html')
  }

  console.log('[pipeline] Homepage: index=%d chars, hero=%d chars',
    homepage.indexTemplate.length,
    homepage.heroPattern.length,
  )

  // Step 4: Inner Templates
  onProgress({ step: 'inner-templates', message: 'Creating inner page templates...' })

  const innerRaw = await provider.complete(
    buildInnerTemplatesSystemPrompt(),
    buildInnerTemplatesUserPrompt(markupBrief),
  )

  const innerTemplates = parseInnerTemplates(innerRaw)
  console.log('[pipeline] Inner templates: single=%d page=%d archive=%d 404=%d',
    innerTemplates.single.length,
    innerTemplates.page.length,
    innerTemplates.archive.length,
    innerTemplates['404'].length,
  )

  return { brief, headerFooter, homepage, innerTemplates }
}

export function pipelineResultToManifestInput(
  result: PipelineResult,
  themeName: string,
  themeSlug: string,
) {
  const { brief, headerFooter, homepage, innerTemplates } = result

  return {
    name: themeName,
    slug: themeSlug,
    colors: brief.colors,
    typography: brief.typography,
    layout: brief.layout,
    styleVariations: brief.styleVariations,
    templates: [
      { name: 'index.html', content: homepage.indexTemplate, isTemplatePart: false },
      { name: 'single.html', content: innerTemplates.single, isTemplatePart: false },
      { name: 'page.html', content: innerTemplates.page, isTemplatePart: false },
      { name: 'archive.html', content: innerTemplates.archive, isTemplatePart: false },
      { name: '404.html', content: innerTemplates['404'], isTemplatePart: false },
    ],
    templateParts: [
      { name: 'header.html', content: headerFooter.header, isTemplatePart: true },
      { name: 'footer.html', content: headerFooter.footer, isTemplatePart: true },
    ],
    patterns: [
      {
        name: 'hero.php',
        title: 'Hero',
        slug: `${themeSlug}/hero`,
        categories: ['featured'],
        content: homepage.heroPattern,
      },
    ],
  }
}

export { ParseError }