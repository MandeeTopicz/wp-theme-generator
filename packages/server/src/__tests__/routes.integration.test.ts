import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'
import type { ThemeManifest } from '@wp-theme-gen/shared'
import type { DesignSpec } from '../ai/provider'

const mockDesignSpec: DesignSpec = {
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

const mockManifest: ThemeManifest = {
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
  colors: [{ name: 'Primary', slug: 'primary', color: '#1a1a1a' }],
  typography: {
    fontFamilies: [
      { name: 'Inter', slug: 'inter', fontFamily: 'Inter, sans-serif' },
    ],
  },
  layout: { contentSize: '620px', wideSize: '1200px' },
}

vi.mock('../ai/provider', () => ({
  createAIProvider: () => ({
    generateDesignSpec: vi.fn().mockResolvedValue(mockDesignSpec),
  }),
}))

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
  templateId: 'starter',
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

describe('POST /api/generate', () => {
  it('returns SSE stream with progress and complete events', async () => {
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
    // First generate to get a sessionId (SSE response)
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
        {
          name: 'index.html',
          content: '<!-- wp:html --><div>bad</div><!-- /wp:html -->',
        },
      ],
    }
    const res = await request(app).post('/api/validate').send(badManifest)
    expect(res.status).toBe(200)
    expect(res.body.isValid).toBe(false)
  })
})
