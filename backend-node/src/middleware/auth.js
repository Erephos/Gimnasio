import jwt from 'jsonwebtoken'
import pool from '../config/database.js'
import { asyncRoute, fail } from '../lib/http.js'

export const authenticate = asyncRoute(async (req, res, next) => {
  const header = req.get('authorization') ?? ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) throw fail.unauthorized()

  let claims
  try {
    claims = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] })
  } catch {
    throw fail.unauthorized('El token es invalido o ha vencido')
  }

  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.correo, u.activo, r.nombre AS rol
     FROM gimnasio.usuarios u JOIN gimnasio.roles r ON r.id = u.rol_id WHERE u.id = $1`,
    [claims.sub]
  )
  const user = rows[0]
  if (!user?.activo || user.rol !== claims.rol) throw fail.unauthorized('La cuenta cambio o esta inactiva; inicia sesion nuevamente')
  req.user = { ...user, id: Number(user.id) }
  next()
})
