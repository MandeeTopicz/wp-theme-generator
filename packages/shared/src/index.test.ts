import { describe, it, expect } from 'vitest'
import { coreBlocks, requiredFiles } from './index'

describe('shared', () => {
  it('exports coreBlocks with more than 50 entries', () => {
    expect(coreBlocks.length).toBeGreaterThan(90)
  })

  it('includes core/paragraph', () => {
    expect(coreBlocks.includes('core/paragraph')).toBe(true)
  })

  it('includes core/group', () => {
    expect(coreBlocks.includes('core/group')).toBe(true)
  })

  it('includes core/query', () => {
    expect(coreBlocks.includes('core/query')).toBe(true)
  })

  it('exports requiredFiles', () => {
    expect(Array.isArray(requiredFiles)).toBe(true)
  })
})
