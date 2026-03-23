import express, { type Express } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { sanitize } from './middleware/sanitize'
import { errorHandler } from './middleware/errorHandler'
import { generateRouter } from './routes/generate'
import { downloadRouter } from './routes/download'
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

const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
})

app.use('/api/generate', generateLimiter, sanitize, generateRouter)
app.use('/api/download', downloadRouter)
app.use('/api/validate', sanitize, validateRouter)
app.use('/api/iterate', sanitize, iterateRouter)

app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

export default app
