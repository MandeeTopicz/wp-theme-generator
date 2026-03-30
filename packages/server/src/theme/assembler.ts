import type {
  ThemeManifest,
  BlockTemplate,
  ColorPaletteEntry,
} from '@wp-theme-gen/shared'
import { getLuminance } from '@wp-theme-gen/shared'


export function buildStyleCSS(manifest: ThemeManifest): string {
  return `/*
Theme Name: ${manifest.name}
Theme URI: https://example.com/${manifest.slug}
Version: 1.0.0
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Text Domain: ${manifest.slug}
*/

/* ── Reset & Layout ────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
body { overflow-x: hidden; -webkit-font-smoothing: antialiased; }
img { max-width: 100%; height: auto; display: block; }

/* Constrain direct children of full-bleed groups — exclude alignwide (inner layout wrappers) */
.wp-block-group.alignfull > :where(:not(.alignleft):not(.alignright):not(.alignfull):not(.alignwide)) {
  max-width: var(--wp--style--global--content-size, 650px);
  margin-left: auto;
  margin-right: auto;
}

/* ── Cards ─────────────────────────────────────────── */
.wp-block-post-template .wp-block-group {
  overflow: hidden;
  min-width: 0;
}
.wp-block-post-title,
.wp-block-post-excerpt,
.wp-block-post-date {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* ── Grid gaps ─────────────────────────────────────── */
.wp-block-post-template.is-layout-grid { gap: 2rem; }
.wp-block-columns { gap: 2rem; }

/* ── Transitions & Hover ──────────────────────────── */
a { transition: color 0.15s ease, opacity 0.15s ease; }

.wp-block-button__link {
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
  cursor: pointer;
}
.wp-block-button__link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  filter: brightness(1.08);
}

.wp-block-post-template .wp-block-group {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.wp-block-post-template .wp-block-group:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.1);
}

.wp-block-navigation a:hover { opacity: 0.7; }

.wp-block-social-links .wp-social-link {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.wp-block-social-links .wp-social-link:hover {
  transform: scale(1.15);
  opacity: 0.8;
}

/* Featured images: natural height; avoid height:100% stretching parent flex rows to viewport height */
.wp-block-post-featured-image img {
  width: 100%;
  height: auto;
  object-fit: cover;
}

/* ── Smooth scroll ─────────────────────────────────── */
html { scroll-behavior: smooth; }

/* ── Selection color ───────────────────────────────── */
::selection {
  background: var(--wp--preset--color--accent, #7c6fff);
  color: #fff;
}

/* ── Transparent sticky header — no document flow gap ── */
.wp-block-template-part[class*="header"] > .wp-block-group[style*="position:sticky"],
header.wp-block-group[style*="position:sticky"] {
  position: sticky !important;
  top: 0;
  z-index: 100;
}

/* Force compact header — override any AI-generated or theme.json group padding */
header.wp-block-group,
.wp-block-template-part[class*="header"] > .wp-block-group {
  padding-top: 12px !important;
  padding-bottom: 12px !important;
}

/* Remove gap between header and first content block */
.wp-site-blocks > header + * {
  margin-top: 0 !important;
}

/* ── Post card titles ───────────────────────────────── */
.wp-block-post-template .wp-block-post-title {
  position: relative;
  z-index: 1;
}
`
}

