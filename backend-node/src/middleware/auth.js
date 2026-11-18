import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
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

  const user = await prisma.usuario.findUnique({
    where: { id: BigInt(claims.sub) },
    include: { rol: true }
  })
  if (!user?.activo || user.rol.nombre !== claims.rol) throw fail.unauthorized('La cuenta cambio o esta inactiva; inicia sesion nuevamente')
  req.user = { id: Number(user.id), nombre: user.nombre, apellido: user.apellido, correo: user.correo, activo: user.activo, rol: user.rol.nombre }
  next()
})
