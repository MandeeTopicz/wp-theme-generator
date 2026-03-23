import { describe, it, expect } from 'vitest'
import {
  buildPass1SystemPrompt,
  buildPass1UserPrompt,
  buildPass2SystemPrompt,
  buildIterationPrompt,
} from '../ai/promptBuilder'
import type { DesignSpec } from '../ai/provider'
import type { ThemeManifest } from '@wp-theme-gen/shared'

const design: DesignSpec = {
  name: 'Test Theme',
  slug: 'test-theme',
  colors: [{ name: 'Primary', slug: 'primary', color: '#1a1a1a' }],
  typography: {
    fontFamilies: [
      { name: 'Inter', slug: 'inter', fontFamily: 'Inter, sans-serif' },
    ],
  },
  layout: { contentSize: '620px', wideSize: '1200px' },
  designNarrative: 'A bold, modern theme with dark tones',
  styleVariations: [],
}

describe('promptBuilder', () => {
  it('pass 1 system prompt contains "JSON" and "DesignSpec"', () => {
    const prompt = buildPass1SystemPrompt()
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('DesignSpec')
  })

  it('pass 1 user prompt contains the description text', () => {
    const prompt = buildPass1UserPrompt({
      prompt: 'A photography portfolio theme',
    })
    expect(prompt).toContain('photography portfolio')
  })

  it('pass 1 user prompt strips HTML from description', () => {
    const prompt = buildPass1UserPrompt({
      prompt: 'test',
      description: "<script>alert('xss')</script>",
    })
    expect(prompt).not.toContain('<script>')
    expect(prompt).toContain("alert('xss')")
  })

  it('pass 1 user prompt contains site type', () => {
    const prompt = buildPass1UserPrompt({
      prompt: 'test',
      siteType: 'blog',
    })
    expect(prompt).toContain('blog')
  })

  it('pass 2 system prompt contains "wp:html" prohibition', () => {
    const prompt = buildPass2SystemPrompt(design)
    expect(prompt).toContain('wp:html')
  })

  it('pass 2 system prompt contains NEVER wp:html rule', () => {
    const prompt = buildPass2SystemPrompt(design)
    expect(prompt).toContain('NEVER')
    expect(prompt).toContain('wp:html')
  })

  it('pass 2 system prompt contains the design narrative', () => {
    const prompt = buildPass2SystemPrompt(design)
    expect(prompt).toContain('A bold, modern theme with dark tones')
  })

  it('iteration prompt contains the user instruction', () => {
    const manifest: ThemeManifest = {
      name: 'Test',
      slug: 'test',
      themeJson: { version: 3 },
      templates: [],
      templateParts: [],
      patterns: [],
      files: [],
    }
    const prompt = buildIterationPrompt(manifest, 'Make the header sticky')
    expect(prompt).toContain('Make the header sticky')
  })
})