export function buildThemeJSON(manifest: ThemeManifest): string {
  const colors = manifest.colors ?? []
  const fontFamilies = manifest.typography?.fontFamilies ?? []
  const contentSize = manifest.layout?.contentSize ?? '860px'
  const wideSize = manifest.layout?.wideSize ?? '1200px'

  const templates = manifest.templates
    .filter((t) => t.name !== 'index.html')
    .map((t) => ({
      name: t.name.replace(/\.html$/, ''),
      title: t.name.replace(/\.html$/, '').replace(/(^|-)(\w)/g, (_m, _p, c: string) => ((_p ? ' ' : '') + c.toUpperCase())),
      postTypes: ['page', 'post'],
    }))

  // Derive style colors from palette using luminance detection.
  // Find the darkest color for background and lightest for text to guarantee contrast.
  // For accent, prefer the most saturated color (not just mid-luminance).
  let bgSlug = 'base'
  let textSlug = 'contrast'
  let accentSlug = 'accent'

  function getSaturation(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    if (max === 0) return 0
    return (max - min) / max
  }

  if (colors.length >= 2) {
    const sorted = [...colors].sort(
      (a, b) => getLuminance(a.color) - getLuminance(b.color),
    )
    const darkestEntry = sorted[0]!
    const lightestEntry = sorted[sorted.length - 1]!

    // Detect light vs dark theme from palette character.
    // If the lightest color has very high luminance (>0.7) AND
    // there are more light colors than dark, it's a light theme.
    const lightCount = sorted.filter((c) => getLuminance(c.color) > 0.3).length
    const isLightTheme = lightCount > sorted.length / 2 && getLuminance(lightestEntry.color) > 0.7

    if (isLightTheme) {
      // Light theme: light background, dark text
      bgSlug = lightestEntry.slug
      textSlug = darkestEntry.slug
    } else {
      // Dark theme: dark background, light text
      bgSlug = darkestEntry.slug
      textSlug = lightestEntry.slug
    }

    // Pick accent: most saturated color with sufficient contrast against background
    const bgColor = isLightTheme ? lightestEntry.color : darkestEntry.color
    const bgLum = getLuminance(bgColor)
    const candidates = colors.filter(
      (c) => c.slug !== bgSlug && c.slug !== textSlug,
    )
    // Prefer colors with contrast ratio >= 4.5:1 against bg (WCAG AA)
    const contrastRatio = (hex: string): number => {
      const cLum = getLuminance(hex)
      return (Math.max(bgLum, cLum) + 0.05) / (Math.min(bgLum, cLum) + 0.05)
    }
    const goodContrast = candidates.filter((c) => contrastRatio(c.color) >= 4.5)
    if (goodContrast.length > 0) {
      // Among good-contrast colors, pick the most saturated
      goodContrast.sort((a, b) => getSaturation(b.color) - getSaturation(a.color))
      accentSlug = goodContrast[0]!.slug
    } else if (candidates.length > 0) {
      // No color meets 4.5:1 — pick the one with the HIGHEST contrast ratio
      candidates.sort((a, b) => contrastRatio(b.color) - contrastRatio(a.color))
      accentSlug = candidates[0]!.slug
    } else {
      accentSlug = sorted[Math.floor(sorted.length / 2)]!.slug
    }
  } else if (colors.length === 1) {
    bgSlug = colors[0]!.slug
    textSlug = colors[0]!.slug
  }

  // Determine button text color: pick whichever of bg or text has better contrast against accent
  let buttonTextSlug = textSlug
  const accentEntry = colors.find(c => c.slug === accentSlug)
  if (accentEntry && colors.length >= 2) {
    const accentLum = getLuminance(accentEntry.color)
    const contrastWithAccent = (hex: string): number => {
      const lum = getLuminance(hex)
      return (Math.max(accentLum, lum) + 0.05) / (Math.min(accentLum, lum) + 0.05)
    }
    const bgEntry = colors.find(c => c.slug === bgSlug)
    const txtEntry = colors.find(c => c.slug === textSlug)
    if (bgEntry && txtEntry) {
      buttonTextSlug = contrastWithAccent(bgEntry.color) > contrastWithAccent(txtEntry.color) ? bgSlug : textSlug
    }
  }

  const result = {
    $schema: 'https://schemas.wp.org/trunk/theme.json',
    version: 3,
    settings: {
      appearanceTools: true,
      color: {
        palette: colors.map((c) => ({
          name: c.name,
          slug: c.slug,
          color: c.color,
        })),
      },
      typography: {
        fontFamilies: fontFamilies.map((f) => ({
          name: f.name,
          slug: f.slug,
          fontFamily: f.fontFamily,
        })),
        fontSizes: [
          { slug: 'small', size: '14px', name: 'Small' },
          { slug: 'medium', size: '16px', name: 'Medium' },
          { slug: 'large', size: '20px', name: 'Large' },
          { slug: 'x-large', size: '28px', name: 'Extra large' },
          { slug: 'xx-large', size: '40px', name: '2X large' },
          { slug: 'huge', size: '56px', name: 'Huge' },
          // aliases for AI-generated markup
          { slug: 'sm', size: '14px', name: 'SM' },
          { slug: 'md', size: '16px', name: 'MD' },
          { slug: 'lg', size: '20px', name: 'LG' },
          { slug: 'xl', size: '28px', name: 'XL' },
          { slug: '2xl', size: '40px', name: '2XL' },
          { slug: '3xl', size: '56px', name: '3XL' },
        ],
      },
      spacing: {
        units: ['px', 'em', 'rem', 'vh', 'vw', '%'],
        padding: true,
        margin: true,
        blockGap: true,
        spacingSizes: [
          { name: 'Small', slug: 'small', size: '20px' },
          { name: 'Medium', slug: 'medium', size: '40px' },
          { name: 'Large', slug: 'large', size: '60px' },
          { name: 'X Large', slug: 'x-large', size: '80px' },
          { name: 'XX Large', slug: 'xx-large', size: '120px' },
          { name: 'Huge', slug: 'huge', size: '160px' },
          // numeric aliases
          { name: '20', slug: '20', size: '20px' },
          { name: '40', slug: '40', size: '40px' },
          { name: '60', slug: '60', size: '60px' },
          { name: '80', slug: '80', size: '80px' },
          { name: '120', slug: '120', size: '120px' },
          { name: '160', slug: '160', size: '160px' },
        ],
      },
      layout: {
        contentSize,
        wideSize,
      },
    },
    // Always generate comprehensive styles using luminance-derived colors.
    // If the AI also provided styles, deep-merge them on top so AI overrides
    // are preserved but nothing falls through to WordPress default blue.
    styles: (() => {
      const baseStyles: Record<string, unknown> = {
        color: {
          background: `var(--wp--preset--color--${bgSlug})`,
          text: `var(--wp--preset--color--${textSlug})`,
        },
        typography: {
          lineHeight: '1.7',
          fontSize: 'var(--wp--preset--font-size--md)',
          textTransform: 'none',
        },
        spacing: {
          blockGap: 'var(--wp--preset--spacing--60)',
          padding: {
            top: '0',
            right: '0',
            bottom: '0',
            left: '0',
          },
        },
        elements: {
          link: {
            color: {
              text: `var(--wp--preset--color--${textSlug})`,
            },
            ':hover': {
              color: {
                text: `var(--wp--preset--color--${accentSlug})`,
              },
            },
            typography: {
              textDecoration: 'underline',
            },
          },
          heading: {
            color: {
              text: `var(--wp--preset--color--${textSlug})`,
            },
            typography: {
              fontWeight: '700',
              lineHeight: '1.2',
              textTransform: 'none',
            },
          },
          h1: {
            typography: {
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              letterSpacing: '-0.03em',
              lineHeight: '1.2',
            },
          },
          h2: {
            typography: {
              fontSize: 'var(--wp--preset--font-size--xl)',
              letterSpacing: '-0.02em',
              lineHeight: '1.2',
            },
          },
          h3: {
            typography: {
              fontSize: 'var(--wp--preset--font-size--lg)',
              letterSpacing: '-0.01em',
              lineHeight: '1.2',
            },
          },
          button: {
            color: {
              background: `var(--wp--preset--color--${accentSlug})`,
              text: `var(--wp--preset--color--${buttonTextSlug})`,
            },
            typography: {
              fontWeight: '600',
              textTransform: 'none',
            },
            border: {
              radius: '4px',
            },
          },
          caption: {
            color: {
              text: `var(--wp--preset--color--${textSlug})`,
            },
            typography: {
              fontSize: '0.85rem',
            },
          },
        },
        blocks: {
          'core/group': {
            spacing: {
              padding: {
                top: '60px',
                bottom: '60px',
                left: '40px',
                right: '40px',
              },
            },
          },
          'core/cover': {
            spacing: {
              padding: {
                top: '60px',
                bottom: '60px',
                left: '40px',
                right: '40px',
              },
            },
          },
          'core/navigation': {
            color: { text: `var(--wp--preset--color--${textSlug})` },
            typography: { textTransform: 'none', fontWeight: '500' },
            elements: {
              link: {
                color: { text: `var(--wp--preset--color--${textSlug})` },
                ':hover': { color: { text: `var(--wp--preset--color--${accentSlug})` } },
                typography: { textDecoration: 'none' },
              },
            },
          },
          'core/post-title': {
            color: { text: `var(--wp--preset--color--${textSlug})` },
            typography: { textTransform: 'none', fontWeight: '700', lineHeight: '1.2' },
            elements: {
              link: {
                color: { text: `var(--wp--preset--color--${textSlug})` },
                ':hover': { color: { text: `var(--wp--preset--color--${accentSlug})` } },
                typography: { textDecoration: 'none' },
              },
            },
          },
          'core/post-excerpt': {
            color: { text: `var(--wp--preset--color--${textSlug})` },
            typography: { fontSize: '0.9rem', lineHeight: '1.6', opacity: '0.8' },
          },
          'core/post-date': {
            color: { text: `var(--wp--preset--color--${textSlug})` },
            typography: { fontSize: '0.8rem', opacity: '0.6' },
          },
          'core/query-pagination': {
            color: { text: `var(--wp--preset--color--${accentSlug})` },
            typography: { fontWeight: '600' },
            spacing: { blockGap: '0.5rem' },
            elements: {
              link: {
                color: { text: `var(--wp--preset--color--${accentSlug})` },
                ':hover': { color: { text: `var(--wp--preset--color--${textSlug})` } },
                typography: { textDecoration: 'none' },
              },
            },
          },
          'core/site-title': {
            color: { text: `var(--wp--preset--color--${textSlug})` },
            typography: { fontWeight: '700', textTransform: 'none', fontSize: '1.05rem' },
            elements: {
              link: {
                color: { text: `var(--wp--preset--color--${textSlug})` },
                ':hover': { color: { text: `var(--wp--preset--color--${accentSlug})` } },
                typography: { textDecoration: 'none' },
              },
            },
          },
          'core/site-tagline': {
            color: { text: `var(--wp--preset--color--${accentSlug})` },
            typography: { fontSize: '0.9rem' },
          },
        },
      }

      // If AI provided styles, merge them over the baseline
      const aiThemeJson = manifest.themeJson as Record<string, unknown> | undefined
      if (aiThemeJson && typeof aiThemeJson === 'object' && 'styles' in aiThemeJson) {
        const aiStyles = aiThemeJson.styles as Record<string, unknown>
        // Shallow merge top-level keys, deep merge elements and blocks
        if (aiStyles.color) baseStyles.color = { ...(baseStyles.color as Record<string, unknown>), ...(aiStyles.color as Record<string, unknown>) }
        if (aiStyles.elements) baseStyles.elements = { ...(baseStyles.elements as Record<string, unknown>), ...(aiStyles.elements as Record<string, unknown>) }
        if (aiStyles.blocks) baseStyles.blocks = { ...(baseStyles.blocks as Record<string, unknown>), ...(aiStyles.blocks as Record<string, unknown>) }
        if (aiStyles.typography) baseStyles.typography = { ...(baseStyles.typography as Record<string, unknown>), ...(aiStyles.typography as Record<string, unknown>) }
        // Deep merge spacing to preserve body padding even if AI overrides blockGap
        if (aiStyles.spacing) {
          const baseSpacing = baseStyles.spacing as Record<string, unknown>
          const aiSpacing = aiStyles.spacing as Record<string, unknown>
          baseStyles.spacing = {
            ...baseSpacing,
            ...aiSpacing,
            // Always preserve body padding — AI often omits it causing content to hit edges
            padding: {
              ...((baseSpacing.padding ?? {}) as Record<string, unknown>),
              ...((aiSpacing.padding ?? {}) as Record<string, unknown>),
            },
          }
        }
      }

      return baseStyles
    })(),
    templateParts: [
      { name: 'header', area: 'header', title: 'Header' },
      { name: 'footer', area: 'footer', title: 'Footer' },
    ],
    customTemplates: templates,
  }

  return JSON.stringify(result, null, 2)
}

