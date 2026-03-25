import type { ColorSlotMap } from './types'

export function buildSingleHtml(s: ColorSlotMap): string {
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
<!-- wp:group {"backgroundColor":"${s.bg}","textColor":"${s.text}","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"3rem","bottom":"5rem"}}}} -->
<div class="wp-block-group alignfull has-${s.bg}-background-color has-${s.text}-color has-text-color has-background">
<!-- wp:post-featured-image {"align":"wide","style":{"border":{"radius":"8px"},"spacing":{"margin":{"bottom":"2rem"}}}} /-->
<!-- wp:post-title {"level":1,"style":{"typography":{"fontSize":"clamp(2rem, 5vw, 3.5rem)","fontWeight":"700","letterSpacing":"-0.02em"},"spacing":{"margin":{"bottom":"1rem"}}}} /-->
<!-- wp:group {"layout":{"type":"flex","flexWrap":"wrap"},"style":{"spacing":{"blockGap":"1rem","margin":{"bottom":"2rem"}}}} -->
<div class="wp-block-group">
<!-- wp:post-date {"textColor":"${s.accent}","style":{"typography":{"fontSize":"0.85rem"}}} /-->
<!-- wp:post-author {"showAvatar":false,"textColor":"${s.muted}","style":{"typography":{"fontSize":"0.85rem"}}} /-->
</div>
<!-- /wp:group -->
<!-- wp:separator {"backgroundColor":"${s.surface}"} -->
<hr class="wp-block-separator has-${s.surface}-background-color has-background"/>
<!-- /wp:separator -->
<!-- wp:post-content {"style":{"spacing":{"margin":{"top":"2rem"}}}} /-->
<!-- wp:group {"style":{"spacing":{"margin":{"top":"3rem"}}}} -->
<div class="wp-block-group">
<!-- wp:post-terms {"term":"category","textColor":"${s.accent}"} /-->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->`
}

export function buildPageHtml(s: ColorSlotMap): string {
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
<!-- wp:group {"backgroundColor":"${s.bg}","textColor":"${s.text}","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"4rem","bottom":"5rem"}}}} -->
<div class="wp-block-group alignfull has-${s.bg}-background-color has-${s.text}-color has-text-color has-background">
<!-- wp:post-title {"level":1,"style":{"typography":{"fontSize":"clamp(2rem, 5vw, 3rem)","fontWeight":"700"},"spacing":{"margin":{"bottom":"2rem"}}}} /-->
<!-- wp:post-featured-image {"align":"wide","style":{"border":{"radius":"8px"},"spacing":{"margin":{"bottom":"2rem"}}}} /-->
<!-- wp:post-content /-->
</div>
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->`
}

export function buildArchiveHtml(s: ColorSlotMap): string {
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
<!-- wp:group {"backgroundColor":"${s.bg}","textColor":"${s.text}","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"4rem","bottom":"5rem"}}}} -->
<div class="wp-block-group alignfull has-${s.bg}-background-color has-${s.text}-color has-text-color has-background">
<!-- wp:query-title {"type":"archive","style":{"typography":{"fontSize":"2.5rem","fontWeight":"700"},"spacing":{"margin":{"bottom":"2rem"}}}} /-->
<!-- wp:separator {"backgroundColor":"${s.accent}"} -->
<hr class="wp-block-separator has-${s.accent}-background-color has-background"/>
<!-- /wp:separator -->
<!-- wp:query {"queryId":20,"query":{"perPage":6,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","inherit":true}} -->
<!-- wp:post-template {"layout":{"type":"grid","columnCount":3},"style":{"spacing":{"blockGap":"2rem"}}} -->
<!-- wp:group {"backgroundColor":"${s.surface}","style":{"spacing":{"padding":{"top":"1.25rem","bottom":"1.5rem","left":"1.25rem","right":"1.25rem"},"blockGap":"0"},"border":{"radius":"12px"}}} -->
<div class="wp-block-group has-${s.surface}-background-color has-background">
<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"3/2","style":{"border":{"radius":"12px 12px 0 0"}}} /-->
<!-- wp:group {"style":{"spacing":{"padding":{"top":"1.5rem","bottom":"1rem","left":"2rem","right":"2rem"},"blockGap":"0.75rem"}}} -->
<div class="wp-block-group">
<!-- wp:post-title {"isLink":true,"style":{"typography":{"fontSize":"1.15rem","fontWeight":"700"}}} /-->
<!-- wp:post-date {"textColor":"${s.accent}","style":{"typography":{"fontSize":"0.8rem"}}} /-->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
<!-- /wp:post-template -->
<!-- wp:query-pagination {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"top":"3rem"}}}} -->
<!-- wp:query-pagination-previous /-->
<!-- wp:query-pagination-numbers /-->
<!-- wp:query-pagination-next /-->
<!-- /wp:query-pagination -->
<!-- wp:query-no-results -->
<!-- wp:paragraph -->
<p>No posts found.</p>
<!-- /wp:paragraph -->
<!-- /wp:query-no-results -->
<!-- /wp:query -->
</div>
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->`
}

export function buildSearchHtml(s: ColorSlotMap): string {
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
<!-- wp:group {"backgroundColor":"${s.bg}","textColor":"${s.text}","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"4rem","bottom":"5rem"}}}} -->
<div class="wp-block-group alignfull has-${s.bg}-background-color has-${s.text}-color has-text-color has-background">
<!-- wp:heading {"level":1,"style":{"typography":{"fontSize":"2.5rem"},"spacing":{"margin":{"bottom":"1.5rem"}}}} -->
<h1>Search Results</h1>
<!-- /wp:heading -->
<!-- wp:search {"label":"Search","showLabel":false,"placeholder":"Search...","buttonText":"Search","backgroundColor":"${s.accent}","textColor":"${s.bg}","style":{"spacing":{"margin":{"bottom":"2rem"}}}} /-->
<!-- wp:query {"queryId":30,"query":{"perPage":6,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","inherit":true}} -->
<!-- wp:post-template {"layout":{"type":"grid","columnCount":2},"style":{"spacing":{"blockGap":"2rem"}}} -->
<!-- wp:group {"backgroundColor":"${s.surface}","style":{"spacing":{"padding":{"top":"1.5rem","bottom":"1.5rem","left":"1.5rem","right":"1.5rem"},"blockGap":"0.75rem"},"border":{"radius":"8px"}}} -->
<div class="wp-block-group has-${s.surface}-background-color has-background">
<!-- wp:post-title {"isLink":true,"style":{"typography":{"fontSize":"1.2rem","fontWeight":"700"}}} /-->
<!-- wp:post-excerpt {"excerptLength":25} /-->
<!-- wp:post-date {"textColor":"${s.accent}","style":{"typography":{"fontSize":"0.8rem"}}} /-->
</div>
<!-- /wp:group -->
<!-- /wp:post-template -->
<!-- wp:query-no-results -->
<!-- wp:paragraph -->
<p>No results found. Try a different search term.</p>
<!-- /wp:paragraph -->
<!-- /wp:query-no-results -->
<!-- /wp:query -->
</div>
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->`
}

