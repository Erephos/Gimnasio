export function notFoundHandler(req, res) {
  res.status(404).json({
    status: 404,
    mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    errores: {},
    fecha: new Date().toISOString()
  })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  let status = Number.isInteger(error.status) ? error.status : 500
  if (error.code === '23505' || error.code === '23503') status = 409
  if (['23514', '22001', '22P02', '22007', '22008'].includes(error.code)) status = 400
  if (status >= 500) {
    console.error('Error de API:', { code: error.code, message: error.message })
  }

  const errores = { ...(error.errores ?? {}) }
  if (process.env.NODE_ENV !== 'production' && error.code) {
    errores.codigo = error.code
  }
  let mensaje = status >= 500 ? 'Ocurrió un error inesperado' : error.message
  if (error.code === '23505') mensaje = 'El registro ya existe'
  if (error.code === '23503') mensaje = 'No se puede completar porque falta un registro relacionado o tiene referencias activas'
  if (['23514', '22001', '22P02', '22007', '22008'].includes(error.code)) mensaje = 'Los datos no cumplen las reglas requeridas'

  res.status(status).json({
    status,
    mensaje,
    errores,
    fecha: new Date().toISOString()
  })
}
