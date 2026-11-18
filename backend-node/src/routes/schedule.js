import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncRoute, audit, fail, positiveId, requireRoles, validate } from '../lib/http.js'

const router = Router()
const claseSchema = z.object({ disciplina: z.string().trim().min(1).max(30), entrenadorId: z.coerce.number().int().positive(), aula: z.string().trim().min(1).max(30), inicio: z.string().datetime({ offset: true }), fin: z.string().datetime({ offset: true }), aforo: z.coerce.number().int().positive() })
const reservaSchema = z.object({ claseId: z.coerce.number().int().positive(), socioId: z.coerce.number().int().positive().optional() })
const asDate = (isoDate) => new Date(`${isoDate}T00:00:00.000Z`)

const claseInclude = { entrenador: { include: { usuario: true } } }
function toClaseRow(c) {
  return {
    id: c.id, disciplina: c.disciplina, entrenadorId: c.entrenadorId, entrenadorNombre: `${c.entrenador.usuario.nombre} ${c.entrenador.usuario.apellido}`,
    aula: c.aula, inicio: c.inicio, fin: c.fin, aforo: c.aforo, activa: c.activa, creadaEn: c.creadaEn
  }
}
function mapClase(r, reservas = 0) {
  return {
    id: Number(r.id), disciplina: r.disciplina, entrenadorId: Number(r.entrenadorId), entrenadorNombre: r.entrenadorNombre,
    aula: r.aula, inicio: r.inicio, fin: r.fin, aforo: r.aforo, reservasActivas: Number(reservas),
    cuposDisponibles: Math.max(0, r.aforo - Number(reservas)), activa: r.activa
  }
}
async function findClase(id, db = prisma) {
  const c = await db.clase.findUnique({ where: { id: BigInt(id) }, include: claseInclude })
  if (!c) throw fail.missing('Clase no encontrada')
  return toClaseRow(c)
}

const reservaInclude = { clase: true, socio: { include: { usuario: true } } }
function toReservaRow(r) {
  return {
    id: r.id, claseId: r.claseId, disciplina: r.clase.disciplina, inicio: r.clase.inicio, fin: r.clase.fin,
    socioId: r.socioId, socioNombre: `${r.socio.usuario.nombre} ${r.socio.usuario.apellido}`, estado: r.estado, asistioEn: r.asistioEn, creadaEn: r.creadaEn
  }
}
function mapReserva(row) {
  return {
    id: Number(row.id), claseId: Number(row.claseId), disciplina: row.disciplina, inicio: row.inicio, fin: row.fin,
    socioId: Number(row.socioId), socioNombre: row.socioNombre, estado: row.estado, asistioEn: row.asistioEn, creadaEn: row.creadaEn
  }
}
async function findReserva(id, db = prisma) {
  const r = await db.reserva.findUnique({ where: { id: BigInt(id) }, include: reservaInclude })
  if (!r) throw fail.missing('Reserva no encontrada')
  return toReservaRow(r)
}

router.get('/clases', asyncRoute(async (req, res) => {
  const clases = await prisma.clase.findMany({ where: { activa: true, fin: { gt: new Date() } }, orderBy: { inicio: 'asc' }, include: claseInclude })
  const content = await Promise.all(clases.map(async (c) => {
    const n = await prisma.reserva.count({ where: { claseId: c.id, estado: 'RESERVADA' } })
    return mapClase(toClaseRow(c), n)
  }))
  res.json(content)
}))

