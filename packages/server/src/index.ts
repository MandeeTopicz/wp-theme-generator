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

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Quick API key validation — tests with a tiny request
app.get('/api/check-key', async (_req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'
  console.log('[check-key] Testing API key: %s...%s', apiKey?.slice(0, 8), apiKey?.slice(-4))
  console.log('[check-key] Model: %s', model)

  if (!apiKey) {
    console.log('[check-key] FAIL: No API key')
    res.json({ valid: false, error: 'ANTHROPIC_API_KEY not set in .env' })
    return
  }

  // First try: list models to see what's available
  const modelsToTry = [
    model,
    'claude-3-5-sonnet-20241022',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ]

  for (const testModel of modelsToTry) {
    console.log('[check-key] Trying model: %s', testModel)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: testModel,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      })

      const rawText = await response.text()
      console.log('[check-key] %s → HTTP %d: %s', testModel, response.status, rawText.slice(0, 300))

      if (response.ok) {
        console.log('[check-key] SUCCESS with model: %s', testModel)
        res.json({ valid: true, model: testModel, allTried: modelsToTry.slice(0, modelsToTry.indexOf(testModel) + 1) })
        return
      }

      // Parse error details
      try {
        const data = JSON.parse(rawText)
        const errMsg = (data as { error?: { type?: string; message?: string } }).error
        console.log('[check-key] %s error type: %s, message: %s', testModel, errMsg?.type, errMsg?.message)

        // If it's a credit/billing issue, no point trying other models
        if (errMsg?.message?.includes('credit') || errMsg?.message?.includes('billing')) {
          res.json({
            valid: false,
            status: response.status,
            model: testModel,
            errorType: errMsg?.type,
            error: errMsg?.message,
            suggestion: 'Set your monthly spending limit at console.anthropic.com/settings/limits — even with credits, a $0 limit blocks all requests.',
          })
          return
        }
      } catch {
        console.log('[check-key] Could not parse error response')
      }
    } catch (err) {
      console.log('[check-key] %s network error: %s', testModel, err instanceof Error ? err.message : String(err))
    }
  }

  res.json({ valid: false, error: 'All models failed', triedModels: modelsToTry })
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

app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

export default app
