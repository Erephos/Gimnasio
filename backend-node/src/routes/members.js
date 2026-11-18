import { Router } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { asyncRoute, audit, fail, mapSocio, mapUsuario, pageResult, paging, positiveId, requireRoles, validate } from '../lib/http.js'

const router = Router()
const email = z.string().email().max(100)
const password = z.string().min(8).max(100)
const dni = z.string().regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 digitos')
const telefono = z.string().regex(/^\d{9}$/, 'El telefono debe tener exactamente 9 digitos').nullable().optional()
const registroSocio = z.object({ nombre: z.string().trim().min(1).max(60), apellido: z.string().trim().min(1).max(60), correo: email, password, dni, telefono,
  genero: z.enum(['MASCULINO', 'FEMENINO']), direccion: z.string().max(150).nullable().optional(), contactoEmergencia: z.string().max(100).nullable().optional() })
const actualizacionSocio = z.object({ correo: email.optional(), telefono, direccion: z.string().max(150).nullable().optional(),
  contactoEmergencia: z.string().max(100).nullable().optional(), dni: dni.optional() }).refine((body) => Object.keys(body).length > 0, 'Indica al menos un dato para actualizar')
const registroPersonal = z.object({ nombre: z.string().trim().min(1).max(60), apellido: z.string().trim().min(1).max(60), correo: email,
  password, rol: z.enum(['ADMINISTRADOR', 'RECEPCIONISTA']) })
const cambioRol = z.object({ rol: z.enum(['ADMINISTRADOR', 'RECEPCIONISTA']) })
const cambioPassword = z.object({ passwordActual: z.string().min(1), passwordNueva: password })
const registroEntrenador = z.object({ nombre: z.string().trim().min(1).max(60), apellido: z.string().trim().min(1).max(60), correo: email,
  password, dni, telefono, especialidad: z.string().trim().min(1).max(50) })

async function roleId(db, name) {
  const rol = await db.rol.findUnique({ where: { nombre: name } })
  if (!rol) throw new Error(`El rol ${name} no existe en la base de datos`)
  return rol.id
}

// Sin lock: lectura normal via Prisma, aplanada igual que la version con pg.
// Con lock: SELECT ... FOR UPDATE crudo, porque Prisma no bloquea filas
// desde su API de modelos (se necesita para PUT/DELETE /socios/:id).
async function findSocio(id, db = prisma, lock = false) {
  if (lock) {
    const rows = await db.$queryRaw`
      SELECT s.id, s.usuario_id AS "usuarioId", s.dni, s.telefono, s.genero, s.direccion,
             s.contacto_emergencia AS "contactoEmergencia", s.creado_en AS "creadoEn",
             u.nombre, u.apellido, u.correo, u.activo
      FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id = s.usuario_id
      WHERE s.id = ${BigInt(id)} FOR UPDATE OF s, u`
    if (!rows[0]) throw fail.missing('Socio no encontrado')
    return rows[0]
  }
  const socio = await db.socio.findUnique({ where: { id: BigInt(id) }, include: { usuario: true } })
  if (!socio) throw fail.missing('Socio no encontrado')
  return {
    id: socio.id, usuarioId: socio.usuarioId, dni: socio.dni, telefono: socio.telefono, genero: socio.genero,
    direccion: socio.direccion, contactoEmergencia: socio.contactoEmergencia, creadoEn: socio.creadoEn,
    nombre: socio.usuario.nombre, apellido: socio.usuario.apellido, correo: socio.usuario.correo, activo: socio.usuario.activo
  }
}

router.post('/socios', validate(registroSocio), asyncRoute(async (req, res) => {
  const body = req.body
  const result = await prisma.$transaction(async (tx) => {
    const rol = await roleId(tx, 'SOCIO')
    const hash = await bcrypt.hash(body.password, 12)
    const usuario = await tx.usuario.create({
      data: { nombre: body.nombre, apellido: body.apellido, correo: body.correo.trim().toLowerCase(), passwordHash: hash, rolId: rol }
    })
    const socio = await tx.socio.create({
      data: {
        usuarioId: usuario.id, dni: body.dni, telefono: body.telefono ?? null, genero: body.genero,
        direccion: body.direccion?.trim() ?? null, contactoEmergencia: body.contactoEmergencia?.trim() ?? null
      }
    })
    await audit(tx, usuario.id, 'REGISTRAR', 'SOCIO', socio.id, 'Alta de socio')
    return findSocio(socio.id, tx)
  })
  res.status(201).json({ ...mapSocio(result), mensaje: 'REGISTRO EXITOSO' })
}))

