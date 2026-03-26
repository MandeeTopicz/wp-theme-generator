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

/* ── Transparent sticky header overlay ──────────────── */
.wp-block-group.alignfull[style*="position:sticky"],
.wp-block-group.alignfull[style*="position: sticky"] {
  position: sticky;
  top: 0;
  z-index: 100;
}

/* Ensure first content block after header is not pushed down */
header + * {
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
              text: `var(--wp--preset--color--${textSlug})`,
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
            typography: { fontWeight: '700', textTransform: 'none', fontSize: '1.25rem' },
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

export function buildTemplateFile(template: BlockTemplate): string {
  let content = template.content

  // Post-process block markup to fix common AI generation issues
  content = fixBlockMarkup(content)

  if (template.isTemplatePart) {
    return content
  }

  // If the AI already included template-part references, return as-is
  if (content.includes('wp:template-part')) {
    return content
  }

  // Otherwise wrap with header/footer template parts
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
${content}
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->`
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

  // Covers: minimum height (px) and sensible full-width align when implied by vh height.
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
        const needsMinPx =
          origUnit !== 'px' || !Number.isFinite(parsedH) || parsedH < 600
        if (needsMinPx) {
          attrs.minHeight = 600
          attrs.minHeightUnit = 'px'
        }
        if (
          !attrs.align &&
          (origUnit === 'vh' ||
            (typeof origH === 'number' && origH >= 50))
        ) {
          attrs.align = 'full'
        }
        return `<!-- wp:cover ${JSON.stringify(attrs)} -->`
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
  const content = ensureNavAriaLabel(pattern.content)

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
