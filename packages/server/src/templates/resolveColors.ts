import type { ColorPaletteEntry } from '@wp-theme-gen/shared'
import { getLuminance } from '@wp-theme-gen/shared'
import type { ColorSlotMap } from './types'

/**
 * Resolve which palette colors to use for bg, text, surface, accent, etc.
 *
 * @param colorMode - 'light' forces light bg, 'dark' forces dark bg, 'auto' uses luminance detection
 */
export function resolveColorSlugs(colors: ColorPaletteEntry[], colorMode?: string): ColorSlotMap {
  if (colors.length < 2) {
    const slug = colors[0]?.slug ?? 'base'
    return { bg: slug, text: slug, surface: slug, accent: slug, muted: slug, third: slug }
  }

  const sorted = [...colors].sort(
    (a, b) => getLuminance(a.color) - getLuminance(b.color),
  )
  const darkest = sorted[0]!
  const lightest = sorted[sorted.length - 1]!
  const secondDarkest = sorted[1] ?? darkest
  const thirdDarkest = sorted[2] ?? secondDarkest
  const secondLightest = sorted[sorted.length - 2] ?? lightest

  // Determine light vs dark based on colorMode override or auto-detection
  let isLight: boolean
  if (colorMode === 'light') {
    isLight = true
  } else if (colorMode === 'dark') {
    isLight = false
  } else {
    // Auto: detect from palette character
    const lightCount = sorted.filter((c) => getLuminance(c.color) > 0.3).length
    isLight = lightCount > sorted.length / 2 && getLuminance(lightest.color) > 0.7
  }

  const bg = isLight ? lightest.slug : darkest.slug
  const text = isLight ? darkest.slug : lightest.slug
  const surface = isLight ? secondLightest.slug : secondDarkest.slug
  const third = isLight ? (sorted[sorted.length - 3]?.slug ?? secondLightest.slug) : thirdDarkest.slug
  const mid = sorted[Math.floor(sorted.length / 2)]!.slug

  // Pick accent: most saturated color with good contrast against bg
  const bgLum = getLuminance(isLight ? lightest.color : darkest.color)
  const candidates = colors.filter((c) => c.slug !== bg && c.slug !== text)

  function getSaturation(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    return max === 0 ? 0 : (max - min) / max
  }

  function contrastRatio(hex: string): number {
    const cLum = getLuminance(hex)
    return (Math.max(bgLum, cLum) + 0.05) / (Math.min(bgLum, cLum) + 0.05)
  }

  let accent = mid
  const goodContrast = candidates.filter((c) => contrastRatio(c.color) >= 4.5)
  if (goodContrast.length > 0) {
    goodContrast.sort((a, b) => getSaturation(b.color) - getSaturation(a.color))
    accent = goodContrast[0]!.slug
  } else if (candidates.length > 0) {
    candidates.sort((a, b) => contrastRatio(b.color) - contrastRatio(a.color))
    accent = candidates[0]!.slug
  }

  return {
    bg,
    text,
    surface,
    accent,
    muted: mid,
    third,
  }
}
