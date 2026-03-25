import { describe, it, expect } from 'vitest'
import { parseDesignSpec, ParseError } from '../ai/outputParser'

const validDesignSpec = {
  name: 'Test Theme',
  slug: 'test-theme',
  colors: [{ name: 'Primary', slug: 'primary', color: '#1a1a1a' }],
  typography: {
    fontFamilies: [
      { name: 'Inter', slug: 'inter', fontFamily: 'Inter, sans-serif' },
    ],
  },
  layout: { contentSize: '620px', wideSize: '1200px' },
  designNarrative: 'A bold theme',
  styleVariations: [],
  copyStrings: {
    heroHeading: 'Welcome',
    heroSubheading: 'A bold theme for your site',
    ctaHeading: 'Get Started',
    ctaDescription: 'Start building today',
    ctaButtonText: 'Learn More',
    sectionHeading: 'Features',
    aboutHeading: 'About Us',
    aboutDescription: 'We build great themes',
    notFoundMessage: 'Page not found',
    copyright: '2026 Test Theme',
    featureItems: [
      { title: 'Fast', description: 'Lightning quick' },
    ],
  },
}

describe('parseDesignSpec', () => {
  it('parses valid DesignSpec JSON string', () => {
    const result = parseDesignSpec(JSON.stringify(validDesignSpec))
    expect(result.name).toBe('Test Theme')
    expect(result.slug).toBe('test-theme')
  })

  it('parses DesignSpec wrapped in ```json fences', () => {
    const wrapped = '```json\n' + JSON.stringify(validDesignSpec) + '\n```'
    const result = parseDesignSpec(wrapped)
    expect(result.name).toBe('Test Theme')
  })

  it('throws ParseError for invalid DesignSpec', () => {
    expect(() => parseDesignSpec(JSON.stringify({ name: 'only name' }))).toThrow(
      ParseError,
    )
  })
})