/** Picsum IDs mapped by template name for deterministic, varied cover images */
const COVER_IMAGE_IDS: Record<string, number> = {
  index: 1084,
  single: 1045,
  page: 1055,
  archive: 1035,
  '404': 1065,
}

/**
 * Ensure a template has a full-bleed cover banner with a background image
 * immediately after the header template-part. If the AI omitted it, inject one.
 */
function ensureCoverBanner(content: string, templateName: string): string {
  // index.html uses the hero pattern — don't inject a second cover
  if (templateName === 'index') return content

  // Already has a cover block — leave it alone
  if (content.includes('wp:cover')) return content

  const picId = COVER_IMAGE_IDS[templateName] ?? (1040 + Math.floor(Math.random() * 40))
  const imgUrl = `https://picsum.photos/id/${picId}/1600/900`

  // Determine what title block to put inside the cover
  let titleBlock: string
  if (templateName === '404') {
    titleBlock = `<!-- wp:heading {"textAlign":"center","textColor":"base","fontSize":"huge","style":{"typography":{"fontFamily":"var(--wp--preset--font-family--heading)"}}} -->
<h2 class="wp-block-heading has-text-align-center has-base-color has-text-color has-huge-font-size">404</h2>
<!-- /wp:heading -->`
  } else if (templateName === 'archive') {
    titleBlock = `<!-- wp:query-title {"textAlign":"center","textColor":"base","fontSize":"huge"} /-->`
  } else {
    titleBlock = `<!-- wp:post-title {"textAlign":"center","textColor":"base","fontSize":"huge"} /-->`
  }

  const coverBlock = `<!-- wp:cover {"url":"${imgUrl}","dimRatio":80,"overlayColor":"foreground","minHeight":40,"minHeightUnit":"vh","isDark":true,"align":"full"} -->
<div class="wp-block-cover alignfull is-dark" style="min-height:40vh"><span aria-hidden="true" class="wp-block-cover__background has-foreground-background-color has-background-dim-80 has-background-dim"></span><img class="wp-block-cover__image-background" alt="" src="${imgUrl}" data-object-fit="cover"/>
<div class="wp-block-cover__inner-container">
<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
${titleBlock}
</div>
<!-- /wp:group -->
</div>
</div>
<!-- /wp:cover -->`

  // Inject after the header template-part
  const headerPartRegex = /(<!--\s*wp:template-part\s*\{[^}]*"slug"\s*:\s*"header"[^}]*\}\s*\/-->)/
  if (headerPartRegex.test(content)) {
    return content.replace(headerPartRegex, `$1\n\n${coverBlock}`)
  }

  // If no header template-part found, prepend
  return `${coverBlock}\n\n${content}`
}

