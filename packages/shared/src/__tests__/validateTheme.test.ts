import { describe, it, expect } from 'vitest'
import { validateTheme } from '../validation/validateTheme'
import type { ThemeManifest } from '../types/ThemeManifest'

function makeManifest(overrides: Partial<ThemeManifest> = {}): ThemeManifest {
  return {
    name: 'My Theme',
    slug: 'my-theme',
    themeJson: { version: 3 },
    templates: [
      {
        name: 'index.html',
        content:
          '<!-- wp:group --><div><!-- wp:paragraph --><p>hi</p><!-- /wp:paragraph --></div><!-- /wp:group -->',
      },
    ],
    templateParts: [],
    patterns: [],
    files: ['style.css', 'theme.json', 'templates/index.html'],
    ...overrides,
  }
}

describe('validateTheme', () => {
  it('passes for a valid minimal manifest', () => {
    const result = validateTheme(makeManifest())
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.summary).toBe('All checks passed')
  })

  it('fails when a template contains wp:html', () => {
    const result = validateTheme(
      makeManifest({
        templates: [
          {
            name: 'index.html',
            content: '<!-- wp:html --><div>bad</div><!-- /wp:html -->',
          },
        ],
      }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(1)
    expect(result.errors.some((e) => e.severity === 'fatal')).toBe(true)
  })

  it('fails with invalid theme slug', () => {
    const result = validateTheme(makeManifest({ slug: 'My Theme' }))
    expect(result.isValid).toBe(false)
    expect(
      result.errors.some(
        (e) => e.severity === 'fatal' && e.field === 'slug',
      ),
    ).toBe(true)
  })

  it('is valid with warnings for unknown blocks', () => {
    const result = validateTheme(
      makeManifest({
        templates: [
          {
            name: 'index.html',
            content:
              '<!-- wp:custom/thing --><div>stuff</div><!-- /wp:custom/thing -->',
          },
        ],
      }),
    )
    expect(result.isValid).toBe(true)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings.some((e) => e.severity === 'warning')).toBe(true)
  })

  it('fails for empty manifest with missing required files', () => {
    const result = validateTheme(
      makeManifest({
        files: [],
        templates: [],
      }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
    expect(
      result.errors.some((e) => e.message.includes('Required file')),
    ).toBe(true)
  })
})
