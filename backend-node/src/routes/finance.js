import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncRoute, audit, fail, pageResult, paging, positiveId, requireRoles, toIsoDate, validate } from '../lib/http.js'

const router = Router()
const paymentSchema = z.object({ membresiaId: z.coerce.number().int().positive(), monto: z.coerce.number().positive().max(99_999_999.99).multipleOf(0.01), metodo: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']) })
const annulSchema = z.object({ motivo: z.string().trim().min(1).max(200) })
const checkinSchema = z.object({ dni: z.string().regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 digitos') })
const todayLima = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
const asDate = (isoDate) => new Date(`${isoDate}T00:00:00.000Z`)

const pagoInclude = { registradoPor: true, anuladoPor: true }
function toPagoRow(p, socioNombre) {
  return {
    id: p.id, socioId: p.socioId, socioNombre, membresiaId: p.membresiaId, monto: p.monto, metodo: p.metodo, estado: p.estado, fechaPago: p.fechaPago,
    registradoPor: `${p.registradoPor.nombre} ${p.registradoPor.apellido}`,
    anuladoPor: p.anuladoPor ? `${p.anuladoPor.nombre} ${p.anuladoPor.apellido}` : null,
    anuladoEn: p.anuladoEn, motivoAnulacion: p.motivoAnulacion
  }
}
function mapPago(row) {
  return {
    id: Number(row.id), socioId: Number(row.socioId), socioNombre: row.socioNombre, membresiaId: Number(row.membresiaId),
    monto: Number(row.monto), metodo: row.metodo, estado: row.estado, fechaPago: row.fechaPago, registradoPor: row.registradoPor,
    anuladoPor: row.anuladoPor, anuladoEn: row.anuladoEn, motivoAnulacion: row.motivoAnulacion
  }
}
async function findPago(id, db = prisma) {
  const p = await db.pago.findUnique({ where: { id: BigInt(id) }, include: { ...pagoInclude, socio: { include: { usuario: true } } } })
  if (!p) throw fail.missing('Pago no encontrado')
  return toPagoRow(p, `${p.socio.usuario.nombre} ${p.socio.usuario.apellido}`)
}
export function mapAsistencia(r, membresiaVigenteHasta = null) {
  return {
    id: Number(r.id), socioId: Number(r.socioId), socioNombre: r.socioNombre, dni: r.dni, fecha: toIsoDate(r.fecha), horaEntrada: r.horaEntrada, membresiaVigenteHasta,
    proximaClase: r.proximaClase ? {
      disciplina: r.proximaClase.disciplina, aula: r.proximaClase.aula,
      entrenadorNombre: `${r.proximaClase.entrenadorNombre} ${r.proximaClase.entrenadorApellido}`.trim()
    } : null
  }
}

router.post('/pagos', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), validate(paymentSchema), asyncRoute(async (req, res) => {
  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`
      SELECT m.id, m.socio_id AS "socioId", m.precio_pagado AS "precioPagado", s.dni
      FROM gimnasio.membresias m JOIN gimnasio.socios s ON s.id = m.socio_id WHERE m.id = ${BigInt(req.body.membresiaId)} FOR UPDATE OF m`
    const m = rows[0]
    if (!m) throw fail.missing('Membresia no encontrada')
    const pagado = await tx.pago.aggregate({ where: { membresiaId: m.id, estado: 'REGISTRADO' }, _sum: { monto: true } })
    const saldo = Number(m.precioPagado) - Number(pagado._sum.monto ?? 0)
    if (req.body.monto > saldo + 0.00001) throw fail.conflict(`El monto excede el saldo pendiente de la membresia (S/ ${saldo.toFixed(2)})`)
    const inserted = await tx.pago.create({
      data: { socioId: m.socioId, membresiaId: m.id, monto: req.body.monto, metodo: req.body.metodo, registradoPorId: BigInt(req.user.id) }
    })
    await audit(tx, req.user.id, 'REGISTRAR', 'PAGO', inserted.id, `S/ ${req.body.monto.toFixed(2)} ${req.body.metodo}, membresia ${m.id}`)
    return findPago(inserted.id, tx)
  })
  res.status(201).json(mapPago(result))
}))

router.get('/pagos', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), asyncRoute(async (req, res) => {
  const { page, size, offset } = paging(req, 10)
  const socioId = req.query.socioId ? BigInt(positiveId(req.query.socioId, 'socioId')) : null
  const q = String(req.query.q ?? '').trim()
  const estado = String(req.query.estado ?? '').trim().toUpperCase() || null
  if (estado && !['REGISTRADO', 'ANULADO'].includes(estado)) throw fail.bad('El estado debe ser REGISTRADO o ANULADO')
  // Busqueda por nombre concatenado + filtros combinados: se queda en SQL
  // crudo por la misma razon que en members.js.
  const [data, count] = await Promise.all([
    prisma.$queryRaw`
      SELECT p.id, p.socio_id AS "socioId", su.nombre || ' ' || su.apellido AS "socioNombre", p.membresia_id AS "membresiaId",
             p.monto, p.metodo, p.estado, p.fecha_pago AS "fechaPago",
             ru.nombre || ' ' || ru.apellido AS "registradoPor", au.nombre || ' ' || au.apellido AS "anuladoPor",
             p.anulado_en AS "anuladoEn", p.motivo_anulacion AS "motivoAnulacion"
      FROM gimnasio.pagos p JOIN gimnasio.socios s ON s.id = p.socio_id JOIN gimnasio.usuarios su ON su.id = s.usuario_id
           JOIN gimnasio.usuarios ru ON ru.id = p.registrado_por LEFT JOIN gimnasio.usuarios au ON au.id = p.anulado_por
      WHERE (${socioId}::bigint IS NULL OR p.socio_id = ${socioId})
        AND (${q} = '' OR lower(su.nombre || ' ' || su.apellido) LIKE '%' || lower(${q}) || '%' OR s.dni LIKE '%' || ${q} || '%' OR lower(su.correo) LIKE '%' || lower(${q}) || '%')
        AND (${estado}::text IS NULL OR p.estado = ${estado})
      ORDER BY p.fecha_pago DESC LIMIT ${size} OFFSET ${offset}`,
    prisma.$queryRaw`
      SELECT count(*)::int AS total FROM gimnasio.pagos p JOIN gimnasio.socios s ON s.id = p.socio_id JOIN gimnasio.usuarios su ON su.id = s.usuario_id
      WHERE (${socioId}::bigint IS NULL OR p.socio_id = ${socioId})
        AND (${q} = '' OR lower(su.nombre || ' ' || su.apellido) LIKE '%' || lower(${q}) || '%' OR s.dni LIKE '%' || ${q} || '%' OR lower(su.correo) LIKE '%' || lower(${q}) || '%')
        AND (${estado}::text IS NULL OR p.estado = ${estado})`
  ])
  res.json(pageResult(data.map(mapPago), count[0].total, page, size))
}))