export function buildTemplateFile(template: BlockTemplate): string {
  let content = template.content

  // Post-process block markup to fix common AI generation issues
  content = fixBlockMarkup(content)

  if (template.isTemplatePart) {
    return content
  }

  // If the AI already included template-part references, return as-is
  if (content.includes('wp:template-part')) {
    content = ensureCoverBanner(content, template.name)
    return content
  }

  // Otherwise wrap with header/footer template parts
  content = `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
${content}
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->`
  content = ensureCoverBanner(content, template.name)
  return content
}

/**
 * Post-process AI-generated block markup to fix layout issues.
 * The most common AI failure is omitting layout:{"type":"constrained"} on
 * full-width groups and covers, causing content to stretch edge-to-edge.
 */
function fixBlockMarkup(content: string): string {
  // Fix wp:group blocks with align:"full" but missing layout constraint
  content = content.replace(
    /<!--\s*wp:group\s+(\{[^]*?\})\s*-->/g,
    (_match, attrsStr: string) => {
      try {
        const attrs = JSON.parse(attrsStr) as Record<string, unknown>
        if (attrs.align === 'full' && !attrs.layout) {
          attrs.layout = { type: 'constrained' }
          return `<!-- wp:group ${JSON.stringify(attrs)} -->`
        }
        // Also fix if layout exists but is missing type
        if (attrs.align === 'full' && attrs.layout && typeof attrs.layout === 'object') {
          const layout = attrs.layout as Record<string, unknown>
          if (!layout.type) {
            layout.type = 'constrained'
            return `<!-- wp:group ${JSON.stringify(attrs)} -->`
          }
        }
        return _match
      } catch {
        return _match
      }
    },
  )

  // Covers: minimum height (px), sensible full-width align, and enforce dimRatio for contrast.
  content = content.replace(
    /<!--\s*wp:cover\s*(?:(\{[^]*?\}))?\s*-->/g,
    (_match, attrsStr?: string) => {
      try {
        const attrs = (attrsStr ? JSON.parse(attrsStr) : {}) as Record<string, unknown>
        const origUnit = attrs.minHeightUnit as string | undefined
        const origH = attrs.minHeight
        const parsedH =
          typeof origH === 'number'
            ? origH
            : typeof origH === 'string'
              ? parseFloat(origH)
              : NaN
        // Preserve vh units (used for hero covers) — only enforce minimum for px
        const isVh = origUnit === 'vh'
        if (isVh) {
          // Keep vh value, just ensure it's at least 50vh
          if (!Number.isFinite(parsedH) || parsedH < 50) {
            attrs.minHeight = 85
            attrs.minHeightUnit = 'vh'
          }
        } else {
          const needsMinPx =
            origUnit !== 'px' || !Number.isFinite(parsedH) || parsedH < 600
          if (needsMinPx) {
            attrs.minHeight = 600
            attrs.minHeightUnit = 'px'
          }
        }
        if (
          !attrs.align &&
          (origUnit === 'vh' ||
            (typeof origH === 'number' && origH >= 50))
        ) {
          attrs.align = 'full'
        }
        // Only enforce dimRatio on covers with an overlay color (hero-style).
        // Covers without overlayColor may be used for image display — leave them alone.
        if (attrs.overlayColor) {
          const dimRatio = typeof attrs.dimRatio === 'number' ? attrs.dimRatio : 0
          if (dimRatio < 80) {
            attrs.dimRatio = 80
          }
          // Ensure isDark is set so WordPress renders light text inside
          attrs.isDark = true
          // Ensure hero-style covers always have a placeholder background image
          if (!attrs.url) {
            const picId = 1015 + Math.floor(Math.random() * 70)
            attrs.url = `https://picsum.photos/id/${picId}/1600/900`
          }
        }
        return `<!-- wp:cover ${JSON.stringify(attrs)} -->`
      } catch {
        return _match
      }
    },
  )

  // Ensure cover blocks with a url attribute have a matching <img> tag inside
  content = content.replace(
    /<!--\s*wp:cover\s+(\{[^]*?\})\s*-->\s*\n(<div[^>]*class="wp-block-cover[^"]*"[^>]*>)/g,
    (_match, attrsStr: string, divTag: string) => {
      try {
        const attrs = JSON.parse(attrsStr) as Record<string, unknown>
        if (attrs.url && !_match.includes('wp-block-cover__image-background')) {
          const imgTag = `<img class="wp-block-cover__image-background" alt="" src="${attrs.url}" data-object-fit="cover"/>`
          const spanTag = `<span aria-hidden="true" class="wp-block-cover__background has-background-dim"></span>`
          // Inject span + img right after the opening div if missing
          const hasSpan = _match.includes('wp-block-cover__background')
          const injection = hasSpan ? imgTag : `${spanTag}${imgTag}`
          return `<!-- wp:cover ${attrsStr} -->\n${divTag}${injection}`
        }
        return _match
      } catch {
        return _match
      }
    },
  )

  // Fix wp:columns blocks missing align and layout
  content = content.replace(
    /<!--\s*wp:columns\s+(\{[^]*?\})\s*-->/g,
    (_match, attrsStr: string) => {
      try {
        const attrs = JSON.parse(attrsStr) as Record<string, unknown>
        // Columns inside constrained parents don't need align:full,
        // but if they have it, ensure they have layout too
        if (attrs.align === 'full' && !attrs.layout) {
          attrs.layout = { type: 'constrained' }
          return `<!-- wp:columns ${JSON.stringify(attrs)} -->`
        }
        return _match
      } catch {
        return _match
      }
    },
  )

  // Fix wp:query blocks — ensure they have layout for proper grid display
  content = content.replace(
    /<!--\s*wp:query\s+(\{[^]*?\})\s*-->/g,
    (_match, attrsStr: string) => {
      try {
        const attrs = JSON.parse(attrsStr) as Record<string, unknown>
        if (attrs.align === 'full' && !attrs.layout) {
          attrs.layout = { type: 'constrained' }
          return `<!-- wp:query ${JSON.stringify(attrs)} -->`
        }
        return _match
      } catch {
        return _match
      }
    },
  )

  return content
}

