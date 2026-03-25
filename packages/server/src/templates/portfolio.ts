import type { ColorSlotMap, TemplateSkeleton } from './types'
import { section, sectionHeading, paragraph, button, postGrid, wideImage, splitSection, IMAGES, SPACE, TYPE } from './design-system'
import { buildSingleHtml, buildPageHtml, buildArchiveHtml, buildSearchHtml, build404Html, buildHeaderHtml, buildFooterHtml } from './shared'

/**
 * PORTFOLIO — Image-focused, minimal text.
 * 2-column grid, lightweight hero, no features, CTA without button.
 */

function heroSection(s: ColorSlotMap): string {
  return section(s, 'bg', `
<!-- wp:heading {"level":2,"textAlign":"center","style":{"typography":{"fontSize":"${TYPE.hero}","fontWeight":"400"},"spacing":{"margin":{"bottom":"1.25rem"}}}} -->
<h2 class="has-text-align-center">{{HERO_HEADING}}</h2>
<!-- /wp:heading -->
${paragraph('{{HERO_SUBHEADING}}', { align: 'center', size: TYPE.body })}
`, { paddingY: SPACE.heroY })
}

function postsSection(s: ColorSlotMap): string {
  return section(s, 'bg', `
${sectionHeading('{{SECTION_HEADING}}')}
${postGrid(s, { columns: 2 })}
`)
}

function aboutSection(s: ColorSlotMap): string {
  const left = wideImage(IMAGES.about, IMAGES.aboutAlt)
  const right = `
${sectionHeading('{{ABOUT_HEADING}}', { align: 'left', marginBottom: '1.25rem' })}
${paragraph('{{ABOUT_DESCRIPTION}}', { size: TYPE.bodyLarge, marginBottom: '2rem' })}
${button('{{CTA_BUTTON}}', s, { center: false })}
`
  return splitSection(s, 'surface', left, right)
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
