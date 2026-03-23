import { describe, it, expect } from 'vitest'
import { validateThemeSlug } from '../validation/themeSlug'

describe('validateThemeSlug', () => {
  it('accepts my-theme as valid', () => {
    expect(validateThemeSlug('my-theme')).toEqual({ valid: true })
  })

  it('rejects "My Theme" and suggests my-theme', () => {
    const result = validateThemeSlug('My Theme')
    expect(result.valid).toBe(false)
    expect(result.suggestion).toBe('my-theme')
  })

  it('rejects my_theme and suggests my-theme', () => {
    const result = validateThemeSlug('my_theme')
    expect(result.valid).toBe(false)
    expect(result.suggestion).toBe('my-theme')
  })

  it('rejects my--theme and suggests my-theme', () => {
    const result = validateThemeSlug('my--theme')
    expect(result.valid).toBe(false)
    expect(result.suggestion).toBe('my-theme')
  })

  it('rejects -my-theme and suggests my-theme', () => {
    const result = validateThemeSlug('-my-theme')
    expect(result.valid).toBe(false)
    expect(result.suggestion).toBe('my-theme')
  })

  it('rejects my-theme- and suggests my-theme', () => {
    const result = validateThemeSlug('my-theme-')
    expect(result.valid).toBe(false)
    expect(result.suggestion).toBe('my-theme')
  })

  it('rejects UPPERCASE and suggests uppercase', () => {
    const result = validateThemeSlug('UPPERCASE')
    expect(result.valid).toBe(false)
    expect(result.suggestion).toBe('uppercase')
  })

  it('accepts my-theme-123 as valid', () => {
    expect(validateThemeSlug('my-theme-123')).toEqual({ valid: true })
  })
})