function ensureNavAriaLabel(content: string): string {
  return content.replace(
    /<!--\s+wp:navigation\s+(\{[^}]*\})?\s*(\/?)-->/g,
    (match, attrsStr?: string, selfClose?: string) => {
      if (attrsStr) {
        try {
          const attrs = JSON.parse(attrsStr) as Record<string, unknown>
          if (!attrs.ariaLabel) {
            attrs.ariaLabel = 'Main navigation'
            return `<!-- wp:navigation ${JSON.stringify(attrs)} ${selfClose || ''}-->`
          }
        } catch {
          // leave as-is if attrs aren't valid JSON
        }
        return match
      }
      return `<!-- wp:navigation {"ariaLabel":"Main navigation"} ${selfClose || ''}-->`
    },
  )
}

export function buildPatternFile(pattern: {
  title: string
  slug: string
  categories: string[]
  content: string
}): string {
  let content = pattern.content

  // Strip any AI-generated PHP header — we add our own below
  content = content.replace(/^<\?php[\s\S]*?\?>\s*/m, '')

  // Run the same block markup fixes (cover image injection, etc.)
  content = fixBlockMarkup(content)
  content = ensureNavAriaLabel(content)

  return `<?php
/**
 * Title: ${pattern.title}
 * Slug: ${pattern.slug}
 * Categories: ${pattern.categories.join(', ')}
 * Block Types: core/post-content
 */
?>
${content}`
}

export function buildStyleVariation(variation: {
  title: string
  slug: string
  colors: ColorPaletteEntry[]
}): string {
  const result = {
    $schema: 'https://schemas.wp.org/trunk/theme.json',
    version: 3,
    title: variation.title,
    settings: {
      color: {
        palette: variation.colors.map((c) => ({
          name: c.name,
          slug: c.slug,
          color: c.color,
        })),
      },
    },
  }
  return JSON.stringify(result, null, 2)
}
