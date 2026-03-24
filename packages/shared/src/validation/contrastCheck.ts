import type { ColorPaletteEntry } from '../types/ThemeManifest'
import type { BlockMarkupError } from './blockMarkup'

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '')
  return [
    parseInt(cleaned.slice(0, 2), 16) / 255,
    parseInt(cleaned.slice(2, 4), 16) / 255,
    parseInt(cleaned.slice(4, 6), 16) / 255,
  ]
}

function linearize(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(linearize)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

const BG_NAMES = /background|base/i
const FG_NAMES = /text|foreground/i
const ACCENT_NAMES = /accent/i

export function checkPaletteContrast(
  palette: ColorPaletteEntry[],
): BlockMarkupError[] {
  const warnings: BlockMarkupError[] = []

  const bgColors = palette.filter((c) => BG_NAMES.test(c.name) || BG_NAMES.test(c.slug))
  const fgColors = palette.filter((c) => FG_NAMES.test(c.name) || FG_NAMES.test(c.slug))
  const accentColors = palette.filter((c) => ACCENT_NAMES.test(c.name) || ACCENT_NAMES.test(c.slug))

  for (const bg of bgColors) {
    for (const fg of fgColors) {
      const ratio = getContrastRatio(bg.color, fg.color)
      if (ratio < 4.5) {
        warnings.push({
          severity: 'warning',
          file: 'theme.json',
          line: 0,
          block: '',
          message: `Low contrast (${ratio.toFixed(2)}:1) between "${bg.slug}" (${bg.color}) and "${fg.slug}" (${fg.color}). WCAG AA requires 4.5:1.`,
        })
      }
    }
  }

  for (const accent of accentColors) {
    const ratioWhite = getContrastRatio(accent.color, '#ffffff')
    if (ratioWhite < 4.5) {
      warnings.push({
        severity: 'warning',
        file: 'theme.json',
        line: 0,
        block: '',
        message: `Low contrast (${ratioWhite.toFixed(2)}:1) between "${accent.slug}" (${accent.color}) and white. WCAG AA requires 4.5:1.`,
      })
    }
    const ratioBlack = getContrastRatio(accent.color, '#000000')
    if (ratioBlack < 4.5) {
      warnings.push({
        severity: 'warning',
        file: 'theme.json',
        line: 0,
        block: '',
        message: `Low contrast (${ratioBlack.toFixed(2)}:1) between "${accent.slug}" (${accent.color}) and black. WCAG AA requires 4.5:1.`,
      })
    }
  }

  return warnings
}
