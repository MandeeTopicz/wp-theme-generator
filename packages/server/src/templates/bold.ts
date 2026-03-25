import type { ColorSlotMap, TemplateSkeleton } from './types'
import { section, sectionHeading, paragraph, button, heroCover, buttonPair, postGrid, featureCards, wideImage, splitSection, IMAGES, SPACE, TYPE } from './design-system'
import { buildSingleHtml, buildPageHtml, buildArchiveHtml, buildSearchHtml, build404Html, buildHeaderHtml, buildFooterHtml } from './shared'

/**
 * BOLD — High-impact business/SaaS.
 * Oversized hero, feature cards on third bg, accent CTA, reversed about split.
 */

function heroSection(s: ColorSlotMap): string {
  return heroCover(s, `
<!-- wp:heading {"level":2,"textAlign":"center","style":{"typography":{"fontSize":"clamp(3rem,8vw,5rem)","fontWeight":"800"},"spacing":{"margin":{"bottom":"1.25rem"}}}} -->
<h2 class="has-text-align-center">{{HERO_HEADING}}</h2>
<!-- /wp:heading -->
${paragraph('{{HERO_SUBHEADING}}', { align: 'center', size: TYPE.bodyLarge, marginBottom: '3rem' })}
${buttonPair('{{CTA_BUTTON}}', '{{CTA_SECONDARY}}', s)}
`)
}

function featuresSection(s: ColorSlotMap): string {
  return section(s, 'third', `
${sectionHeading('{{FEATURES_HEADING}}')}
${paragraph('{{ABOUT_DESCRIPTION}}', { align: 'center', size: TYPE.body, marginBottom: '3rem' })}
${featureCards(s)}
`)
}

function postsSection(s: ColorSlotMap): string {
  return section(s, 'bg', `
${sectionHeading('{{SECTION_HEADING}}')}
${postGrid(s)}
`)
}

function aboutSection(s: ColorSlotMap): string {
  const left = `
${sectionHeading('{{ABOUT_HEADING}}', { align: 'left', marginBottom: '1.25rem' })}
${paragraph('{{ABOUT_DESCRIPTION}}', { size: TYPE.bodyLarge, marginBottom: '2rem' })}
${button('{{CTA_BUTTON}}', s, { center: false })}
`
  const right = wideImage(IMAGES.about, IMAGES.aboutAlt)
  return splitSection(s, 'surface', left, right)
}

function ctaSection(s: ColorSlotMap): string {
  return section(s, 'accent', `
<!-- wp:heading {"level":2,"textAlign":"center","textColor":"${s.bg}","style":{"typography":{"fontSize":"${TYPE.h2}","fontWeight":"${TYPE.h2Weight}"},"spacing":{"margin":{"bottom":"${SPACE.sectionGap}"}}}} -->
<h2 class="has-text-align-center has-${s.bg}-color has-text-color">{{CTA_HEADING}}</h2>
<!-- /wp:heading -->
${paragraph('{{CTA_DESCRIPTION}}', { align: 'center', size: TYPE.bodyLarge, marginBottom: '2.5rem' })}
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<!-- wp:button {"backgroundColor":"${s.bg}","textColor":"${s.accent}","style":{"typography":{"fontSize":"${TYPE.small}","fontWeight":"600"},"border":{"radius":"${SPACE.buttonRadius}"},"spacing":{"padding":{"top":"${SPACE.buttonPaddingY}","bottom":"${SPACE.buttonPaddingY}","left":"${SPACE.buttonPaddingX}","right":"${SPACE.buttonPaddingX}"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-${s.accent}-color has-${s.bg}-background-color has-text-color has-background wp-element-button">{{CTA_BUTTON}}</a></div>
<!-- /wp:button -->
<!-- /wp:buttons -->
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