router.post('/clases', requireRoles('ADMINISTRADOR'), validate(claseSchema), asyncRoute(async (req, res) => {
  const b = req.body
  if (new Date(b.fin) <= new Date(b.inicio)) throw fail.bad('La hora de fin debe ser posterior a la de inicio')
  if (new Date(b.inicio) <= new Date()) throw fail.bad('La clase debe empezar en el futuro')
  const result = await prisma.$transaction(async (tx) => {
    // Serializa altas concurrentes del mismo entrenador o aula (igual que con pg).
    const lockKeys = [`trainer:${b.entrenadorId}`, `room:${b.aula.toLowerCase()}`].sort()
    for (const key of lockKeys) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`
    const trainer = await tx.entrenador.findUnique({ where: { id: BigInt(b.entrenadorId) }, include: { usuario: true } })
    if (!trainer) throw fail.missing('Entrenador no encontrado')
    if (!trainer.usuario.activo) throw fail.conflict('El entrenador esta inactivo')
    const overlapTrainer = await tx.clase.findFirst({ where: { activa: true, entrenadorId: BigInt(b.entrenadorId), inicio: { lt: new Date(b.fin) }, fin: { gt: new Date(b.inicio) } } })
    if (overlapTrainer) throw fail.conflict('El entrenador ya tiene otra clase en ese horario')
    const overlapRoom = await tx.clase.findFirst({ where: { activa: true, aula: { equals: b.aula, mode: 'insensitive' }, inicio: { lt: new Date(b.fin) }, fin: { gt: new Date(b.inicio) } } })
    if (overlapRoom) throw fail.conflict('El aula ya esta ocupada en ese horario')
    const creada = await tx.clase.create({ data: { disciplina: b.disciplina, entrenadorId: BigInt(b.entrenadorId), aula: b.aula, inicio: new Date(b.inicio), fin: new Date(b.fin), aforo: b.aforo } })
    await audit(tx, req.user.id, 'CREAR', 'CLASE', creada.id, `${b.disciplina} en ${b.aula} ${b.inicio}`)
    return findClase(creada.id, tx)
  })
  res.status(201).json(mapClase(result))
}))

router.patch('/clases/:id/cancelar', requireRoles('ADMINISTRADOR'), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  const result = await prisma.$transaction(async (tx) => {
    const lock = await tx.$queryRaw`SELECT id, activa FROM gimnasio.clases WHERE id = ${BigInt(id)} FOR UPDATE`
    if (!lock[0]) throw fail.missing('Clase no encontrada')
    if (!lock[0].activa) throw fail.conflict('La clase ya esta cancelada')
    await tx.clase.update({ where: { id: BigInt(id) }, data: { activa: false } })
    const canceladas = await tx.reserva.updateMany({ where: { claseId: BigInt(id), estado: 'RESERVADA' }, data: { estado: 'CANCELADA' } })
    await audit(tx, req.user.id, 'CANCELAR', 'CLASE', id, `${canceladas.count} reservas canceladas`)
    return findClase(id, tx)
  })
  res.json(mapClase({ ...result, activa: false }, 0))
}))

router.post('/reservas', requireRoles('SOCIO', 'ADMINISTRADOR', 'RECEPCIONISTA'), validate(reservaSchema), asyncRoute(async (req, res) => {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(71001::int, ${req.body.claseId}::int)`
    let socioId
    if (req.user.rol === 'SOCIO') {
      const own = await tx.socio.findUnique({ where: { usuarioId: BigInt(req.user.id) } })
      if (!own) throw fail.missing('Perfil de socio no encontrado')
      socioId = own.id
    } else {
      if (!req.body.socioId) throw fail.bad('Debe indicar el socioId')
      socioId = BigInt(req.body.socioId)
    }
    const clase = await tx.clase.findUnique({ where: { id: BigInt(req.body.claseId) } })
    if (!clase) throw fail.missing('Clase no encontrada')
    if (!clase.activa) throw fail.conflict('La clase esta cancelada')
    if (new Date(clase.inicio) <= new Date()) throw fail.conflict('La clase ya comenzo')
    const socio = await tx.socio.findUnique({ where: { id: socioId }, include: { usuario: true } })
    if (!socio) throw fail.missing('Socio no encontrado')
    if (!socio.usuario.activo) throw fail.conflict('El socio esta inactivo')
    const dup = await tx.reserva.findFirst({ where: { claseId: clase.id, socioId, estado: 'RESERVADA' } })
    if (dup) throw fail.conflict('El socio ya tiene una reserva en esta clase')
    const claseFechaLima = new Date(clase.inicio).toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
    const miembro = await tx.membresia.findFirst({ where: { socioId, fechaInicio: { lte: asDate(claseFechaLima) }, fechaFin: { gt: asDate(claseFechaLima) } } })
    if (!miembro) throw fail.conflict('El socio no tiene membresia vigente en la fecha de la clase')
    const cnt = await tx.reserva.count({ where: { claseId: clase.id, estado: 'RESERVADA' } })
    if (cnt >= clase.aforo) throw fail.conflict('La clase esta llena')
    const creada = await tx.reserva.create({ data: { claseId: clase.id, socioId } })
    await audit(tx, req.user.id, 'RESERVAR', 'RESERVA', creada.id, `Clase ${clase.id}, socio ${socioId}`)
    return findReserva(creada.id, tx)
  })
  res.status(201).json(mapReserva(result))
}))

