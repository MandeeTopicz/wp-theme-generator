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

  // Derive style colors from palette using luminance detection.
  // Find the darkest color for background and lightest for text to guarantee contrast.
  let bgSlug = 'base'
  let textSlug = 'contrast'
  let accentSlug = 'accent'

  if (colors.length >= 2) {
    const sorted = [...colors].sort(
      (a, b) => getLuminance(a.color) - getLuminance(b.color),
    )
    bgSlug = sorted[0]!.slug
    textSlug = sorted[sorted.length - 1]!.slug
    // Pick a mid-luminance color as accent, or fall back to the second-brightest
    const mid = Math.floor(sorted.length / 2)
    accentSlug = sorted[mid]!.slug
  } else if (colors.length === 1) {
    bgSlug = colors[0]!.slug
    textSlug = colors[0]!.slug
  }

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
    // Use AI-generated styles if available (richer, with elements/blocks overrides),
    // otherwise fall back to luminance-derived styles
    styles: (manifest.themeJson && typeof manifest.themeJson === 'object' && 'styles' in (manifest.themeJson as Record<string, unknown>))
      ? (manifest.themeJson as Record<string, unknown>).styles as Record<string, unknown>
      : {
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
            button: {
              color: {
                background: `var(--wp--preset--color--${accentSlug})`,
                text: `var(--wp--preset--color--${textSlug})`,
              },
              border: {
                radius: '4px',
              },
            },
          },
          blocks: {
            'core/navigation': {
              color: { text: `var(--wp--preset--color--${textSlug})` },
            },
            'core/post-title': {
              color: { text: `var(--wp--preset--color--${textSlug})` },
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

  // If the AI already included template-part references, return as-is
  if (template.content.includes('wp:template-part')) {
    return template.content
  }

  // Otherwise wrap with header/footer template parts
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
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
