import { describe, it, expect } from 'vitest'
import {
  parseDesignBrief,
  parseHeaderFooter,
  parseHomepage,
  parseInnerTemplates,
  parseIterationResult,
  ParseError,
} from '../ai/outputParser'

// ─── Shared valid fixtures ────────────────────────────────────────────────────

const validColors = [
  { name: 'Base', slug: 'base', color: '#0d0d0d' },
  { name: 'Surface', slug: 'surface', color: '#1a1a1a' },
  { name: 'Foreground', slug: 'foreground', color: '#f5f5f5' },
  { name: 'Muted', slug: 'muted', color: '#888888' },
  { name: 'Accent', slug: 'accent', color: '#ff6b35' },
  { name: 'Accent Foreground', slug: 'accent-foreground', color: '#ffffff' },
]

const validTypography = {
  fontFamilies: [
    { name: 'Syne', slug: 'heading', fontFamily: 'Syne, sans-serif' },
    { name: 'Inter', slug: 'body', fontFamily: 'Inter, sans-serif' },
  ],
}

const validLayoutPersonality = {
  heroStyle: 'full-bleed-cover' as const,
  heroHeight: '85vh' as const,
  headerStyle: 'solid-bar' as const,
  sectionsOrder: ['features', 'latest-posts', 'cta'],
  visualTension: 'Large contrast between delicate serif headings and bold geometric shapes.',
}

const validCopyStrings = {
  heroHeading: 'Ideas worth building',
  heroSubheading: 'A platform for thinkers and makers who refuse to settle for ordinary.',
  ctaHeading: 'Start something real',
  ctaDescription: 'Join a community of creators building things that matter.',
  ctaButtonText: 'Dive In',
  sectionHeading: 'Fresh perspectives',
  aboutHeading: 'What we stand for',
  aboutDescription: 'We believe great ideas deserve great execution. This is a space for those who care about craft.',
  notFoundMessage: 'This page took a wrong turn somewhere. Head back home.',
  copyright: '© 2026 Test Theme. All rights reserved.',
  featureItems: [
    { title: 'Built with care', description: 'Every detail considered for the best possible experience.' },
    { title: 'Fast by default', description: 'Performance baked in from the start, not bolted on later.' },
    { title: 'Yours to own', description: 'No lock-in, no nonsense. Your content, your rules.' },
  ],
}

const validBrief = {
  name: 'Test Theme',
  slug: 'test-theme',
  colors: validColors,
  typography: validTypography,
  layout: { contentSize: '860px', wideSize: '1200px' },
  layoutPersonality: validLayoutPersonality,
  copyStrings: validCopyStrings,
  styleVariations: [
    { title: 'Dark', slug: 'dark', colors: validColors },
  ],
}

// ─── parseDesignBrief ─────────────────────────────────────────────────────────

describe('parseDesignBrief', () => {
  it('parses a valid design brief', () => {
    const result = parseDesignBrief(JSON.stringify(validBrief))
    expect(result.name).toBe('Test Theme')
    expect(result.slug).toBe('test-theme')
    expect(result.colors).toHaveLength(6)
    expect(result.layoutPersonality.heroStyle).toBe('full-bleed-cover')
  })

  it('parses brief wrapped in ```json fences', () => {
    const wrapped = '```json\n' + JSON.stringify(validBrief) + '\n```'
    const result = parseDesignBrief(wrapped)
    expect(result.name).toBe('Test Theme')
  })

  it('throws ParseError for invalid JSON', () => {
    expect(() => parseDesignBrief('not json at all')).toThrow(ParseError)
  })

  it('throws ParseError when required fields are missing', () => {
    expect(() => parseDesignBrief(JSON.stringify({ name: 'only name' }))).toThrow(ParseError)
  })

  it('recovers when layoutPersonality is missing by injecting defaults', () => {
    const withoutPersonality = { ...validBrief }
    delete (withoutPersonality as Record<string, unknown>).layoutPersonality
    const result = parseDesignBrief(JSON.stringify(withoutPersonality))
    expect(result.layoutPersonality).toBeDefined()
    expect(result.layoutPersonality.heroStyle).toBe('full-bleed-cover')
  })

  it('recovers when featureItems has fewer than 3 entries', () => {
    const brief = {
      ...validBrief,
      copyStrings: {
        ...validCopyStrings,
        featureItems: [{ title: 'One item', description: 'Only one feature item provided.' }],
      },
    }
    const result = parseDesignBrief(JSON.stringify(brief))
    expect(result.copyStrings.featureItems).toHaveLength(3)
  })

  it('throws ParseError for invalid slug format', () => {
    const brief = { ...validBrief, slug: 'Invalid Slug With Spaces' }
    expect(() => parseDesignBrief(JSON.stringify(brief))).toThrow(ParseError)
  })

  it('throws ParseError for invalid hex color', () => {
    const brief = {
      ...validBrief,
      colors: [
        ...validColors.slice(0, 5),
        { name: 'Bad', slug: 'accent-foreground', color: 'not-a-hex' },
      ],
    }
    expect(() => parseDesignBrief(JSON.stringify(brief))).toThrow(ParseError)
  })
})