router.get('/reservas/mias', requireRoles('SOCIO'), asyncRoute(async (req, res) => {
  const socio = await prisma.socio.findUnique({ where: { usuarioId: BigInt(req.user.id) } })
  if (!socio) throw fail.missing('Perfil de socio no encontrado')
  const reservas = await prisma.reserva.findMany({ where: { socioId: socio.id }, orderBy: { clase: { inicio: 'desc' } }, include: reservaInclude })
  res.json(reservas.map((r) => mapReserva(toReservaRow(r))))
}))

router.get('/reservas/clase/:claseId', requireRoles('ENTRENADOR', 'ADMINISTRADOR', 'RECEPCIONISTA'), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.claseId, 'claseId')
  const clase = await prisma.clase.findUnique({ where: { id: BigInt(id) }, include: { entrenador: true } })
  if (!clase) throw fail.missing('Clase no encontrada')
  if (req.user.rol === 'ENTRENADOR' && Number(clase.entrenador.usuarioId) !== req.user.id) throw fail.forbidden('Esta clase pertenece a otro entrenador')
  const reservas = await prisma.reserva.findMany({ where: { claseId: BigInt(id), estado: 'RESERVADA' }, orderBy: { creadaEn: 'asc' }, include: reservaInclude })
  res.json(reservas.map((r) => mapReserva(toReservaRow(r))))
}))

router.patch('/reservas/:id/cancelar', requireRoles('SOCIO', 'ADMINISTRADOR', 'RECEPCIONISTA'), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  const result = await prisma.$transaction(async (tx) => {
    const lock = await tx.$queryRaw`
      SELECT r.id, r.estado, r.socio_id AS "socioId", c.inicio FROM gimnasio.reservas r
      JOIN gimnasio.clases c ON c.id = r.clase_id WHERE r.id = ${BigInt(id)} FOR UPDATE OF r`
    const r = lock[0]
    if (!r) throw fail.missing('Reserva no encontrada')
    const socio = await tx.socio.findUnique({ where: { id: r.socioId } })
    if (req.user.rol === 'SOCIO' && Number(socio.usuarioId) !== req.user.id) throw fail.forbidden('No puedes cancelar la reserva de otro socio')
    if (r.estado !== 'RESERVADA') throw fail.conflict('La reserva ya esta cancelada')
    if (new Date(r.inicio) <= new Date()) throw fail.conflict('No se puede cancelar una clase que ya comenzo')
    await tx.reserva.update({ where: { id: BigInt(id) }, data: { estado: 'CANCELADA' } })
    await audit(tx, req.user.id, 'CANCELAR', 'RESERVA', id, 'Reserva cancelada')
    return findReserva(id, tx)
  })
  res.json(mapReserva(result))
}))

router.patch('/reservas/:id/asistencia', requireRoles('ENTRENADOR', 'ADMINISTRADOR', 'RECEPCIONISTA'), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  const result = await prisma.$transaction(async (tx) => {
    const lock = await tx.$queryRaw`
      SELECT r.id, r.estado, r.asistio_en AS "asistioEn", r.clase_id AS "claseId" FROM gimnasio.reservas r WHERE r.id = ${BigInt(id)} FOR UPDATE OF r`
    const r = lock[0]
    if (!r) throw fail.missing('Reserva no encontrada')
    const clase = await tx.clase.findUnique({ where: { id: r.claseId }, include: { entrenador: true } })
    if (req.user.rol === 'ENTRENADOR' && Number(clase.entrenador.usuarioId) !== req.user.id) throw fail.forbidden('Esta clase pertenece a otro entrenador')
    if (r.estado !== 'RESERVADA') throw fail.conflict('No se puede marcar asistencia en una reserva cancelada')
    if (r.asistioEn) throw fail.conflict('La asistencia ya fue marcada')
    await tx.reserva.update({ where: { id: BigInt(id) }, data: { asistioEn: new Date() } })
    await audit(tx, req.user.id, 'ASISTENCIA', 'RESERVA', id, 'Asistencia a clase registrada')
    return findReserva(id, tx)
  })
  res.json(mapReserva(result))
}))

export default router
