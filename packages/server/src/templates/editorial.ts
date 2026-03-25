import type { ColorSlotMap, TemplateSkeleton } from './types'
import { section, sectionHeading, paragraph, button, postList, SPACE, TYPE } from './design-system'
import { buildSingleHtml, buildPageHtml, buildArchiveHtml, buildSearchHtml, build404Html, buildHeaderHtml, buildFooterHtml } from './shared'

/**
 * EDITORIAL — Text-first magazine feel.
 * No hero image, no feature cards. Single-column post list, centered about.
 */

function heroSection(s: ColorSlotMap): string {
  return section(s, 'bg', `
${sectionHeading('{{HERO_HEADING}}', { marginBottom: '1.25rem' })}
${paragraph('{{HERO_SUBHEADING}}', { align: 'center', size: TYPE.bodyLarge })}
`, { paddingY: SPACE.heroY })
}

function postsSection(s: ColorSlotMap): string {
  return section(s, 'bg', `
${sectionHeading('{{SECTION_HEADING}}')}
${postList(s)}
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
${paragraph('{{CTA_DESCRIPTION}}', { align: 'center', size: TYPE.bodyLarge, marginBottom: '2.5rem' })}
${button('{{CTA_BUTTON}}', s)}
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
