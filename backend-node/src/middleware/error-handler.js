import { Prisma } from '@prisma/client'

export function notFoundHandler(req, res) {
  res.status(404).json({
    status: 404,
    mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    errores: {},
    fecha: new Date().toISOString()
  })
}

// Codigos de Postgres que antes llegaban directo del driver `pg`. Con
// Prisma, las operaciones del ORM (create/update) ya traen su propio
// codigo (P2002, P2003); las consultas crudas ($queryRaw/$executeRaw,
// usadas para locks y joins complejos) fallan con P2010 y el codigo real
// de Postgres queda en error.meta.code, asi que se revisa ahi tambien.
const BAD_REQUEST_PG_CODES = ['23514', '22001', '22P02', '22007', '22008']

function postgresCode(error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return '23505'
    if (error.code === 'P2003') return '23503'
    if (error.code === 'P2010') return error.meta?.code
  }
  return error.code
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  const code = postgresCode(error)
  let status = Number.isInteger(error.status) ? error.status : 500
  if (code === '23505' || code === '23503') status = 409
  if (BAD_REQUEST_PG_CODES.includes(code)) status = 400
  if (status >= 500) {
    console.error('Error de API:', { code, message: error.message })
  }

  const errores = { ...(error.errores ?? {}) }
  if (process.env.NODE_ENV !== 'production' && code) {
    errores.codigo = code
  }
  let mensaje = status >= 500 ? 'Ocurrió un error inesperado' : error.message
  if (code === '23505') mensaje = 'El registro ya existe'
  if (code === '23503') mensaje = 'No se puede completar porque falta un registro relacionado o tiene referencias activas'
  if (BAD_REQUEST_PG_CODES.includes(code)) mensaje = 'Los datos no cumplen las reglas requeridas'

  res.status(status).json({
    status,
    mensaje,
    errores,
    fecha: new Date().toISOString()
  })
}
