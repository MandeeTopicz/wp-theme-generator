import express, { type Express } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

export default app
