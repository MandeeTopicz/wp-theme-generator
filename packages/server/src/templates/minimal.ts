import type { ColorSlotMap, TemplateSkeleton } from './types'
import { section, sectionHeading, paragraph, postGrid, SPACE, TYPE } from './design-system'
import { buildSingleHtml, buildPageHtml, buildArchiveHtml, buildSearchHtml, build404Html, buildHeaderHtml, buildFooterHtml } from './shared'

/**
 * MINIMAL — Maximum whitespace, understated, light font weights.
 * No features, no images, no buttons. Just text breathing.
 */

function heroSection(s: ColorSlotMap): string {
  return section(s, 'bg', `
<!-- wp:heading {"textAlign":"center","level":1,"style":{"typography":{"fontSize":"${TYPE.hero}","fontWeight":"400","letterSpacing":"-0.02em","lineHeight":"1.2"},"spacing":{"margin":{"bottom":"1.25rem"}}}} -->
<h1 class="has-text-align-center">{{HERO_HEADING}}</h1>
<!-- /wp:heading -->
${paragraph('{{HERO_SUBHEADING}}', { align: 'center', size: TYPE.bodyLarge })}
`, { paddingY: '10rem' })
}

function postsSection(s: ColorSlotMap): string {
  return section(s, 'bg', `
${sectionHeading('{{SECTION_HEADING}}')}
${postGrid(s)}
`)
}

function aboutSection(s: ColorSlotMap): string {
  return section(s, 'surface', `
${sectionHeading('{{ABOUT_HEADING}}')}
${paragraph('{{ABOUT_DESCRIPTION}}', { align: 'center', size: TYPE.bodyLarge })}
`)
}

function ctaSection(s: ColorSlotMap): string {
  return section(s, 'third', `
${sectionHeading('{{CTA_HEADING}}')}
${paragraph('{{CTA_DESCRIPTION}}', { align: 'center', size: TYPE.bodyLarge })}
`)
}

function buildIndexHtml(s: ColorSlotMap): string {
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
${heroSection(s)}
${postsSection(s)}
${aboutSection(s)}
${ctaSection(s)}
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->`
}

export function buildSkeleton(s: ColorSlotMap): TemplateSkeleton {
  return {
    templates: [
      { name: 'index', content: buildIndexHtml(s) },
      { name: 'single', content: buildSingleHtml(s) },
      { name: 'page', content: buildPageHtml(s) },
      { name: 'archive', content: buildArchiveHtml(s) },
      { name: 'search', content: buildSearchHtml(s) },
      { name: '404', content: build404Html(s) },
    ],
    templateParts: [
      { name: 'header', content: buildHeaderHtml(s) },
      { name: 'footer', content: buildFooterHtml(s) },
    ],
    patterns: [
      { name: 'hero', content: heroSection(s) },
      { name: 'cta', content: ctaSection(s) },
      { name: 'query-loop', content: postsSection(s) },
    ],
  }
}
