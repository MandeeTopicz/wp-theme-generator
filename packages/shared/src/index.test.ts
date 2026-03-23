import { describe, it, expect } from 'vitest'
import { coreBlocks, requiredFiles } from './index'

describe('shared', () => {
  it('exports coreBlocks', () => {
    expect(Array.isArray(coreBlocks)).toBe(true)
  })

  it('exports requiredFiles', () => {
    expect(Array.isArray(requiredFiles)).toBe(true)
  })
})
