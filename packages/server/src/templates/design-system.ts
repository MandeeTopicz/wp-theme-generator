/**
 * Shared design system. Every template imports from here.
 * NO template should hardcode font sizes, padding, or color application.
 */
import type { ColorSlotMap } from './types'

// ── Spacing ──────────────────────────────────────────
export const SPACE = {
  sectionY: '7rem',
  heroY: '8rem',
  sectionGap: '3.5rem',
  cardGap: '2rem',
  cardPadding: '1.5rem',
  cardRadius: '12px',
  imageRadius: '8px',
  buttonRadius: '8px',
  buttonPaddingY: '0.9rem',
  buttonPaddingX: '2.25rem',
} as const

// ── Typography ───────────────────────────────────────
export const TYPE = {
  hero: 'clamp(2.5rem, 6vw, 4.25rem)',
  h2: 'clamp(1.75rem, 3vw, 2.25rem)',
  h3: '1.2rem',
  body: '1rem',
  bodyLarge: '1.15rem',
  small: '0.9rem',
  xs: '0.8rem',
  heroWeight: '700',
  h2Weight: '700',
  h3Weight: '600',
  bodyLineHeight: '1.7',
} as const

// ── Stock images ─────────────────────────────────────
export const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&amp;h=800&amp;fit=crop&amp;q=80',
  about: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&amp;h=600&amp;fit=crop&amp;q=80',
  heroAlt: 'Hero background image',
  aboutAlt: 'About section image',
} as const

// ── Reusable block builders ──────────────────────────

/** Full-width section wrapper with bg color. */
export function section(s: ColorSlotMap, bgKey: keyof ColorSlotMap, content: string, opts?: { paddingY?: string }): string {
  const bg = s[bgKey]
  const py = opts?.paddingY ?? SPACE.sectionY
  return `<!-- wp:group {"backgroundColor":"${bg}","textColor":"${s.text}","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"${py}","bottom":"${py}"}}}} -->
<div class="wp-block-group alignfull has-${bg}-background-color has-${s.text}-color has-text-color has-background">
${content}
</div>
<!-- /wp:group -->`
}

/**
 * Hero section with colored background — reliable, no cover block issues.
 * Uses a wp:group with accent/third background for visual distinction.
 * Background image is placed as a separate wide image below the text.
 */
export function heroCover(s: ColorSlotMap, content: string): string {
  return `<!-- wp:group {"backgroundColor":"${s.third}","textColor":"${s.text}","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"9rem","bottom":"5rem"}}}} -->
<div class="wp-block-group alignfull has-${s.third}-background-color has-${s.text}-color has-text-color has-background">
${content}
<!-- wp:image {"align":"wide","sizeSlug":"full","style":{"border":{"radius":"${SPACE.imageRadius}"},"spacing":{"margin":{"top":"3rem"}}}} -->
<figure class="wp-block-image alignwide size-full has-custom-border"><img src="${IMAGES.hero}" alt="${IMAGES.heroAlt}"/></figure>
<!-- /wp:image -->
</div>
<!-- /wp:group -->`
}

/** Section heading (h2). */
export function sectionHeading(text: string, opts?: { align?: 'center' | 'left'; marginBottom?: string }): string {
  const align = opts?.align ?? 'center'
  const mb = opts?.marginBottom ?? SPACE.sectionGap
  const alignAttr = align === 'center' ? '"textAlign":"center",' : ''
  const alignClass = align === 'center' ? 'has-text-align-center' : ''
  return `<!-- wp:heading {"level":2,${alignAttr}"style":{"typography":{"fontSize":"${TYPE.h2}","fontWeight":"${TYPE.h2Weight}"},"spacing":{"margin":{"bottom":"${mb}"}}}} -->
<h2 class="${alignClass}">${text}</h2>
<!-- /wp:heading -->`
}

