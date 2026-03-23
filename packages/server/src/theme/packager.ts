import archiver from 'archiver'
import type { ThemeManifest } from '@wp-theme-gen/shared'
import {
  buildStyleCSS,
  buildThemeJSON,
  buildTemplateFile,
  buildPatternFile,
  buildStyleVariation,
} from './assembler'

export interface ThemeFileSet {
  styleCss: string
  themeJson: string
  templates: { name: string; content: string }[]
  parts: { name: string; content: string }[]
  patterns: { name: string; content: string }[]
  styleVariations: { name: string; content: string }[]
}

export function assembleTheme(manifest: ThemeManifest): ThemeFileSet {
  const styleCss = buildStyleCSS(manifest)
  const themeJson = buildThemeJSON(manifest)

  const templates = manifest.templates.map((t) => ({
    name: t.name,
    content: buildTemplateFile({
      name: t.name.replace(/\.html$/, ''),
      title: t.name.replace(/\.html$/, ''),
      content: t.content,
    }),
  }))

  const parts = manifest.templateParts.map((p) => ({
    name: p.name,
    content: buildTemplateFile({
      name: p.name.replace(/\.html$/, ''),
      title: p.name.replace(/\.html$/, ''),
      content: p.content,
      isTemplatePart: true,
    }),
  }))

  const patterns = manifest.patterns.map((p) => ({
    name: p.name,
    content: buildPatternFile({
      title: p.name.replace(/\.php$/, '').replace(/(^|-)(\w)/g, (_m, sep: string, c: string) => (sep ? ' ' : '') + c.toUpperCase()),
      slug: `${manifest.slug}/${p.name.replace(/\.php$/, '')}`,
      categories: ['theme'],
      content: p.content,
    }),
  }))

  const colors = manifest.colors ?? []
  const styleVariations = [
    {
      name: 'dark.json',
      content: buildStyleVariation({
        title: 'Dark',
        slug: 'dark',
        colors: colors.map((c) => ({ ...c, color: '#1a1a1a' })),
      }),
    },
    {
      name: 'high-contrast.json',
      content: buildStyleVariation({
        title: 'High Contrast',
        slug: 'high-contrast',
        colors: colors.map((c) => ({ ...c, color: '#000000' })),
      }),
    },
  ]

  return { styleCss, themeJson, templates, parts, patterns, styleVariations }
}

export async function createZip(
  manifest: ThemeManifest,
  fileSet: ThemeFileSet,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []

    archive.on('data', (chunk: Buffer) => chunks.push(chunk))
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.on('error', reject)

    const root = manifest.slug

    archive.append(fileSet.styleCss, { name: `${root}/style.css` })
    archive.append(fileSet.themeJson, { name: `${root}/theme.json` })

    for (const tpl of fileSet.templates) {
      archive.append(tpl.content, { name: `${root}/templates/${tpl.name}` })
    }

    for (const part of fileSet.parts) {
      archive.append(part.content, { name: `${root}/parts/${part.name}` })
    }

    for (const pattern of fileSet.patterns) {
      archive.append(pattern.content, {
        name: `${root}/patterns/${pattern.name}`,
      })
    }

    for (const variation of fileSet.styleVariations) {
      archive.append(variation.content, {
        name: `${root}/styles/${variation.name}`,
      })
    }

    archive.finalize()
  })
}
