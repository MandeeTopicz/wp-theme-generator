import { describe, it, expect } from 'vitest'
import unzipper from 'unzipper'
import type { ThemeManifest } from '@wp-theme-gen/shared'
import { assembleTheme, createZip } from '../theme/packager'

const manifest: ThemeManifest = {
  name: 'Test Theme',
  slug: 'test-theme',
  themeJson: { version: 3 },
  templates: [
    { name: 'index.html', content: '<!-- wp:paragraph --><p>hi</p><!-- /wp:paragraph -->' },
  ],
  templateParts: [
    { name: 'header.html', content: '<!-- wp:site-title /-->' },
    { name: 'footer.html', content: '<!-- wp:paragraph --><p>footer</p><!-- /wp:paragraph -->' },
  ],
  patterns: [
    { name: 'hero.php', content: '<!-- wp:group -->\n<!-- wp:heading --><h2>Hero</h2><!-- /wp:heading -->\n<!-- /wp:group -->' },
  ],
  files: ['style.css', 'theme.json', 'templates/index.html'],
  colors: [
    { name: 'Primary', slug: 'primary', color: '#1a1a1a' },
  ],
}

async function getZipEntries(buf: Buffer): Promise<string[]> {
  const dir = await unzipper.Open.buffer(buf)
  return dir.files.map((f) => f.path)
}

describe('packager', () => {
  it('createZip resolves to a Buffer', async () => {
    const fileSet = assembleTheme(manifest)
    const buf = await createZip(manifest, fileSet)
    expect(Buffer.isBuffer(buf)).toBe(true)
  })

  it('ZIP buffer is non-empty (> 100 bytes)', async () => {
    const fileSet = assembleTheme(manifest)
    const buf = await createZip(manifest, fileSet)
    expect(buf.length).toBeGreaterThan(100)
  })

  it('contains test-theme/style.css', async () => {
    const fileSet = assembleTheme(manifest)
    const buf = await createZip(manifest, fileSet)
    const entries = await getZipEntries(buf)
    expect(entries).toContain('test-theme/style.css')
  })

  it('contains test-theme/theme.json', async () => {
    const fileSet = assembleTheme(manifest)
    const buf = await createZip(manifest, fileSet)
    const entries = await getZipEntries(buf)
    expect(entries).toContain('test-theme/theme.json')
  })

  it('contains test-theme/templates/index.html', async () => {
    const fileSet = assembleTheme(manifest)
    const buf = await createZip(manifest, fileSet)
    const entries = await getZipEntries(buf)
    expect(entries).toContain('test-theme/templates/index.html')
  })

  it('contains test-theme/parts/header.html', async () => {
    const fileSet = assembleTheme(manifest)
    const buf = await createZip(manifest, fileSet)
    const entries = await getZipEntries(buf)
    expect(entries).toContain('test-theme/parts/header.html')
  })
})
