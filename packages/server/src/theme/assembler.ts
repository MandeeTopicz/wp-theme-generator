import type {
  ThemeManifest,
  BlockTemplate,
  ColorPaletteEntry,
} from '@wp-theme-gen/shared'

const SKIP_LINK = `<!-- wp:group {"className":"skip-link-wrapper","style":{"position":"absolute","left":"-9999px"}} -->
<div class="wp-block-group skip-link-wrapper"><!-- wp:paragraph {"className":"skip-link"} -->
<p class="skip-link"><a href="#main-content">Skip to content</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`

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
`
}

export function buildThemeJSON(manifest: ThemeManifest): string {
  const colors = manifest.colors ?? []
  const fontFamilies = manifest.typography?.fontFamilies ?? []
  const contentSize = manifest.layout?.contentSize ?? '620px'
  const wideSize = manifest.layout?.wideSize ?? '1200px'

  const templates = manifest.templates
    .filter((t) => t.name !== 'index.html')
    .map((t) => ({
      name: t.name.replace(/\.html$/, ''),
      title: t.name.replace(/\.html$/, '').replace(/(^|-)(\w)/g, (_m, _p, c: string) => ((_p ? ' ' : '') + c.toUpperCase())),
      postTypes: ['page', 'post'],
    }))

  // Derive style colors from palette:
  // First entry = background (typically darkest), last = text (typically lightest)
  // If only one color, use it as background with white text
  const bgSlug = colors[0]?.slug || 'base'
  const textSlug = colors.length > 1 ? colors[colors.length - 1]!.slug : 'contrast'
  const accentSlug = colors[Math.min(6, colors.length - 1)]?.slug || colors[0]?.slug || 'accent'

  const result = {
    $schema: 'https://schemas.wp.org/trunk/theme.json',
    version: 3,
    settings: {
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
      },
      layout: {
        contentSize,
        wideSize,
      },
    },
    styles: {
      color: {
        background: `var(--wp--preset--color--${bgSlug})`,
        text: `var(--wp--preset--color--${textSlug})`,
      },
      elements: {
        link: {
          color: {
            text: `var(--wp--preset--color--${accentSlug})`,
          },
        },
        heading: {
          color: {
            text: `var(--wp--preset--color--${textSlug})`,
          },
        },
      },
    },
    templateParts: [
      { name: 'header', area: 'header', title: 'Header' },
      { name: 'footer', area: 'footer', title: 'Footer' },
    ],
    customTemplates: templates,
  }

  return JSON.stringify(result, null, 2)
}

export function buildTemplateFile(template: BlockTemplate): string {
  if (template.isTemplatePart) {
    return template.content
  }

  return `${SKIP_LINK}
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
${template.content}
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->`
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
