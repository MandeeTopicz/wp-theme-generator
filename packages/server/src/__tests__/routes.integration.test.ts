import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'
import type { ThemeManifest } from '@wp-theme-gen/shared'

const mockComplete = vi.fn()

vi.mock('../ai/provider', () => ({
  createAIProvider: () => ({
    complete: mockComplete,
    iterateTheme: vi.fn(),
  }),
}))

// Minimal valid design brief JSON
const mockBriefJson = JSON.stringify({
  name: 'Test Theme',
  slug: 'test-theme',
  colors: [
    { name: 'Base', slug: 'base', color: '#0d0d0d' },
    { name: 'Surface', slug: 'surface', color: '#1a1a1a' },
    { name: 'Foreground', slug: 'foreground', color: '#f5f5f5' },
    { name: 'Muted', slug: 'muted', color: '#888888' },
    { name: 'Accent', slug: 'accent', color: '#ff6b35' },
    { name: 'Accent Foreground', slug: 'accent-foreground', color: '#ffffff' },
  ],
  typography: {
    fontFamilies: [
      { name: 'Syne', slug: 'heading', fontFamily: 'Syne, sans-serif' },
      { name: 'Inter', slug: 'body', fontFamily: 'Inter, sans-serif' },
    ],
  },
  layout: { contentSize: '860px', wideSize: '1200px' },
  layoutPersonality: {
    heroStyle: 'full-bleed-cover',
    heroHeight: '85vh',
    headerStyle: 'solid-bar',
    sectionsOrder: ['features', 'latest-posts', 'cta'],
    visualTension: 'Strong contrast between display and body type.',
  },
  copyStrings: {
    heroHeading: 'Ideas worth building',
    heroSubheading: 'A platform for thinkers and makers who refuse to settle.',
    ctaHeading: 'Start something real',
    ctaDescription: 'Join a community of creators building things that matter.',
    ctaButtonText: 'Dive In',
    sectionHeading: 'Fresh perspectives',
    aboutHeading: 'What we stand for',
    aboutDescription: 'We believe great ideas deserve great execution. This is a space for those who care.',
    notFoundMessage: 'This page took a wrong turn. Head back home.',
    copyright: '© 2026 Test Theme. All rights reserved.',
    featureItems: [
      { title: 'Built with care', description: 'Every detail considered for the best possible experience.' },
      { title: 'Fast by default', description: 'Performance baked in from the start, not bolted on later.' },
      { title: 'Yours to own', description: 'No lock-in, no nonsense. Your content, your rules.' },
    ],
  },
  styleVariations: [
    { title: 'Dark', slug: 'dark', colors: [
      { name: 'Base', slug: 'base', color: '#0d0d0d' },
      { name: 'Surface', slug: 'surface', color: '#1a1a1a' },
      { name: 'Foreground', slug: 'foreground', color: '#f5f5f5' },
      { name: 'Muted', slug: 'muted', color: '#888888' },
      { name: 'Accent', slug: 'accent', color: '#ff6b35' },
      { name: 'Accent Foreground', slug: 'accent-foreground', color: '#ffffff' },
    ]},
  ],
})

const mockHeaderFooterJson = JSON.stringify({
  header: '<!-- wp:group {"tagName":"header","align":"full","backgroundColor":"base","layout":{"type":"flex","justifyContent":"space-between","alignItems":"center"}} --><header class="wp-block-group alignfull has-base-background-color has-background"><!-- wp:site-title /--><!-- wp:navigation {"ariaLabel":"Main navigation"} /--></header><!-- /wp:group -->',
  footer: '<!-- wp:group {"tagName":"footer","align":"full","backgroundColor":"surface"} --><footer class="wp-block-group alignfull has-surface-background-color has-background"><!-- wp:paragraph {"textColor":"muted"} --><p class="has-muted-color has-text-color">© 2026 Test Theme.</p><!-- /wp:paragraph --></footer><!-- /wp:group -->',
})

const mockHomepageJson = JSON.stringify({
  indexTemplate: '<!-- wp:template-part {"slug":"header","tagName":"header"} /-->\n<!-- wp:cover {"minHeight":85,"minHeightUnit":"vh","align":"full"} --><div class="wp-block-cover alignfull"><div class="wp-block-cover__inner-container"><!-- wp:heading {"level":1} --><h1>Ideas worth building</h1><!-- /wp:heading --></div></div><!-- /wp:cover -->\n<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->',
  heroPattern: '<?php\n/**\n * Title: Hero\n * Slug: test-theme/hero\n * Categories: featured\n * Block Types: core/post-content\n */\n?>\n<!-- wp:cover {"minHeight":85,"minHeightUnit":"vh","align":"full"} --><div class="wp-block-cover alignfull"><div class="wp-block-cover__inner-container"><!-- wp:heading {"level":1} --><h1>Ideas worth building</h1><!-- /wp:heading --></div></div><!-- /wp:cover -->',
})

