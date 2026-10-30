import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon's pooled endpoint rejects unsupported startup parameters such as `options`.
  // All queries qualify tables with the fixed `gimnasio` schema instead of changing search_path.
  enableChannelBinding: true,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000
})

pool.on('error', (error) => {
  console.error('Error inesperado en una conexión inactiva de PostgreSQL:', error.message)
})

export default pool
