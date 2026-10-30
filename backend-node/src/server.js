import 'dotenv/config'
import app from './app.js'
import pool from './config/database.js'

if (!process.env.DATABASE_URL) throw new Error('Falta configurar DATABASE_URL en el archivo .env')
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe configurarse con al menos 32 caracteres')
}

const port = Number(process.env.PORT ?? 8080)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe ser un puerto valido')
const server = app.listen(port, () => {
  console.log(`API del gimnasio escuchando en http://localhost:${port}`)
})

async function shutdown(signal) {
  console.log(`Señal ${signal}; cerrando API...`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