// ─── parseHeaderFooter ────────────────────────────────────────────────────────

describe('parseHeaderFooter', () => {
  const validHeaderFooter = {
    header: '<!-- wp:group {"tagName":"header"} --><header class="wp-block-group"></header><!-- /wp:group -->',
    footer: '<!-- wp:group {"tagName":"footer"} --><footer class="wp-block-group"></footer><!-- /wp:group -->',
  }

  it('parses valid header and footer', () => {
    const result = parseHeaderFooter(JSON.stringify(validHeaderFooter))
    expect(result.header).toContain('wp:group')
    expect(result.footer).toContain('wp:group')
  })

  it('throws ParseError when header is missing', () => {
    expect(() =>
      parseHeaderFooter(JSON.stringify({ footer: validHeaderFooter.footer })),
    ).toThrow(ParseError)
  })

  it('throws ParseError when header has no WordPress blocks', () => {
    expect(() =>
      parseHeaderFooter(JSON.stringify({ header: '<header>plain html</header>', footer: validHeaderFooter.footer })),
    ).toThrow(ParseError)
  })

  it('throws ParseError for invalid JSON', () => {
    expect(() => parseHeaderFooter('not json')).toThrow(ParseError)
  })
})

// ─── parseHomepage ────────────────────────────────────────────────────────────

describe('parseHomepage', () => {
  const validHomepage = {
    indexTemplate: '<!-- wp:template-part {"slug":"header","tagName":"header"} /-->\n<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->',
    heroPattern: '<?php\n/**\n * Title: Hero\n * Slug: test/hero\n */\n?>\n<!-- wp:cover --><!-- /wp:cover -->',
  }

  it('parses valid homepage result', () => {
    const result = parseHomepage(JSON.stringify(validHomepage))
    expect(result.indexTemplate).toContain('wp:template-part')
    expect(result.heroPattern).toContain('wp:cover')
  })

  it('throws ParseError when indexTemplate missing template-part references', () => {
    expect(() =>
      parseHomepage(JSON.stringify({
        ...validHomepage,
        indexTemplate: '<!-- wp:paragraph --><p>no parts</p><!-- /wp:paragraph -->',
      })),
    ).toThrow(ParseError)
  })

  it('throws ParseError when heroPattern is missing', () => {
    expect(() =>
      parseHomepage(JSON.stringify({ indexTemplate: validHomepage.indexTemplate })),
    ).toThrow(ParseError)
  })
})

// ─── parseInnerTemplates ──────────────────────────────────────────────────────

describe('parseInnerTemplates', () => {
  const validInner = {
    single: '<!-- wp:template-part {"slug":"header","tagName":"header"} /--><!-- wp:post-content /--><!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->',
    page: '<!-- wp:template-part {"slug":"header","tagName":"header"} /--><!-- wp:post-content /--><!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->',
    archive: '<!-- wp:template-part {"slug":"header","tagName":"header"} /--><!-- wp:query {"perPage":9} --><!-- /wp:query --><!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->',
    '404': '<!-- wp:template-part {"slug":"header","tagName":"header"} /--><!-- wp:heading --><h1>404</h1><!-- /wp:heading --><!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->',
  }

  it('parses all four templates', () => {
    const result = parseInnerTemplates(JSON.stringify(validInner))
    expect(result.single).toContain('wp:post-content')
    expect(result.page).toContain('wp:post-content')
    expect(result.archive).toContain('wp:query')
    expect(result['404']).toContain('404')
  })

  it('throws ParseError when a template is missing', () => {
    const { '404': _404, ...without404 } = validInner
    expect(() => parseInnerTemplates(JSON.stringify(without404))).toThrow(ParseError)
  })

  it('throws ParseError for invalid JSON', () => {
    expect(() => parseInnerTemplates('bad json')).toThrow(ParseError)
  })
})

// ─── parseIterationResult ─────────────────────────────────────────────────────

describe('parseIterationResult', () => {
  it('parses a valid iteration result with templates', () => {
    const result = parseIterationResult(JSON.stringify({
      templates: [{ name: 'index.html', content: '<!-- wp:paragraph --><p>updated</p><!-- /wp:paragraph -->' }],
    }))
    expect(result.templates).toHaveLength(1)
    expect(result.templates![0]!.name).toBe('index.html')
  })

  it('parses result with only templateParts changed', () => {
    const result = parseIterationResult(JSON.stringify({
      templateParts: [{ name: 'header.html', content: '<!-- wp:group --><!-- /wp:group -->' }],
    }))
    expect(result.templateParts).toHaveLength(1)
    expect(result.templates).toBeUndefined()
  })

  it('throws ParseError when no files changed', () => {
    expect(() => parseIterationResult(JSON.stringify({}))).toThrow(ParseError)
  })

  it('throws ParseError for invalid JSON', () => {
    expect(() => parseIterationResult('not json')).toThrow(ParseError)
  })
})