router.get('/pagos/membresia/:membresiaId', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.membresiaId, 'membresiaId')
  const existe = await prisma.membresia.findUnique({ where: { id: BigInt(id) } })
  if (!existe) throw fail.missing('Membresia no encontrada')
  const pagos = await prisma.pago.findMany({
    where: { membresiaId: BigInt(id) }, orderBy: { fechaPago: 'desc' },
    include: { ...pagoInclude, socio: { include: { usuario: true } } }
  })
  res.json(pagos.map((p) => mapPago(toPagoRow(p, `${p.socio.usuario.nombre} ${p.socio.usuario.apellido}`))))
}))

router.patch('/pagos/:id/anular', requireRoles('ADMINISTRADOR'), validate(annulSchema), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`SELECT id, estado FROM gimnasio.pagos WHERE id = ${BigInt(id)} FOR UPDATE`
    if (!rows[0]) throw fail.missing('Pago no encontrado')
    if (rows[0].estado === 'ANULADO') throw fail.conflict('El pago ya fue anulado')
    await tx.pago.update({ where: { id: BigInt(id) }, data: { estado: 'ANULADO', anuladoPorId: BigInt(req.user.id), anuladoEn: new Date(), motivoAnulacion: req.body.motivo } })
    await audit(tx, req.user.id, 'ANULAR', 'PAGO', id, `Motivo: ${req.body.motivo}`)
    return findPago(id, tx)
  })
  res.json(mapPago(result))
}))

