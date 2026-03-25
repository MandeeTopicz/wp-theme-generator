import type { ColorSlotMap, TemplateSkeleton } from './types'
import { section, heroCover, sectionHeading, paragraph, buttonPair, button, postGrid, featureCards, wideImage, splitSection, SPACE, TYPE, IMAGES } from './design-system'
import { buildSingleHtml, buildPageHtml, buildArchiveHtml, buildSearchHtml, build404Html, buildHeaderHtml, buildFooterHtml } from './shared'

/**
 * STARTER — Full-bleed hero image, features, 3-col posts, about split, CTA.
 * The most versatile layout. Works for any site type.
 */

function heroSection(s: ColorSlotMap): string {
  return heroCover(s, `
${sectionHeading('{{HERO_HEADING}}', { marginBottom: '1.25rem' })}
${paragraph('{{HERO_SUBHEADING}}', { align: 'center', size: TYPE.bodyLarge, marginBottom: '2.5rem' })}
${buttonPair('{{CTA_BUTTON}}', '{{SECTION_HEADING}}', s)}
`)
}

function featuresSection(s: ColorSlotMap): string {
  return section(s, 'bg', `
${sectionHeading('{{FEATURES_HEADING}}')}
${paragraph('{{ABOUT_DESCRIPTION}}', { align: 'center', size: TYPE.body, marginBottom: '3rem' })}
${featureCards(s)}
`)
}

function postsSection(s: ColorSlotMap): string {
  return section(s, 'surface', `
${sectionHeading('{{SECTION_HEADING}}')}
${postGrid(s)}
`)
}

function aboutSection(s: ColorSlotMap): string {
  const left = wideImage(IMAGES.about, IMAGES.aboutAlt)
  const right = `
${sectionHeading('{{ABOUT_HEADING}}', { align: 'left', marginBottom: '1.25rem' })}
${paragraph('{{ABOUT_DESCRIPTION}}', { size: TYPE.bodyLarge, marginBottom: '2rem' })}
${button('{{CTA_BUTTON}}', s, { center: false })}
`
  return splitSection(s, 'bg', left, right)
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
${featuresSection(s)}
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
