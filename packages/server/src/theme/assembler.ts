import type {
  ThemeManifest,
  BlockTemplate,
  ColorPaletteEntry,
} from '@wp-theme-gen/shared'

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

  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
${template.content}
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->`
}

export function buildPatternFile(pattern: {
  title: string
  slug: string
  categories: string[]
  content: string
}): string {
  return `<?php
/**
 * Title: ${pattern.title}
 * Slug: ${pattern.slug}
 * Categories: ${pattern.categories.join(', ')}
 * Block Types: core/post-content
 */
?>
${pattern.content}`
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
