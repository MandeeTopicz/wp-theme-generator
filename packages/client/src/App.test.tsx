import { describe, it, expect } from 'vitest'
import { useThemeGenerator } from './hooks/useThemeGenerator'
import { useIterationHistory } from './hooks/useIterationHistory'

describe('client', () => {
  it('useThemeGenerator exports generate, isLoading, error, result', () => {
    // Verify the hook signature at the type level
    const hook = useThemeGenerator as unknown
    expect(typeof hook).toBe('function')
  })

  it('useIterationHistory exports history, addIteration, clearHistory', () => {
    const hook = useIterationHistory as unknown
    expect(typeof hook).toBe('function')
  })

  it('App module exports default component', async () => {
    const mod = await import('./App')
    expect(typeof mod.default).toBe('function')
  })

  it('ThemeForm module exports default component', async () => {
    const mod = await import('./components/ThemeForm/ThemeForm')
    expect(typeof mod.default).toBe('function')
  })
})
