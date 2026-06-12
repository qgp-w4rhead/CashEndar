import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './db'
import paymentsRouter from './routes/payments'
import paymentTypesRouter from './routes/payment-types'
import itemsRouter from './routes/items'
import categoriesRouter from './routes/categories'
import statDefinitionsRouter from './routes/stat-definitions'
import ocrRouter from './routes/ocr'
import authRouter from './routes/auth'
import { authMiddleware } from './middleware/auth'

dotenv.config()

const PORT = process.env.PORT || 3001
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173']

const app = express()

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))
app.use(express.json())

// Health check (no auth required)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Auth routes (no auth required)
app.use('/api/auth', authRouter)

// Protected API routes
app.use('/api/payments', authMiddleware, paymentsRouter)
app.use('/api/payment-types', authMiddleware, paymentTypesRouter)
app.use('/api/items', authMiddleware, itemsRouter)
app.use('/api/categories', authMiddleware, categoriesRouter)
app.use('/api/stat-definitions', authMiddleware, statDefinitionsRouter)
app.use('/api/ocr', authMiddleware, ocrRouter)

async function start() {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`CashEndar API server running on http://localhost:${PORT}`)
  })
}

start()
