import type { ThemeManifest } from '../types/ThemeManifest'
import { requiredFiles } from '../constants/requiredFiles'
import { validateThemeSlug } from './themeSlug'
import { validateThemeJson } from './themeJson'
import { validateBlockMarkup } from './blockMarkup'
import { validateQueryLoop } from './blockMarkup'
import { checkPaletteContrast } from './contrastCheck'

export interface ValidationError {
  severity: 'fatal' | 'warning'
  file?: string
  line?: number
  block?: string
  field?: string
  message: string
  suggestion?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  summary: string
}

export function validateTheme(manifest: ThemeManifest): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Theme slug
  const slugResult = validateThemeSlug(manifest.slug)
  if (!slugResult.valid) {
    errors.push({
      severity: 'fatal',
      field: 'slug',
      message: `Invalid theme slug "${manifest.slug}"`,
      suggestion: slugResult.suggestion,
    })
  }

  // theme.json
  const jsonResult = validateThemeJson(manifest.themeJson)
  if (!jsonResult.valid) {
    for (const err of jsonResult.errors) {
      errors.push({
        severity: 'fatal',
        file: 'theme.json',
        field: err.path,
        message: err.message,
      })
    }
  }

  // Template markup
  for (const tpl of manifest.templates) {
    const markupErrors = validateBlockMarkup(tpl.content, `templates/${tpl.name}`)
    for (const err of markupErrors) {
      if (err.severity === 'fatal') {
        errors.push(err)
      } else {
        warnings.push(err)
      }
    }
  }

  // Template part markup
  for (const part of manifest.templateParts) {
    const markupErrors = validateBlockMarkup(part.content, `parts/${part.name}`)
    for (const err of markupErrors) {
      if (err.severity === 'fatal') {
        errors.push(err)
      } else {
        warnings.push(err)
      }
    }
  }

  // Pattern markup
  for (const pattern of manifest.patterns) {
    const markupErrors = validateBlockMarkup(
      pattern.content,
      `patterns/${pattern.name}`,
    )
    for (const err of markupErrors) {
      if (err.severity === 'fatal') {
        errors.push(err)
      } else {
        warnings.push(err)
      }
    }
  }

  // Query loop quality
  for (const tpl of manifest.templates) {
    warnings.push(...validateQueryLoop(tpl.content, `templates/${tpl.name}`))
  }
  for (const pattern of manifest.patterns) {
    warnings.push(...validateQueryLoop(pattern.content, `patterns/${pattern.name}`))
  }

  // Palette contrast
  if (manifest.colors) {
    warnings.push(...checkPaletteContrast(manifest.colors))
  }

  // Required files
  const fileSet = new Set(manifest.files)
  for (const required of requiredFiles) {
    if (!fileSet.has(required)) {
      errors.push({
        severity: 'fatal',
        file: required,
        message: `Required file "${required}" is missing`,
      })
    }
  }

  const isValid = errors.length === 0

  let summary: string
  if (errors.length === 0 && warnings.length === 0) {
    summary = 'All checks passed'
  } else {
    const parts: string[] = []
    if (errors.length > 0) {
      parts.push(`${errors.length} error${errors.length !== 1 ? 's' : ''}`)
    }
    if (warnings.length > 0) {
      parts.push(
        `${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`,
      )
    }
    summary = parts.join(', ')
  }

  return { isValid, errors, warnings, summary }
}
