import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncRoute, audit, fail, mapMembresia, positiveId, requireRoles, toIsoDate, validate, validIsoDate } from '../lib/http.js'

const router = Router()
const planSchema = z.object({ nombre: z.string().trim().min(1).max(30), precio: z.coerce.number().positive().max(99_999_999.99).multipleOf(0.01), duracionDias: z.coerce.number().int().positive() })
const membresiaSchema = z.object({ socioId: z.coerce.number().int().positive(), planId: z.coerce.number().int().positive(), fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() })
const todayLima = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
const validDate = (value) => validIsoDate(value)
// Las columnas fecha_inicio/fecha_fin son DATE; Prisma las lee/escribe como
// Date en medianoche UTC, asi que las fechas "AAAA-MM-DD" (hora de Lima) se
// comparan como medianoche UTC de ese mismo dia en ambos lados.
const asDate = (isoDate) => new Date(`${isoDate}T00:00:00.000Z`)

function planMap(row) { return { id: Number(row.id), nombre: row.nombre, precio: Number(row.precio), duracionDias: row.duracionDias ?? row.duracion_dias, activo: row.activo } }

const membershipInclude = { socio: { include: { usuario: true } }, plan: true }
function toMembresiaRow(m) {
  return {
    id: m.id, socioId: m.socioId, socioNombre: `${m.socio.usuario.nombre} ${m.socio.usuario.apellido}`,
    planId: m.planId, planNombre: m.plan.nombre, fechaInicio: m.fechaInicio, fechaFin: m.fechaFin,
    precioPagado: m.precioPagado, creadaEn: m.creadaEn
  }
}
async function findMembresia(id, db = prisma) {
  const m = await db.membresia.findUnique({ where: { id: BigInt(id) }, include: membershipInclude })
  if (!m) throw fail.missing('Membresia no encontrada')
  return toMembresiaRow(m)
}

router.get('/planes', asyncRoute(async (req, res) => {
  const planes = await prisma.plan.findMany({ where: { activo: true }, orderBy: { precio: 'asc' } })
  res.json(planes.map(planMap))
}))
router.get('/planes/todos', requireRoles('ADMINISTRADOR'), asyncRoute(async (req, res) => {
  const planes = await prisma.plan.findMany({ orderBy: { precio: 'asc' } })
  res.json(planes.map(planMap))
}))
router.post('/planes', requireRoles('ADMINISTRADOR'), validate(planSchema), asyncRoute(async (req, res) => {
  const plan = await prisma.$transaction(async (tx) => {
    // Advisory lock por nombre: serializa altas concurrentes con el mismo
    // nombre antes del chequeo de duplicado (Prisma no tiene equivalente).
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`plan:${req.body.nombre.toLowerCase()}`}))`
    const duplicado = await tx.plan.findFirst({ where: { nombre: { equals: req.body.nombre, mode: 'insensitive' } } })
    if (duplicado) throw fail.conflict('Ya existe un plan con ese nombre')
    const creado = await tx.plan.create({ data: { nombre: req.body.nombre, precio: req.body.precio, duracionDias: req.body.duracionDias } })
    await audit(tx, req.user.id, 'CREAR', 'PLAN', creado.id, `Plan ${req.body.nombre}`)
    return creado
  })
  res.status(201).json(planMap(plan))
}))
router.put('/planes/:id', requireRoles('ADMINISTRADOR'), validate(planSchema), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  const actualizado = await prisma.$transaction(async (tx) => {
    const existente = await tx.$queryRaw`SELECT id FROM gimnasio.planes WHERE id = ${BigInt(id)} FOR UPDATE`
    if (!existente[0]) throw fail.missing('Plan no encontrado')
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`plan:${req.body.nombre.toLowerCase()}`}))`
    const duplicado = await tx.plan.findFirst({ where: { nombre: { equals: req.body.nombre, mode: 'insensitive' }, id: { not: BigInt(id) } } })
    if (duplicado) throw fail.conflict('Ya existe otro plan con ese nombre')
    const plan = await tx.plan.update({ where: { id: BigInt(id) }, data: { nombre: req.body.nombre, precio: req.body.precio, duracionDias: req.body.duracionDias } })
    await audit(tx, req.user.id, 'ACTUALIZAR', 'PLAN', id, `Plan ${req.body.nombre}`)
    return plan
  })
  res.json(planMap(actualizado))
}))
router.patch('/planes/:id/estado', requireRoles('ADMINISTRADOR'), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  if (!['true', 'false'].includes(String(req.query.activo))) throw fail.bad('El parametro activo debe ser true o false')
  const resultado = await prisma.$transaction(async (tx) => {
    const plan = await tx.plan.findUnique({ where: { id: BigInt(id) } })
    if (!plan) throw fail.missing('Plan no encontrado')
    const actualizado = await tx.plan.update({ where: { id: BigInt(id) }, data: { activo: req.query.activo === 'true' } })
    await audit(tx, req.user.id, actualizado.activo ? 'ACTIVAR' : 'DESACTIVAR', 'PLAN', id, actualizado.nombre)
    return actualizado
  })
  res.json(planMap(resultado))
}))