const mockInnerTemplatesJson = JSON.stringify({
  single: '<!-- wp:template-part {"slug":"header","tagName":"header"} /--><!-- wp:post-content /--><!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->',
  page: '<!-- wp:template-part {"slug":"header","tagName":"header"} /--><!-- wp:post-content /--><!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->',
  archive: '<!-- wp:template-part {"slug":"header","tagName":"header"} /--><!-- wp:query {"perPage":9} --><!-- /wp:query --><!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->',
  '404': '<!-- wp:template-part {"slug":"header","tagName":"header"} /--><!-- wp:heading --><h1>404</h1><!-- /wp:heading --><!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->',
})

const mockManifest: ThemeManifest = {
  name: 'Test Theme',
  slug: 'test-theme',
  themeJson: { version: 3 },
  templates: [
    { name: 'index.html', content: '<!-- wp:paragraph --><p>hi</p><!-- /wp:paragraph -->' },
  ],
  templateParts: [],
  patterns: [],
  files: ['style.css', 'theme.json', 'templates/index.html'],
  colors: [{ name: 'Base', slug: 'base', color: '#0d0d0d' }],
  typography: {
    fontFamilies: [{ name: 'Inter', slug: 'body', fontFamily: 'Inter, sans-serif' }],
  },
  layout: { contentSize: '860px', wideSize: '1200px' },
}

let app: typeof import('../index').default

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  process.env.ANTHROPIC_API_KEY = 'sk-test'
  const mod = await import('../index')
  app = mod.default
})

const validBody = {
  description: 'A photography portfolio',
  siteType: 'portfolio',
  themeName: 'Test Theme',
  themeSlug: 'test-theme',
}

function parseSSEText(text: string): { event: string; data: unknown }[] {
  const events: { event: string; data: unknown }[] = []
  for (const block of text.split('\n\n')) {
    if (!block.trim()) continue
    let event = 'message'
    let dataStr = ''
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) event = line.slice(7)
      else if (line.startsWith('data: ')) dataStr = line.slice(6)
    }
    if (dataStr) {
      try { events.push({ event, data: JSON.parse(dataStr) }) } catch { /* skip */ }
    }
  }
  return events
}

function setupMockPipeline() {
  mockComplete
    .mockResolvedValueOnce(mockBriefJson)
    .mockResolvedValueOnce(mockHeaderFooterJson)
    .mockResolvedValueOnce(mockHomepageJson)
    .mockResolvedValueOnce(mockInnerTemplatesJson)
}

describe('POST /api/generate', () => {
  it('returns SSE stream with progress and complete events', async () => {
    setupMockPipeline()

    const res = await request(app)
      .post('/api/generate')
      .send(validBody)
      .buffer(true)
      .parse((r, cb) => {
        let data = ''
        r.setEncoding('utf-8')
        r.on('data', (chunk: string) => { data += chunk })
        r.on('end', () => cb(null, data))
      })

    expect(res.status).toBe(200)
    const events = parseSSEText(res.body as unknown as string)
    const progressEvents = events.filter((e) => e.event === 'progress')
    const completeEvents = events.filter((e) => e.event === 'complete')
    expect(progressEvents.length).toBeGreaterThanOrEqual(1)
    expect(completeEvents).toHaveLength(1)
    const complete = completeEvents[0]!.data as { sessionId: string; manifest: unknown; validationResult: unknown }
    expect(complete).toHaveProperty('sessionId')
    expect(complete).toHaveProperty('manifest')
    expect(complete).toHaveProperty('validationResult')
  })

  it('returns 400 with suggestion for invalid slug', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ ...validBody, themeSlug: 'Bad Slug' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('suggestion')
  })

  it('returns 400 for description over 1000 chars', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ ...validBody, description: 'a'.repeat(1001) })
    expect(res.status).toBe(400)
  })

  it('returns 400 with field names for missing required fields', async () => {
    const res = await request(app).post('/api/generate').send({})
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('errors')
    const fields = res.body.errors.map((e: { field: string }) => e.field)
    expect(fields).toContain('description')
  })
})

describe('GET /api/download/:sessionId', () => {
  it('returns ZIP binary for valid sessionId', async () => {
    setupMockPipeline()

    const genRes = await request(app)
      .post('/api/generate')
      .send(validBody)
      .buffer(true)
      .parse((r, cb) => {
        let data = ''
        r.setEncoding('utf-8')
        r.on('data', (chunk: string) => { data += chunk })
        r.on('end', () => cb(null, data))
      })

    const events = parseSSEText(genRes.body as unknown as string)
    const complete = events.find((e) => e.event === 'complete')
    const { sessionId } = complete!.data as { sessionId: string }

    const res = await request(app).get(`/api/download/${sessionId}`)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('application/zip')
  })

  it('returns 404 for invalid sessionId', async () => {
    const res = await request(app).get('/api/download/nonexistent-id')
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/validate', () => {
  it('returns { isValid: true } for valid manifest', async () => {
    const res = await request(app).post('/api/validate').send(mockManifest)
    expect(res.status).toBe(200)
    expect(res.body.isValid).toBe(true)
  })

  it('returns { isValid: false } for manifest with wp:html', async () => {
    const badManifest = {
      ...mockManifest,
      templates: [
        { name: 'index.html', content: '<!-- wp:html --><div>bad</div><!-- /wp:html -->' },
      ],
    }
    const res = await request(app).post('/api/validate').send(badManifest)
    expect(res.status).toBe(200)
    expect(res.body.isValid).toBe(false)
  })
})