router.get('/socios/mi-perfil', requireRoles('SOCIO'), asyncRoute(async (req, res) => {
  const socio = await prisma.socio.findUnique({ where: { usuarioId: BigInt(req.user.id) } })
  if (!socio) throw fail.missing('No existe un perfil de socio para este usuario')
  res.json(mapSocio(await findSocio(socio.id)))
}))

router.get('/socios', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), asyncRoute(async (req, res) => {
  const { page, size, offset } = paging(req, 10)
  const q = String(req.query.q ?? '').trim()
  if (req.query.activo !== undefined && !['true', 'false'].includes(String(req.query.activo))) throw fail.bad('El parametro activo debe ser true o false')
  const activo = req.query.activo === undefined ? null : req.query.activo === 'true'
  // Busqueda por "nombre apellido" concatenado + DNI + correo: Prisma no
  // modela OR sobre una concatenacion de columnas de dos tablas, asi que
  // se mantiene como consulta cruda (igual que con pg).
  const [data, count] = await Promise.all([
    prisma.$queryRaw`
      SELECT s.id, s.usuario_id AS "usuarioId", s.dni, s.telefono, s.genero, s.direccion,
             s.contacto_emergencia AS "contactoEmergencia", s.creado_en AS "creadoEn",
             u.nombre, u.apellido, u.correo, u.activo
      FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id = s.usuario_id
      WHERE (${q} = '' OR lower(u.nombre || ' ' || u.apellido) LIKE '%' || lower(${q}) || '%'
             OR s.dni LIKE '%' || ${q} || '%' OR lower(u.correo) LIKE '%' || lower(${q}) || '%')
        AND (${activo}::boolean IS NULL OR u.activo = ${activo})
      ORDER BY u.apellido, u.nombre LIMIT ${size} OFFSET ${offset}`,
    prisma.$queryRaw`
      SELECT count(*)::int AS total FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id = s.usuario_id
      WHERE (${q} = '' OR lower(u.nombre || ' ' || u.apellido) LIKE '%' || lower(${q}) || '%'
             OR s.dni LIKE '%' || ${q} || '%' OR lower(u.correo) LIKE '%' || lower(${q}) || '%')
        AND (${activo}::boolean IS NULL OR u.activo = ${activo})`
  ])
  res.json(pageResult(data.map(mapSocio), count[0].total, page, size))
}))

router.get('/socios/:id', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA', 'SOCIO'), asyncRoute(async (req, res) => {
  const socio = await findSocio(positiveId(req.params.id))
  if (req.user.rol === 'SOCIO' && Number(socio.usuarioId) !== req.user.id) throw fail.forbidden('No puedes consultar el perfil de otro socio')
  res.json(mapSocio(socio))
}))

router.put('/socios/:id', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA', 'SOCIO'), validate(actualizacionSocio), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  const updated = await prisma.$transaction(async (tx) => {
    const socio = await findSocio(id, tx, true)
    const admin = req.user.rol === 'ADMINISTRADOR'
    const staff = admin || req.user.rol === 'RECEPCIONISTA'
    if (!staff && Number(socio.usuarioId) !== req.user.id) throw fail.forbidden('No puedes modificar el perfil de otro socio')
    if (req.body.dni && !admin) throw fail.forbidden('Solo un administrador puede corregir el DNI')
    if (req.body.correo !== undefined) {
      await tx.usuario.update({ where: { id: socio.usuarioId }, data: { correo: req.body.correo.trim().toLowerCase(), actualizadoEn: new Date() } })
    }
    const socioData = {}
    if (req.body.telefono !== undefined) socioData.telefono = req.body.telefono
    if (req.body.direccion !== undefined) socioData.direccion = req.body.direccion?.trim() ?? null
    if (req.body.contactoEmergencia !== undefined) socioData.contactoEmergencia = req.body.contactoEmergencia?.trim() ?? null
    if (req.body.dni !== undefined) socioData.dni = req.body.dni
    if (Object.keys(socioData).length > 0) await tx.socio.update({ where: { id: BigInt(id) }, data: socioData })
    await audit(tx, req.user.id, 'ACTUALIZAR', 'SOCIO', id, 'Datos de contacto actualizados')
    return findSocio(id, tx)
  })
  res.json({ ...mapSocio(updated), mensaje: 'DATOS ACTUALIZADOS' })
}))

