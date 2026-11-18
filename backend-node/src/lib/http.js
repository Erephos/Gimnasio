export class ApiError extends Error {
  constructor(status, message, errores = {}) {
    super(message)
    this.status = status
    this.errores = errores
  }
}

export const fail = {
  bad: (message, errores) => new ApiError(400, message, errores),
  unauthorized: (message = 'No autenticado') => new ApiError(401, message),
  forbidden: (message = 'No tienes permisos para realizar esta operacion') => new ApiError(403, message),
  missing: (message = 'Recurso no encontrado') => new ApiError(404, message),
  conflict: (message) => new ApiError(409, message)
}

export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errores = Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.') || 'body', issue.message]))
      return next(fail.bad('Hay datos invalidos en la peticion', errores))
    }
    req.body = result.data
    next()
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(fail.unauthorized())
    if (!roles.includes(req.user.rol)) return next(fail.forbidden())
    next()
  }
}

export function positiveId(value, label = 'id') {
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id <= 0) throw fail.bad(`${label} debe ser un entero positivo`)
  return id
}

export function paging(req, fallback = 10, max = 50) {
  const page = Math.max(0, Number.parseInt(req.query.page ?? '0', 10) || 0)
  const size = Math.max(1, Math.min(Number.parseInt(req.query.size ?? String(fallback), 10) || fallback, max))
  return { page, size, offset: page * size }
}

export function pageResult(content, total, page, size) {
  const totalPages = Math.ceil(total / size)
  return {
    content,
    pageable: { pageNumber: page, pageSize: size, offset: page * size, paged: true, unpaged: false },
    totalElements: Number(total),
    totalPages,
    last: page >= totalPages - 1,
    first: page === 0,
    size,
    number: page,
    numberOfElements: content.length,
    empty: content.length === 0,
    sort: { empty: true, sorted: false, unsorted: true }
  }
}

export function validIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

// Postgres DATE columns llegan de Prisma como Date de medianoche UTC;
// las rutas devuelven "AAAA-MM-DD" igual que antes con pg. Tambien acepta
// un string "AAAA-MM-DD..." ya listo (util en tests y en algunas filas crudas).
export const toIsoDate = (date) => {
  if (!date) return date
  return date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10)
}

export const fullName = (row, prefix = '') => `${row[`${prefix}nombre`]} ${row[`${prefix}apellido`]}`.trim()

export function mapSocio(row) {
  return {
    id: Number(row.id), nombreCompleto: `${row.nombre} ${row.apellido}`.trim(), correo: row.correo,
    dni: row.dni, telefono: row.telefono, genero: row.genero, direccion: row.direccion,
    contactoEmergencia: row.contactoEmergencia, activo: row.activo, creadoEn: row.creadoEn
  }
}

export function mapUsuario(row) {
  return { id: Number(row.id), nombre: row.nombre, apellido: row.apellido, correo: row.correo,
    rol: row.rol, activo: row.activo, creadoEn: row.creadoEn }
}

export function mapMembresia(row, hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })) {
  const fechaInicio = toIsoDate(row.fechaInicio)
  const fechaFin = toIsoDate(row.fechaFin)
  return { id: Number(row.id), socioId: Number(row.socioId), socioNombre: `${row.socioNombre}`.trim(),
    planId: Number(row.planId), planNombre: row.planNombre, fechaInicio, fechaFin,
    precioPagado: row.precioPagado, vigente: fechaInicio <= hoy && hoy < fechaFin, creadaEn: row.creadaEn }
}

// Reemplaza al INSERT crudo en gimnasio.auditoria: recibe el cliente de
// Prisma (prisma o el tx de una transaccion) en vez del Pool de pg.
export async function audit(db, usuarioId, accion, entidad, entidadId, detalle = null) {
  await db.auditoria.create({
    data: {
      usuarioId: usuarioId === null || usuarioId === undefined ? null : BigInt(usuarioId),
      accion,
      entidad,
      entidadId: entidadId === null || entidadId === undefined ? null : BigInt(entidadId),
      detalle
    }
  })
}
