import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import pool from './config/database.js'
import authRoutes from './routes/auth.js'
import memberRoutes from './routes/members.js'
import planRoutes from './routes/plans.js'
import financeRoutes from './routes/finance.js'
import scheduleRoutes from './routes/schedule.js'
import adminRoutes from './routes/admin.js'
import { authenticate } from './middleware/auth.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'

const app = express()
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: allowedOrigins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Authorization', 'Content-Type', 'Accept'] }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('select 1')
    res.json({ estado: 'ok', baseDatos: 'conectada' })
  } catch (error) {
    next(error)
  }
})

app.use('/api/auth', authRoutes)
// Self-registration is public; every other API route requires a valid active account.
app.use('/api', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/socios') return next()
  return authenticate(req, res, next)
})
app.use('/api', memberRoutes)
app.use('/api', planRoutes)
app.use('/api', financeRoutes)
app.use('/api', scheduleRoutes)
app.use('/api', adminRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