router.delete('/socios/:id', requireRoles('ADMINISTRADOR'), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  await prisma.$transaction(async (tx) => {
    const socio = await findSocio(id, tx, true)
    if (!socio.activo) throw fail.conflict('El socio ya esta inactivo')
    await tx.usuario.update({ where: { id: socio.usuarioId }, data: { activo: false, actualizadoEn: new Date() } })
    await audit(tx, req.user.id, 'DESACTIVAR', 'SOCIO', id, 'Cuenta desactivada; historial preservado')
  })
  res.json({ mensaje: 'El socio fue desactivado correctamente.' })
}))

router.post('/usuarios', requireRoles('ADMINISTRADOR'), validate(registroPersonal), asyncRoute(async (req, res) => {
  const body = req.body
  const result = await prisma.$transaction(async (tx) => {
    const rol = await roleId(tx, body.rol)
    const hash = await bcrypt.hash(body.password, 12)
    const user = await tx.usuario.create({
      data: { nombre: body.nombre, apellido: body.apellido, correo: body.correo.trim().toLowerCase(), passwordHash: hash, rolId: rol }
    })
    await audit(tx, req.user.id, 'CREAR', 'USUARIO', user.id, `Cuenta ${body.rol} ${user.correo}`)
    return { ...user, rol: body.rol }
  })
  res.status(201).json(mapUsuario(result))
}))

router.get('/usuarios', requireRoles('ADMINISTRADOR'), asyncRoute(async (req, res) => {
  const { page, size, offset } = paging(req, 10)
  const rol = String(req.query.rol ?? '').trim().toUpperCase()
  const where = rol ? { rol: { nombre: rol } } : {}
  const [data, total] = await Promise.all([
    prisma.usuario.findMany({ where, include: { rol: true }, orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }], skip: offset, take: size }),
    prisma.usuario.count({ where })
  ])
  res.json(pageResult(data.map((u) => mapUsuario({ ...u, rol: u.rol.nombre })), total, page, size))
}))

router.patch('/usuarios/mi-password', authenticate, validate(cambioPassword), asyncRoute(async (req, res) => {
  const user = await prisma.usuario.findUnique({ where: { id: BigInt(req.user.id) } })
  if (!(await bcrypt.compare(req.body.passwordActual, user.passwordHash))) throw fail.bad('La contrasena actual es incorrecta')
  if (await bcrypt.compare(req.body.passwordNueva, user.passwordHash)) throw fail.bad('La nueva contrasena debe ser distinta a la actual')
  const hash = await bcrypt.hash(req.body.passwordNueva, 12)
  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({ where: { id: BigInt(req.user.id) }, data: { passwordHash: hash, actualizadoEn: new Date() } })
    await audit(tx, req.user.id, 'CAMBIAR_PASSWORD', 'USUARIO', req.user.id, 'Cambio de contrasena por el propio usuario')
  })
  res.json({ mensaje: 'Contrasena actualizada correctamente' })
}))