/** Body paragraph. Never uses muted — always inherits section textColor for contrast. */
export function paragraph(text: string, opts?: { align?: 'center' | 'left'; size?: string; marginBottom?: string }): string {
  const align = opts?.align ?? 'left'
  const size = opts?.size ?? TYPE.body
  const mb = opts?.marginBottom ?? '0'
  const alignAttr = align === 'center' ? `"align":"center",` : ''
  const alignClass = align === 'center' ? 'has-text-align-center' : ''
  return `<!-- wp:paragraph {${alignAttr}"style":{"typography":{"fontSize":"${size}","lineHeight":"${TYPE.bodyLineHeight}"},"spacing":{"margin":{"bottom":"${mb}"}}}} -->
<p class="${alignClass}">${text}</p>
<!-- /wp:paragraph -->`
}

/** Accent button */
export function button(text: string, s: ColorSlotMap, opts?: { center?: boolean }): string {
  const center = opts?.center ?? true
  const wrapper = center
    ? `<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->`
    : `<!-- wp:buttons -->`
  return `${wrapper}
<!-- wp:button {"backgroundColor":"${s.accent}","textColor":"${s.bg}","style":{"typography":{"fontSize":"${TYPE.small}","fontWeight":"600"},"border":{"radius":"${SPACE.buttonRadius}"},"spacing":{"padding":{"top":"${SPACE.buttonPaddingY}","bottom":"${SPACE.buttonPaddingY}","left":"${SPACE.buttonPaddingX}","right":"${SPACE.buttonPaddingX}"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-${s.bg}-color has-${s.accent}-background-color has-text-color has-background wp-element-button">${text}</a></div>
<!-- /wp:button -->
<!-- /wp:buttons -->`
}

/** Ghost/outline button (for hero second CTA) */
export function ghostButton(text: string, s: ColorSlotMap): string {
  return `<!-- wp:button {"className":"is-style-outline","style":{"typography":{"fontSize":"${TYPE.small}","fontWeight":"600"},"border":{"radius":"${SPACE.buttonRadius}","width":"2px"},"spacing":{"padding":{"top":"${SPACE.buttonPaddingY}","bottom":"${SPACE.buttonPaddingY}","left":"${SPACE.buttonPaddingX}","right":"${SPACE.buttonPaddingX}"}}}} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button">${text}</a></div>
<!-- /wp:button -->`
}

/** Two buttons side by side (solid + ghost) */
export function buttonPair(primaryText: string, secondaryText: string, s: ColorSlotMap, opts?: { center?: boolean }): string {
  const center = opts?.center ?? true
  const justify = center ? '"justifyContent":"center",' : ''
  return `<!-- wp:buttons {"layout":{"type":"flex",${justify}"flexWrap":"wrap"},"style":{"spacing":{"blockGap":"1rem"}}} -->
<!-- wp:button {"backgroundColor":"${s.accent}","textColor":"${s.bg}","style":{"typography":{"fontSize":"${TYPE.small}","fontWeight":"600"},"border":{"radius":"${SPACE.buttonRadius}"},"spacing":{"padding":{"top":"${SPACE.buttonPaddingY}","bottom":"${SPACE.buttonPaddingY}","left":"${SPACE.buttonPaddingX}","right":"${SPACE.buttonPaddingX}"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-${s.bg}-color has-${s.accent}-background-color has-text-color has-background wp-element-button">${primaryText}</a></div>
<!-- /wp:button -->
${ghostButton(secondaryText, s)}
<!-- /wp:buttons -->`
}

/** Post card for use inside wp:post-template */
export function postCard(s: ColorSlotMap, opts?: { imageAspect?: string; showExcerpt?: boolean }): string {
  const aspect = opts?.imageAspect ?? '16/9'
  const showExcerpt = opts?.showExcerpt ?? true
  const excerptBlock = showExcerpt
    ? `\n<!-- wp:post-excerpt {"excerptLength":18,"style":{"typography":{"fontSize":"${TYPE.small}","lineHeight":"1.55"}}} /-->`
    : ''
  return `<!-- wp:group {"backgroundColor":"${s.surface}","style":{"spacing":{"padding":{"top":"0","bottom":"${SPACE.cardPadding}","left":"0","right":"0"},"blockGap":"0"},"border":{"radius":"${SPACE.cardRadius}"}}} -->
<div class="wp-block-group has-${s.surface}-background-color has-background">
<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"${aspect}","style":{"border":{"radius":"${SPACE.cardRadius} ${SPACE.cardRadius} 0 0"}}} /-->
<!-- wp:group {"style":{"spacing":{"padding":{"top":"1.25rem","bottom":"0.5rem","left":"${SPACE.cardPadding}","right":"${SPACE.cardPadding}"},"blockGap":"0.6rem"}}} -->
<div class="wp-block-group">
<!-- wp:post-title {"isLink":true,"style":{"typography":{"fontSize":"${TYPE.h3}","fontWeight":"${TYPE.h3Weight}","lineHeight":"1.35"}}} /-->${excerptBlock}
<!-- wp:post-date {"style":{"typography":{"fontSize":"${TYPE.xs}"}}} /-->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->`
}