// Comparte el nucleo del check-in (vigencia de membresia + insert + audit)
// entre /asistencias (por DNI) y /asistencias/facial (por reconocimiento
// facial): ambos ya tienen el socio resuelto, solo cambia como llegaron ahi.
export async function registrarAsistencia(tx, socio, usuarioId) {
  if (!socio.activo) throw fail.conflict('El socio esta inactivo')
  const hoy = asDate(todayLima())
  const membresia = await tx.membresia.findFirst({ where: { socioId: socio.id, fechaInicio: { lte: hoy }, fechaFin: { gt: hoy } }, orderBy: { fechaInicio: 'desc' } })
  if (!membresia) throw fail.conflict('El socio no tiene una membresia vigente')
  const inserted = await tx.asistencia.create({ data: { socioId: socio.id, fecha: hoy, registradoPorId: BigInt(usuarioId) } })
  await audit(tx, usuarioId, 'REGISTRAR', 'ASISTENCIA', inserted.id, `Socio ${socio.id}`)
  // Si el socio tiene una reserva activa para una clase de hoy, el saludo
  // puede invitarlo a esa clase especifica (salon + coach) en vez de solo
  // sugerir una rutina generica.
  const proximaClase = await tx.$queryRaw`
    SELECT c.disciplina, c.aula, u.nombre AS "entrenadorNombre", u.apellido AS "entrenadorApellido"
    FROM gimnasio.reservas r
    JOIN gimnasio.clases c ON c.id = r.clase_id
    JOIN gimnasio.entrenadores e ON e.id = c.entrenador_id
    JOIN gimnasio.usuarios u ON u.id = e.usuario_id
    WHERE r.socio_id = ${socio.id} AND r.estado = 'RESERVADA' AND c.activa = true
      AND (c.inicio AT TIME ZONE 'America/Lima')::date = ${todayLima()}::date
    ORDER BY c.inicio ASC LIMIT 1`
  return { ...inserted, dni: socio.dni, socioNombre: `${socio.nombre} ${socio.apellido}`, membresiaFin: membresia.fechaFin, proximaClase: proximaClase[0] ?? null }
}

router.post('/asistencias', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), validate(checkinSchema), asyncRoute(async (req, res) => {
  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`
      SELECT s.id, s.dni, u.activo, u.nombre, u.apellido FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id = s.usuario_id
      WHERE s.dni = ${req.body.dni} FOR UPDATE OF s, u`
    const socio = rows[0]
    if (!socio) throw fail.missing('No existe un socio con ese DNI')
    return registrarAsistencia(tx, socio, req.user.id)
  })
  res.status(201).json(mapAsistencia(result, toIsoDate(result.membresiaFin)))
}))

router.get('/asistencias', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), asyncRoute(async (req, res) => {
  const { page, size, offset } = paging(req, 20)
  const fecha = String(req.query.fecha ?? todayLima())
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw fail.bad('La fecha debe tener formato AAAA-MM-DD')
  const q = String(req.query.q ?? '').trim()
  const [data, count] = await Promise.all([
    prisma.$queryRaw`
      SELECT a.id, a.socio_id AS "socioId", u.nombre || ' ' || u.apellido AS "socioNombre", s.dni, a.fecha, a.hora_entrada AS "horaEntrada"
      FROM gimnasio.asistencias a JOIN gimnasio.socios s ON s.id = a.socio_id JOIN gimnasio.usuarios u ON u.id = s.usuario_id
      WHERE a.fecha = ${fecha}::date AND (${q} = '' OR lower(u.nombre || ' ' || u.apellido) LIKE '%' || lower(${q}) || '%' OR s.dni LIKE '%' || ${q} || '%')
      ORDER BY a.hora_entrada DESC LIMIT ${size} OFFSET ${offset}`,
    prisma.$queryRaw`
      SELECT count(*)::int AS total FROM gimnasio.asistencias a JOIN gimnasio.socios s ON s.id = a.socio_id JOIN gimnasio.usuarios u ON u.id = s.usuario_id
      WHERE a.fecha = ${fecha}::date AND (${q} = '' OR lower(u.nombre || ' ' || u.apellido) LIKE '%' || lower(${q}) || '%' OR s.dni LIKE '%' || ${q} || '%')`
  ])
  res.json(pageResult(data.map((r) => mapAsistencia(r)), count[0].total, page, size))
}))

router.get('/asistencias/socio/:socioId', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), asyncRoute(async (req, res) => {
  const socioId = positiveId(req.params.socioId, 'socioId')
  const { page, size, offset } = paging(req, 20)
  const existe = await prisma.socio.findUnique({ where: { id: BigInt(socioId) } })
  if (!existe) throw fail.missing('Socio no encontrado')
  const [data, total] = await Promise.all([
    prisma.asistencia.findMany({
      where: { socioId: BigInt(socioId) }, orderBy: { horaEntrada: 'desc' }, skip: offset, take: size,
      include: { socio: { include: { usuario: true } } }
    }),
    prisma.asistencia.count({ where: { socioId: BigInt(socioId) } })
  ])
  const content = data.map((a) => mapAsistencia({
    id: a.id, socioId: a.socioId, socioNombre: `${a.socio.usuario.nombre} ${a.socio.usuario.apellido}`, dni: a.socio.dni, fecha: a.fecha, horaEntrada: a.horaEntrada
  }))
  res.json(pageResult(content, total, page, size))
}))

export default router
