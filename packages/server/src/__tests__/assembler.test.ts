import { describe, it, expect } from 'vitest'
import {
  buildStyleCSS,
  buildThemeJSON,
  buildTemplateFile,
  buildPatternFile,
  buildStyleVariation,
} from '../theme/assembler'
import {
  validateThemeJson,
  validateBlockMarkup,
} from '@wp-theme-gen/shared'
import type {
  ThemeManifest,
  BlockTemplate,
} from '@wp-theme-gen/shared'

const manifest: ThemeManifest = {
  name: 'Test Theme',
  slug: 'test-theme',
  themeJson: { version: 3 },
  templates: [
    { name: 'index.html', content: '<!-- wp:paragraph --><p>hi</p><!-- /wp:paragraph -->' },
    { name: 'single.html', content: '<!-- wp:post-content /-->' },
  ],
  templateParts: [
    { name: 'header.html', content: '<!-- wp:site-title /-->' },
  ],
  patterns: [],
  files: ['style.css', 'theme.json', 'templates/index.html'],
  colors: [
    { name: 'Primary', slug: 'primary', color: '#1a1a1a' },
    { name: 'Secondary', slug: 'secondary', color: '#ffffff' },
  ],
  typography: {
    fontFamilies: [
      { name: 'Inter', slug: 'inter', fontFamily: 'Inter, sans-serif' },
    ],
  },
  layout: { contentSize: '620px', wideSize: '1200px' },
}

describe('buildStyleCSS', () => {
  it('contains Theme Name', () => {
    const css = buildStyleCSS(manifest)
    expect(css).toContain('Theme Name: Test Theme')
  })

  it('contains Requires at least: 6.0', () => {
    const css = buildStyleCSS(manifest)
    expect(css).toContain('Requires at least: 6.0')
  })

  it('contains the slug as Text Domain', () => {
    const css = buildStyleCSS(manifest)
    expect(css).toContain('Text Domain: test-theme')
  })
})

describe('buildThemeJSON', () => {
  it('output passes validateThemeJson', () => {
    const json = JSON.parse(buildThemeJSON(manifest))
    const result = validateThemeJson(json)
    expect(result.valid).toBe(true)
  })

  it('contains correct color palette slugs', () => {
    const json = JSON.parse(buildThemeJSON(manifest))
    const slugs = json.settings.color.palette.map((c: { slug: string }) => c.slug)
    expect(slugs).toContain('primary')
    expect(slugs).toContain('secondary')
  })

  it('templateParts includes header and footer', () => {
    const json = JSON.parse(buildThemeJSON(manifest))
    const names = json.templateParts.map((p: { name: string }) => p.name)
    expect(names).toContain('header')
    expect(names).toContain('footer')
  })

  it('includes styles.color.background and styles.color.text', () => {
    const json = JSON.parse(buildThemeJSON(manifest))
    expect(json.styles.color.background).toContain('--wp--preset--color--primary')
    expect(json.styles.color.text).toContain('--wp--preset--color--secondary')
  })

  it('uses spacing scale presets in px and enables padding and margin', () => {
    const json = JSON.parse(buildThemeJSON(manifest))
    expect(json.settings.spacing.padding).toBe(true)
    expect(json.settings.spacing.margin).toBe(true)
    const slugs = json.settings.spacing.spacingSizes.map((e: { slug: string }) => e.slug)
    expect(slugs).toEqual([
      'small', 'medium', 'large', 'x-large', 'xx-large', 'huge',
      '20', '40', '60', '80', '120', '160',
    ])
  })

  it('defaults content width to 860px when layout is omitted', () => {
    const { layout: _l, ...m } = manifest
    const json = JSON.parse(buildThemeJSON(m as ThemeManifest))
    expect(json.settings.layout.contentSize).toBe('860px')
  })
})

describe('buildTemplateFile', () => {
  it('wraps regular template with header/footer parts', () => {
    const tpl: BlockTemplate = {
      name: 'index',
      title: 'Index',
      content: '<!-- wp:paragraph --><p>hi</p><!-- /wp:paragraph -->',
    }
    const output = buildTemplateFile(tpl)
    expect(output).toContain('wp:template-part {"slug":"header"')
    expect(output).toContain('wp:template-part {"slug":"footer"')
    expect(output).toContain(tpl.content)
  })

  it('does NOT double-wrap when AI already includes template-part', () => {
    const tpl: BlockTemplate = {
      name: 'index',
      title: 'Index',
      content:
        '<!-- wp:template-part {"slug":"header"} /-->\n<!-- wp:query /-->\n<!-- wp:template-part {"slug":"footer"} /-->',
    }
    const output = buildTemplateFile(tpl)
    // Should return content as-is, not add extra header/footer
    const headerCount = (output.match(/wp:template-part.*header/g) || []).length
    expect(headerCount).toBe(1)
  })

  it('does NOT wrap template parts', () => {
    const part: BlockTemplate = {
      name: 'header',
      title: 'Header',
      content: '<!-- wp:site-title /-->',
      isTemplatePart: true,
    }
    const output = buildTemplateFile(part)
    expect(output).not.toContain('wp:template-part')
    expect(output).toBe(part.content)
  })
})

describe('buildPatternFile', () => {
  const pattern = {
    title: 'Hero',
    slug: 'test-theme/hero',
    categories: ['featured', 'banner'],
    content: '<!-- wp:group -->\n<!-- wp:heading --><h2>Hello</h2><!-- /wp:heading -->\n<!-- /wp:group -->',
  }

  it('contains the Title comment', () => {
    const output = buildPatternFile(pattern)
    expect(output).toContain('Title: Hero')
  })

  it('contains <?php header', () => {
    const output = buildPatternFile(pattern)
    expect(output).toContain('<?php')
  })

  it('block markup passes validateBlockMarkup with 0 fatals', () => {
    const errors = validateBlockMarkup(pattern.content, 'hero.php')
    const fatals = errors.filter((e) => e.severity === 'fatal')
    expect(fatals).toHaveLength(0)
  })
})

describe('buildStyleVariation', () => {
  it('outputs valid JSON with a title field', () => {
    const output = buildStyleVariation({
      title: 'Dark',
      slug: 'dark',
      colors: [{ name: 'Base', slug: 'base', color: '#000000' }],
    })
    const json = JSON.parse(output)
    expect(json.title).toBe('Dark')
    expect(json.version).toBe(3)
  })
})