/** 3-column feature cards with icon-like heading */
export function featureCards(s: ColorSlotMap): string {
  function card(titleKey: string, descKey: string): string {
    return `<!-- wp:column {"style":{"spacing":{"padding":{"top":"2.5rem","bottom":"2.5rem","left":"2rem","right":"2rem"}},"border":{"radius":"${SPACE.cardRadius}"}},"backgroundColor":"${s.surface}"} -->
<div class="wp-block-column has-${s.surface}-background-color has-background">
<!-- wp:heading {"level":3,"style":{"typography":{"fontSize":"${TYPE.h3}","fontWeight":"${TYPE.h3Weight}"},"spacing":{"margin":{"bottom":"0.75rem"}}}} -->
<h3>${titleKey}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"style":{"typography":{"fontSize":"${TYPE.small}","lineHeight":"${TYPE.bodyLineHeight}"}}} -->
<p>${descKey}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`
  }

  return `<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"${SPACE.cardGap}"}}}} -->
<div class="wp-block-columns alignwide">
${card('{{FEATURE_1_TITLE}}', '{{FEATURE_1_DESC}}')}
${card('{{FEATURE_2_TITLE}}', '{{FEATURE_2_DESC}}')}
${card('{{FEATURE_3_TITLE}}', '{{FEATURE_3_DESC}}')}
</div>
<!-- /wp:columns -->`
}

/** Standard post grid query (3 columns) */
export function postGrid(s: ColorSlotMap, opts?: { columns?: number; perPage?: number; queryId?: number }): string {
  const cols = opts?.columns ?? 3
  const perPage = opts?.perPage ?? 3
  const qid = opts?.queryId ?? 10
  return `<!-- wp:query {"queryId":${qid},"query":{"perPage":${perPage},"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","inherit":false}} -->
<!-- wp:post-template {"layout":{"type":"grid","columnCount":${cols}},"style":{"spacing":{"blockGap":"${SPACE.cardGap}"}}} -->
${postCard(s)}
<!-- /wp:post-template -->
<!-- wp:query-pagination {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"top":"2.5rem"}}}} -->
<!-- wp:query-pagination-previous /-->
<!-- wp:query-pagination-numbers /-->
<!-- wp:query-pagination-next /-->
<!-- /wp:query-pagination -->
<!-- wp:query-no-results -->
<!-- wp:paragraph -->
<p>No posts found.</p>
<!-- /wp:paragraph -->
<!-- /wp:query-no-results -->
<!-- /wp:query -->`
}

/** Single-column post list (for editorial) */
export function postList(s: ColorSlotMap): string {
  return `<!-- wp:query {"queryId":10,"query":{"perPage":5,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","inherit":false}} -->
<!-- wp:post-template {"style":{"spacing":{"blockGap":"2.5rem"}}} -->
<!-- wp:group {"style":{"spacing":{"padding":{"bottom":"2.5rem"},"blockGap":"0.75rem"},"border":{"bottom":{"color":"var(--wp--preset--color--${s.surface})","width":"1px"}}}} -->
<div class="wp-block-group">
<!-- wp:post-title {"isLink":true,"style":{"typography":{"fontSize":"clamp(1.25rem, 3vw, 1.75rem)","fontWeight":"700","lineHeight":"1.3"}}} /-->
<!-- wp:post-excerpt {"excerptLength":30,"style":{"typography":{"fontSize":"${TYPE.body}","lineHeight":"${TYPE.bodyLineHeight}"}}} /-->
<!-- wp:post-date {"style":{"typography":{"fontSize":"${TYPE.xs}"}}} /-->
</div>
<!-- /wp:group -->
<!-- /wp:post-template -->
<!-- wp:query-pagination {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"top":"2.5rem"}}}} -->
<!-- wp:query-pagination-previous /-->
<!-- wp:query-pagination-numbers /-->
<!-- wp:query-pagination-next /-->
<!-- /wp:query-pagination -->
<!-- /wp:query -->`
}