router.post('/membresias', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), validate(membresiaSchema), asyncRoute(async (req, res) => {
  const inicio = req.body.fechaInicio ?? todayLima()
  if (!validDate(inicio)) throw fail.bad('La fecha de inicio debe ser una fecha valida con formato AAAA-MM-DD')
  const result = await prisma.$transaction(async (tx) => {
    const socioRows = await tx.$queryRaw`
      SELECT s.id, u.activo, s.dni FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id = s.usuario_id
      WHERE s.id = ${BigInt(req.body.socioId)} FOR UPDATE OF s, u`
    const socio = socioRows[0]
    if (!socio) throw fail.missing('Socio no encontrado')
    if (!socio.activo) throw fail.conflict('El socio esta inactivo')
    const planRows = await tx.$queryRaw`SELECT * FROM gimnasio.planes WHERE id = ${BigInt(req.body.planId)} FOR SHARE`
    const plan = planRows[0]
    if (!plan) throw fail.missing('Plan no encontrado')
    if (!plan.activo) throw fail.conflict('El plan seleccionado no esta activo')
    if (inicio < todayLima()) throw fail.bad('La fecha de inicio no puede ser anterior a hoy')
    const overlap = await tx.$queryRaw`
      SELECT 1 FROM gimnasio.membresias WHERE socio_id = ${BigInt(req.body.socioId)}
        AND fecha_inicio < (${inicio}::date + ${plan.duracion_dias}::int) AND fecha_fin > ${inicio}::date LIMIT 1`
    if (overlap[0]) throw fail.conflict('El socio ya tiene una membresia que cubre parte de ese periodo')
    const inserted = await tx.$queryRaw`
      INSERT INTO gimnasio.membresias (socio_id, plan_id, fecha_inicio, fecha_fin, precio_pagado)
      VALUES (${BigInt(req.body.socioId)}, ${BigInt(req.body.planId)}, ${inicio}::date, (${inicio}::date + ${plan.duracion_dias}::int), ${plan.precio})
      RETURNING id`
    await audit(tx, req.user.id, 'CREAR', 'MEMBRESIA', inserted[0].id, `Socio DNI ${socio.dni}, plan ${plan.nombre}, ${inicio}`)
    return findMembresia(inserted[0].id, tx)
  })
  res.status(201).json(mapMembresia(result))
}))

router.get('/membresias/mia/vigente', requireRoles('SOCIO'), asyncRoute(async (req, res) => {
  const hoy = asDate(todayLima())
  const socio = await prisma.socio.findUnique({ where: { usuarioId: BigInt(req.user.id) } })
  const m = socio && await prisma.membresia.findFirst({
    where: { socioId: socio.id, fechaInicio: { lte: hoy }, fechaFin: { gt: hoy } },
    orderBy: { fechaInicio: 'desc' },
    include: membershipInclude
  })
  if (!m) throw fail.missing('El socio no tiene una membresia vigente')
  res.json(mapMembresia(toMembresiaRow(m)))
}))
router.get('/membresias/mia', requireRoles('SOCIO'), asyncRoute(async (req, res) => {
  const socio = await prisma.socio.findUnique({ where: { usuarioId: BigInt(req.user.id) } })
  if (!socio) return res.json([])
  const lista = await prisma.membresia.findMany({ where: { socioId: socio.id }, orderBy: { fechaInicio: 'desc' }, include: membershipInclude })
  res.json(lista.map((m) => mapMembresia(toMembresiaRow(m))))
}))
router.get('/membresias/alertas', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), asyncRoute(async (req, res) => {
  const dias = Number(req.query.dias ?? 7)
  if (!Number.isInteger(dias) || dias < 0 || dias > 90) throw fail.bad('El rango de alerta debe estar entre 0 y 90 dias')
  const hoy = todayLima()
  const rows = await prisma.$queryRaw`
    SELECT m.id AS membresia_id, s.id AS socio_id, u.nombre || ' ' || u.apellido AS socio_nombre, u.correo, s.dni, p.nombre AS plan, m.fecha_fin,
           (m.fecha_fin - ${hoy}::date) AS dias_restantes
    FROM gimnasio.membresias m JOIN gimnasio.socios s ON s.id = m.socio_id JOIN gimnasio.usuarios u ON u.id = s.usuario_id
         JOIN gimnasio.planes p ON p.id = m.plan_id
    WHERE u.activo = true AND m.fecha_fin >= ${hoy}::date - 30 AND m.fecha_fin <= ${hoy}::date + ${dias}::int
    ORDER BY m.fecha_fin`
  res.json(rows.map((r) => ({
    membresiaId: Number(r.membresia_id), socioId: Number(r.socio_id), socioNombre: r.socio_nombre, correo: r.correo, dni: r.dni,
    plan: r.plan, fechaFin: toIsoDate(r.fecha_fin), diasRestantes: r.dias_restantes, estado: r.dias_restantes <= 0 ? 'VENCIDA' : 'POR_VENCER'
  })))
}))

async function membresiaList(socioId) {
  const existe = await prisma.socio.findUnique({ where: { id: BigInt(socioId) } })
  if (!existe) throw fail.missing('Socio no encontrado')
  const lista = await prisma.membresia.findMany({ where: { socioId: BigInt(socioId) }, orderBy: { fechaInicio: 'desc' }, include: membershipInclude })
  return lista.map((m) => mapMembresia(toMembresiaRow(m)))
}
router.get('/membresias/socio/:socioId', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), asyncRoute(async (req, res) => res.json(await membresiaList(positiveId(req.params.socioId, 'socioId')))))
router.get('/membresias/socio/:socioId/vigente', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), asyncRoute(async (req, res) => {
  const socioId = positiveId(req.params.socioId, 'socioId')
  const hoy = asDate(todayLima())
  const m = await prisma.membresia.findFirst({
    where: { socioId: BigInt(socioId), fechaInicio: { lte: hoy }, fechaFin: { gt: hoy } },
    orderBy: { fechaInicio: 'desc' },
    include: membershipInclude
  })
  if (!m) throw fail.missing('El socio no tiene una membresia vigente')
  res.json(mapMembresia(toMembresiaRow(m)))
}))

export default router