router.patch('/usuarios/:id/rol', requireRoles('ADMINISTRADOR'), validate(cambioRol), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`
      SELECT u.id, u.nombre, u.apellido, u.correo, u.activo, u.creado_en AS "creadoEn", r.nombre AS rol
      FROM gimnasio.usuarios u JOIN gimnasio.roles r ON r.id = u.rol_id WHERE u.id = ${BigInt(id)} FOR UPDATE OF u`
    const user = rows[0]
    if (!user) throw fail.missing('Usuario no encontrado')
    if (id === req.user.id) throw fail.forbidden('No puedes cambiar tu propio rol')
    if (!['ADMINISTRADOR', 'RECEPCIONISTA'].includes(user.rol)) throw fail.conflict('Solo se puede cambiar el rol de administradores y recepcionistas')
    if (user.rol === req.body.rol) throw fail.conflict('El usuario ya tiene ese rol')
    const rolId = await roleId(tx, req.body.rol)
    await tx.usuario.update({ where: { id: BigInt(id) }, data: { rolId, actualizadoEn: new Date() } })
    await audit(tx, req.user.id, 'CAMBIAR_ROL', 'USUARIO', id, `${user.rol} -> ${req.body.rol}`)
    return { ...user, rol: req.body.rol }
  })
  res.json(mapUsuario(result))
}))

router.patch('/usuarios/:id/estado', requireRoles('ADMINISTRADOR'), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  if (!['true', 'false'].includes(String(req.query.activo))) throw fail.bad('El parametro activo debe ser true o false')
  const activo = req.query.activo === 'true'
  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`
      SELECT u.id, u.nombre, u.apellido, u.correo, u.activo, u.creado_en AS "creadoEn", r.nombre AS rol
      FROM gimnasio.usuarios u JOIN gimnasio.roles r ON r.id = u.rol_id WHERE u.id = ${BigInt(id)} FOR UPDATE OF u`
    const user = rows[0]
    if (!user) throw fail.missing('Usuario no encontrado')
    if (id === req.user.id) throw fail.forbidden('No puedes desactivar tu propia cuenta')
    if (user.activo === activo) throw fail.conflict(activo ? 'La cuenta ya esta activa' : 'La cuenta ya esta inactiva')
    await tx.usuario.update({ where: { id: BigInt(id) }, data: { activo, actualizadoEn: new Date() } })
    await audit(tx, req.user.id, activo ? 'ACTIVAR' : 'DESACTIVAR', 'USUARIO', id, user.correo)
    return { ...user, activo }
  })
  res.json(mapUsuario(result))
}))

router.post('/entrenadores', requireRoles('ADMINISTRADOR'), validate(registroEntrenador), asyncRoute(async (req, res) => {
  const body = req.body
  const result = await prisma.$transaction(async (tx) => {
    const rol = await roleId(tx, 'ENTRENADOR')
    const hash = await bcrypt.hash(body.password, 12)
    const user = await tx.usuario.create({
      data: { nombre: body.nombre, apellido: body.apellido, correo: body.correo.trim().toLowerCase(), passwordHash: hash, rolId: rol }
    })
    const trainer = await tx.entrenador.create({
      data: { usuarioId: user.id, dni: body.dni, telefono: body.telefono ?? null, especialidad: body.especialidad }
    })
    await audit(tx, req.user.id, 'CREAR', 'ENTRENADOR', trainer.id, `DNI ${body.dni}`)
    return { ...trainer, nombre: user.nombre, apellido: user.apellido, correo: user.correo, activo: user.activo }
  })
  res.status(201).json({
    id: Number(result.id), nombreCompleto: `${result.nombre} ${result.apellido}`.trim(), correo: result.correo,
    dni: result.dni, telefono: result.telefono, especialidad: result.especialidad, activo: result.activo, creadoEn: result.creadoEn
  })
}))

router.get('/entrenadores', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), asyncRoute(async (req, res) => {
  const { page, size, offset } = paging(req, 10)
  const [data, total] = await Promise.all([
    prisma.entrenador.findMany({
      include: { usuario: true },
      orderBy: [{ usuario: { apellido: 'asc' } }, { usuario: { nombre: 'asc' } }],
      skip: offset,
      take: size
    }),
    prisma.entrenador.count()
  ])
  const content = data.map((e) => ({
    id: Number(e.id), nombreCompleto: `${e.usuario.nombre} ${e.usuario.apellido}`.trim(), correo: e.usuario.correo,
    dni: e.dni, telefono: e.telefono, especialidad: e.especialidad, activo: e.usuario.activo, creadoEn: e.creadoEn
  }))
  res.json(pageResult(content, total, page, size))
}))

export default router
