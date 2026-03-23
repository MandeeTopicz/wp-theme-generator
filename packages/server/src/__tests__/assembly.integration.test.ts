import { describe, it, expect } from 'vitest'
import unzipper from 'unzipper'
import {
  validateTheme,
  requiredFiles,
} from '@wp-theme-gen/shared'
import type { ThemeManifest } from '@wp-theme-gen/shared'
import { assembleTheme, createZip } from '../theme/packager'

const simpleBlock = '<!-- wp:paragraph --><p>Content</p><!-- /wp:paragraph -->'

const manifest: ThemeManifest = {
  name: 'Test Theme',
  slug: 'test-theme',
  themeJson: { version: 3 },
  templates: [
    { name: 'index.html', content: simpleBlock },
    { name: 'single.html', content: '<!-- wp:post-content /-->' },
    { name: 'page.html', content: '<!-- wp:post-content /-->' },
    { name: 'archive.html', content: '<!-- wp:query -->\n<!-- wp:post-template -->\n<!-- wp:post-title /-->\n<!-- /wp:post-template -->\n<!-- /wp:query -->' },
    { name: 'search.html', content: '<!-- wp:search /-->' },
    { name: '404.html', content: '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->' },
  ],
  templateParts: [
    { name: 'header.html', content: '<!-- wp:site-title /-->' },
    { name: 'footer.html', content: '<!-- wp:paragraph --><p>Footer</p><!-- /wp:paragraph -->' },
  ],
  patterns: [
    { name: 'hero.php', content: '<!-- wp:cover -->\n<!-- wp:heading --><h2>Hero</h2><!-- /wp:heading -->\n<!-- /wp:cover -->' },
    { name: 'cta.php', content: '<!-- wp:group -->\n<!-- wp:buttons -->\n<!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link">CTA</a></div><!-- /wp:button -->\n<!-- /wp:buttons -->\n<!-- /wp:group -->' },
    { name: 'query-loop.php', content: '<!-- wp:query -->\n<!-- wp:post-template -->\n<!-- wp:post-title /-->\n<!-- wp:post-excerpt /-->\n<!-- /wp:post-template -->\n<!-- /wp:query -->' },
  ],
  files: ['style.css', 'theme.json', 'templates/index.html'],
  colors: [
    { name: 'Primary', slug: 'primary', color: '#1a1a1a' },
    { name: 'Secondary', slug: 'secondary', color: '#ffffff' },
    { name: 'Accent', slug: 'accent', color: '#0073aa' },
  ],
  typography: {
    fontFamilies: [
      { name: 'Inter', slug: 'inter', fontFamily: 'Inter, sans-serif' },
    ],
  },
  layout: { contentSize: '620px', wideSize: '1200px' },
}

describe('assembly integration (T-027)', () => {
  it('assembleTheme produces a valid ThemeFileSet', () => {
    const fileSet = assembleTheme(manifest)
    expect(fileSet.styleCss).toContain('Theme Name')
    expect(fileSet.themeJson).toContain('"version": 3')
    expect(fileSet.templates.length).toBe(6)
    expect(fileSet.parts.length).toBe(2)
    expect(fileSet.patterns.length).toBe(3)
    expect(fileSet.styleVariations.length).toBeGreaterThanOrEqual(2)
  })

  it('manifest passes validateTheme', () => {
    const result = validateTheme(manifest)
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('createZip produces a non-empty Buffer', async () => {
    const fileSet = assembleTheme(manifest)
    const buf = await createZip(manifest, fileSet)
    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.length).toBeGreaterThan(100)
  })

  it('ZIP contains all required file paths', async () => {
    const fileSet = assembleTheme(manifest)
    const buf = await createZip(manifest, fileSet)
    const dir = await unzipper.Open.buffer(buf)
    const paths = dir.files.map((f) => f.path)

    for (const required of requiredFiles) {
      expect(paths).toContain(`test-theme/${required}`)
    }
  })

  it('no file in the ZIP contains wp:html', async () => {
    const fileSet = assembleTheme(manifest)
    const buf = await createZip(manifest, fileSet)
    const dir = await unzipper.Open.buffer(buf)

    for (const file of dir.files) {
      const content = (await file.buffer()).toString('utf-8')
      expect(content).not.toContain('<!-- wp:html')
    }
  })
})