/** Wide image block */
export function wideImage(src: string, alt: string): string {
  return `<!-- wp:image {"align":"wide","sizeSlug":"full","style":{"border":{"radius":"${SPACE.imageRadius}"}}} -->
<figure class="wp-block-image alignwide size-full has-custom-border"><img src="${src}" alt="${alt}"/></figure>
<!-- /wp:image -->`
}

/** Split section: two-column layout */
export function splitSection(s: ColorSlotMap, bgKey: keyof ColorSlotMap, left: string, right: string): string {
  return section(s, bgKey, `<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"4rem"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"50%"} -->
<div class="wp-block-column">
${left}
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"50%"} -->
<div class="wp-block-column">
${right}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->`)
}

/** Rich footer with 3 columns: brand, navigation, social */
export function richFooter(s: ColorSlotMap): string {
  return `<!-- wp:group {"backgroundColor":"${s.bg}","textColor":"${s.text}","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"4rem","bottom":"2rem"}}}} -->
<div class="wp-block-group alignfull has-${s.bg}-background-color has-${s.text}-color has-text-color has-background">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"3rem"},"margin":{"bottom":"3rem"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"40%"} -->
<div class="wp-block-column">
<!-- wp:site-title {"style":{"typography":{"fontWeight":"700","fontSize":"1.25rem"},"spacing":{"margin":{"bottom":"0.75rem"}}}} /-->
<!-- wp:paragraph {"style":{"typography":{"fontSize":"${TYPE.small}","lineHeight":"1.6"}}} -->
<p>{{ABOUT_DESCRIPTION}}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"25%"} -->
<div class="wp-block-column">
<!-- wp:heading {"level":3,"style":{"typography":{"fontSize":"${TYPE.small}","fontWeight":"700","textTransform":"uppercase","letterSpacing":"0.05em"},"spacing":{"margin":{"bottom":"1rem"}}}} -->
<h3>Pages</h3>
<!-- /wp:heading -->
<!-- wp:navigation {"ariaLabel":"Footer navigation","layout":{"type":"flex","orientation":"vertical"},"style":{"spacing":{"blockGap":"0.5rem"},"typography":{"fontSize":"${TYPE.small}"}}} /-->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"35%"} -->
<div class="wp-block-column">
<!-- wp:heading {"level":3,"style":{"typography":{"fontSize":"${TYPE.small}","fontWeight":"700","textTransform":"uppercase","letterSpacing":"0.05em"},"spacing":{"margin":{"bottom":"1rem"}}}} -->
<h3>Connect</h3>
<!-- /wp:heading -->
<!-- wp:social-links {"iconColor":"${s.text}","iconColorValue":"currentColor","style":{"spacing":{"blockGap":{"left":"1rem"}}},"className":"is-style-logos-only"} -->
<ul class="wp-block-social-links has-icon-color is-style-logos-only"><!-- wp:social-link {"url":"#","service":"twitter"} /--><!-- wp:social-link {"url":"#","service":"instagram"} /--><!-- wp:social-link {"url":"#","service":"linkedin"} /--><!-- wp:social-link {"url":"#","service":"facebook"} /--></ul>
<!-- /wp:social-links -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:separator {"backgroundColor":"${s.surface}","style":{"spacing":{"margin":{"bottom":"1.5rem"}}}} -->
<hr class="wp-block-separator has-${s.surface}-background-color has-background"/>
<!-- /wp:separator -->
<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"${TYPE.xs}"}}} -->
<p class="has-text-align-center">{{COPYRIGHT}}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->`
}
