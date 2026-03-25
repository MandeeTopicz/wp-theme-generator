import type { ColorSlotMap, TemplateSkeleton } from './types'
import { section, sectionHeading, paragraph, button, postGrid, postCard, SPACE, TYPE } from './design-system'
import { buildSingleHtml, buildPageHtml, buildArchiveHtml, buildSearchHtml, build404Html, buildHeaderHtml, buildFooterHtml } from './shared'

/**
 * MAGAZINE — Content-dense, featured post prominence, visual hierarchy.
 * No about section. Hero + featured + grid + CTA.
 */

function heroSection(s: ColorSlotMap): string {
  return section(s, 'surface', `
${sectionHeading('{{HERO_HEADING}}', { marginBottom: '1.25rem' })}
${paragraph('{{HERO_SUBHEADING}}', { align: 'center', size: TYPE.bodyLarge })}
`, { paddingY: SPACE.heroY })
}

function featuredPostSection(s: ColorSlotMap): string {
  return section(s, 'surface', `
<!-- wp:query {"queryId":40,"query":{"perPage":1,"pages":1,"offset":0,"postType":"post","order":"desc","orderBy":"date","inherit":false}} -->
<!-- wp:post-template {"style":{"spacing":{"blockGap":"0"}}} -->
${postCard(s, { imageAspect: '16/9' })}
<!-- /wp:post-template -->
<!-- wp:query-no-results -->
<!-- wp:paragraph -->
<p>No featured posts found.</p>
<!-- /wp:paragraph -->
<!-- /wp:query-no-results -->
<!-- /wp:query -->
`)
}

function postsSection(s: ColorSlotMap): string {
  return section(s, 'bg', `
${sectionHeading('{{SECTION_HEADING}}')}
${postGrid(s, { columns: 3, perPage: 3, queryId: 11 })}
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
${featuredPostSection(s)}
${postsSection(s)}
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
