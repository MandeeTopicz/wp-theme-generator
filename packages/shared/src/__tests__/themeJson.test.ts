import { describe, it, expect } from 'vitest'
import { validateThemeJson } from '../validation/themeJson'

describe('validateThemeJson', () => {
  it('passes a valid minimal schema', () => {
    const result = validateThemeJson({ version: 3 })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('fails when version is missing', () => {
    const result = validateThemeJson({})
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.path === 'version')).toBe(true)
  })

  it('fails when version is 2', () => {
    const result = validateThemeJson({ version: 2 })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.path === 'version')).toBe(true)
  })

  it('fails for invalid color hex', () => {
    const result = validateThemeJson({
      version: 3,
      settings: {
        color: {
          palette: [{ name: 'Red', slug: 'red', color: 'red' }],
        },
      },
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.path.includes('color'))).toBe(true)
  })

  it('fails when slug is missing in palette entry', () => {
    const result = validateThemeJson({
      version: 3,
      settings: {
        color: {
          palette: [{ name: 'Red', color: '#ff0000' }],
        },
      },
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.path.includes('slug'))).toBe(true)
  })

  it('passes with valid typography', () => {
    const result = validateThemeJson({
      version: 3,
      settings: {
        typography: {
          fontFamilies: [
            { name: 'Inter', slug: 'inter', fontFamily: 'Inter, sans-serif' },
          ],
        },
      },
    })
    expect(result.valid).toBe(true)
  })

  it('passes with valid templateParts', () => {
    const result = validateThemeJson({
      version: 3,
      templateParts: [{ name: 'header', area: 'header', title: 'Header' }],
    })
    expect(result.valid).toBe(true)
  })

  it('passes with empty palette array', () => {
    const result = validateThemeJson({
      version: 3,
      settings: { color: { palette: [] } },
    })
    expect(result.valid).toBe(true)
  })

  it('passes with extra unknown keys (passthrough)', () => {
    const result = validateThemeJson({
      version: 3,
      customSection: { foo: 'bar' },
    })
    expect(result.valid).toBe(true)
  })

  it('fails gracefully for null input', () => {
    const result = validateThemeJson(null)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