export function build404Html(s: ColorSlotMap): string {
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
<!-- wp:group {"backgroundColor":"${s.bg}","textColor":"${s.text}","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"8rem","bottom":"8rem"}}}} -->
<div class="wp-block-group alignfull has-${s.bg}-background-color has-${s.text}-color has-text-color has-background">
<!-- wp:heading {"textAlign":"center","level":1,"style":{"typography":{"fontSize":"clamp(4rem, 10vw, 8rem)","fontWeight":"800","lineHeight":"1"},"spacing":{"margin":{"bottom":"1.5rem"}}}} -->
<h1 class="has-text-align-center">404</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"1.25rem"},"spacing":{"margin":{"bottom":"2rem"}}}} -->
<p class="has-text-align-center">{{404_MESSAGE}}</p>
<!-- /wp:paragraph -->
<!-- wp:search {"label":"Search","showLabel":false,"placeholder":"Search...","buttonText":"Search","backgroundColor":"${s.accent}","textColor":"${s.bg}","width":50,"widthUnit":"%","align":"center"} /-->
</div>
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->`
}

export function buildHeaderHtml(s: ColorSlotMap): string {
  return `<!-- wp:group {"backgroundColor":"${s.bg}","textColor":"${s.text}","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"1.5rem","bottom":"1.5rem"}}}} -->
<div class="wp-block-group alignfull has-${s.bg}-background-color has-${s.text}-color has-text-color has-background">
<!-- wp:group {"layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"}} -->
<div class="wp-block-group">
<!-- wp:site-title {"style":{"typography":{"fontWeight":"700","fontSize":"1.25rem"}}} /-->
<!-- wp:navigation {"ariaLabel":"Main navigation","layout":{"type":"flex","setCascadingProperties":true}} /-->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->`
}

export function buildFooterHtml(s: ColorSlotMap): string {
  return `<!-- wp:group {"backgroundColor":"${s.bg}","textColor":"${s.text}","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"4rem","bottom":"2rem"}}}} -->
<div class="wp-block-group alignfull has-${s.bg}-background-color has-${s.text}-color has-text-color has-background">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"3rem"},"margin":{"bottom":"3rem"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"40%"} -->
<div class="wp-block-column">
<!-- wp:site-title {"style":{"typography":{"fontWeight":"700","fontSize":"1.25rem"},"spacing":{"margin":{"bottom":"0.75rem"}}}} /-->
<!-- wp:paragraph {"style":{"typography":{"fontSize":"0.9rem","lineHeight":"1.6"}}} -->
<p>{{ABOUT_DESCRIPTION}}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"25%"} -->
<div class="wp-block-column">
<!-- wp:heading {"level":3,"style":{"typography":{"fontSize":"0.9rem","fontWeight":"700","textTransform":"uppercase","letterSpacing":"0.05em"},"spacing":{"margin":{"bottom":"1rem"}}}} -->
<h3>Pages</h3>
<!-- /wp:heading -->
<!-- wp:navigation {"ariaLabel":"Footer navigation","layout":{"type":"flex","orientation":"vertical"},"style":{"spacing":{"blockGap":"0.5rem"},"typography":{"fontSize":"0.9rem"}}} /-->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"35%"} -->
<div class="wp-block-column">
<!-- wp:heading {"level":3,"style":{"typography":{"fontSize":"0.9rem","fontWeight":"700","textTransform":"uppercase","letterSpacing":"0.05em"},"spacing":{"margin":{"bottom":"1rem"}}}} -->
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
<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"0.8rem"}}} -->
<p class="has-text-align-center">{{COPYRIGHT}}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->`
}
