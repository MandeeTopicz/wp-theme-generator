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
    generateThemeManifest: vi.fn().mockResolvedValue(mockManifest),
    iterateTheme: vi.fn().mockResolvedValue({}),
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
}

describe('POST /api/generate', () => {
  it('returns 200 with sessionId for valid body', async () => {
    const res = await request(app).post('/api/generate').send(validBody)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('sessionId')
    expect(res.body).toHaveProperty('manifest')
    expect(res.body).toHaveProperty('validationResult')
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
    // First generate to get a sessionId
    const genRes = await request(app).post('/api/generate').send(validBody)
    const { sessionId } = genRes.body

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
