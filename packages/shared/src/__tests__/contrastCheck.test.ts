import { describe, it, expect } from 'vitest'
import {
  getContrastRatio,
  checkPaletteContrast,
} from '../validation/contrastCheck'

describe('getContrastRatio', () => {
  it('white on black returns ~21 (no warning)', () => {
    const ratio = getContrastRatio('#ffffff', '#000000')
    expect(ratio).toBeGreaterThan(20)
    expect(ratio).toBeLessThanOrEqual(21)
  })

  it('white on white returns 1 (warning)', () => {
    const ratio = getContrastRatio('#ffffff', '#ffffff')
    expect(ratio).toBe(1)
  })
})

describe('checkPaletteContrast', () => {
  it('#e94560 on white returns warning (ratio < 4.5)', () => {
    const warnings = checkPaletteContrast([
      { name: 'Accent', slug: 'accent', color: '#e94560' },
    ])
    const whiteWarning = warnings.find((w) => w.message.includes('white'))
    expect(whiteWarning).toBeDefined()
  })

  it('valid high-contrast palette returns no warnings', () => {
    const warnings = checkPaletteContrast([
      { name: 'Background', slug: 'background', color: '#000000' },
      { name: 'Text', slug: 'text', color: '#ffffff' },
      { name: 'Primary', slug: 'primary', color: '#336699' },
    ])
    expect(warnings).toHaveLength(0)
  })
})
