import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express, { type Express } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { sanitize } from './middleware/sanitize'
import { errorHandler } from './middleware/errorHandler'
import { generateRouter } from './routes/generate'
import { downloadRouter, playgroundRouter } from './routes/download'
import { validateRouter } from './routes/validate'
import { iterateRouter } from './routes/iterate'

function loadEnvFiles(): void {
  dotenv.config()
  const cwd = process.cwd()
  const candidates = [
    path.join(cwd, '.env'),
    path.join(cwd, 'packages', 'server', '.env'),
    path.join(cwd, '..', '..', '.env'),
  ]
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      dotenv.config({ path: file, override: false })
    }
  }
}
loadEnvFiles()

const app: Express = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/health', (_req, res) => {
  const __sd = path.dirname(fileURLToPath(import.meta.url))
  const candidates = [
    path.resolve(process.cwd(), 'packages/client/dist'),
    path.resolve(__sd, '../../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
  ]
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cwd: process.cwd(),
    serverDir: __sd,
    candidates: candidates.map(d => ({ path: d, exists: fs.existsSync(d), hasIndex: fs.existsSync(path.join(d, 'index.html')) })),
  })
})

// Quick API key validation — tests with a tiny request
app.get('/api/check-key', async (_req, res) => {
  const provider = process.env.AI_PROVIDER ?? 'gemini'
  const apiKey = provider === 'gemini'
    ? process.env.GEMINI_API_KEY
    : process.env.ANTHROPIC_API_KEY
  const model = provider === 'gemini'
    ? (process.env.GEMINI_MODEL || 'gemini-2.5-flash')
    : (process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514')

  console.log('[check-key] Provider: %s, key: %s...%s', provider, apiKey?.slice(0, 8), apiKey?.slice(-4))

  if (!apiKey) {
    res.json({ valid: false, error: `${provider === 'gemini' ? 'GEMINI_API_KEY' : 'ANTHROPIC_API_KEY'} not set in .env` })
    return
  }

  if (provider === 'gemini') {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'hi' }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        },
      )
      const rawText = await response.text()
      console.log('[check-key] Gemini %s → HTTP %d: %s', model, response.status, rawText.slice(0, 300))

      if (response.ok) {
        res.json({ valid: true, provider: 'gemini', model })
        return
      }
      res.json({ valid: false, provider: 'gemini', model, error: rawText.slice(0, 300) })
    } catch (err) {
      res.json({ valid: false, provider: 'gemini', error: err instanceof Error ? err.message : String(err) })
    }
    return
  }

  // Anthropic fallback
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    })
    const rawText = await response.text()
    console.log('[check-key] Anthropic %s → HTTP %d: %s', model, response.status, rawText.slice(0, 300))

    if (response.ok) {
      res.json({ valid: true, provider: 'anthropic', model })
      return
    }
    res.json({ valid: false, provider: 'anthropic', model, error: rawText.slice(0, 300) })
  } catch (err) {
    res.json({ valid: false, provider: 'anthropic', error: err instanceof Error ? err.message : String(err) })
  }
})

const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
})

app.use('/api/generate', generateLimiter, sanitize, generateRouter)
app.use('/api/download', downloadRouter)
app.use('/api/playground', playgroundRouter)
app.use('/api/validate', sanitize, validateRouter)
app.use('/api/iterate', sanitize, iterateRouter)

// Serve client build in production — static assets + SPA fallback
const __serverDir = path.dirname(fileURLToPath(import.meta.url))
const clientDistCandidates = [
  path.resolve(process.cwd(), 'packages/client/dist'),
  path.resolve(__serverDir, '../../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'dist'),
]
console.log('[static] cwd:', process.cwd())
console.log('[static] __serverDir:', __serverDir)
console.log('[static] candidates:', clientDistCandidates.map(d => `${d} (${fs.existsSync(d) ? 'EXISTS' : 'missing'})`))
const clientDist = clientDistCandidates.find(d => fs.existsSync(path.join(d, 'index.html'))) ?? ''
if (clientDist) {
  app.use(express.static(clientDist))
  // SPA fallback: any non-API route serves index.html
  app.get('*', (_req, res, next) => {
    if (_req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(clientDist, 'index.html'))
  })
  console.log(`[static] Serving client from ${clientDist}`)
} else {
  console.warn('[static] WARNING: No client dist found — / will 404')
}

app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

export default app
