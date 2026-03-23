import { describe, it, expect } from 'vitest'
import { parseDesignSpec, parseThemeManifest, ParseError } from '../ai/outputParser'

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
}

const validManifest = {
  name: 'Test Theme',
  slug: 'test-theme',
  themeJson: { version: 3 },
  templates: [
    {
      name: 'index.html',
      content: '<!-- wp:paragraph --><p>hi</p><!-- /wp:paragraph -->',
    },
  ],
  templateParts: [],
  patterns: [],
  files: ['style.css', 'theme.json', 'templates/index.html'],
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

describe('parseThemeManifest', () => {
  it('parses valid ThemeManifest JSON string', () => {
    const result = parseThemeManifest(JSON.stringify(validManifest))
    expect(result.name).toBe('Test Theme')
    expect(result.slug).toBe('test-theme')
  })

  it('parses manifest with wp:html without throwing (validation is deferred)', () => {
    const withHtml = {
      ...validManifest,
      templates: [
        {
          name: 'index.html',
          content: '<!-- wp:html --><div>bad</div><!-- /wp:html -->',
        },
      ],
    }
    const result = parseThemeManifest(JSON.stringify(withHtml))
    expect(result.templates[0].content).toContain('wp:html')
  })

  it('throws ParseError for malformed JSON', () => {
    expect(() => parseThemeManifest('not json at all {')).toThrow(ParseError)
  })
})
