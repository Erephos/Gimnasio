import { Router } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { asyncRoute, audit, fail, inTransaction, mapSocio, mapUsuario, pageResult, paging, positiveId, requireRoles, validate } from '../lib/http.js'

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
  const { rows } = await db.query('SELECT id FROM gimnasio.roles WHERE nombre = $1', [name])
  if (!rows[0]) throw new Error(`El rol ${name} no existe en la base de datos`)
  return rows[0].id
}

async function findSocio(id, db = pool, lock = false) {
  const { rows } = await db.query(
    `SELECT s.id, s.usuario_id, s.dni, s.telefono, s.genero, s.direccion, s.contacto_emergencia, s.creado_en,
       u.nombre, u.apellido, u.correo, u.activo
     FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id = s.usuario_id
     WHERE s.id = $1 ${lock ? 'FOR UPDATE OF s, u' : ''}`, [id]
  )
  if (!rows[0]) throw fail.missing('Socio no encontrado')
  return rows[0]
}

router.post('/socios', validate(registroSocio), asyncRoute(async (req, res) => {
  const body = req.body
  const result = await inTransaction(pool, async (db) => {
    const rol = await roleId(db, 'SOCIO')
    const hash = await bcrypt.hash(body.password, 12)
    const { rows } = await db.query(
      `INSERT INTO gimnasio.usuarios (nombre, apellido, correo, password_hash, rol_id)
       VALUES ($1, $2, lower($3), $4, $5) RETURNING id`,
      [body.nombre, body.apellido, body.correo, hash, rol]
    )
    const userId = rows[0].id
    const socio = await db.query(
      `INSERT INTO gimnasio.socios (usuario_id, dni, telefono, genero, direccion, contacto_emergencia)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [userId, body.dni, body.telefono ?? null, body.genero, body.direccion?.trim() ?? null, body.contactoEmergencia?.trim() ?? null]
    )
    await audit(db, userId, 'REGISTRAR', 'SOCIO', socio.rows[0].id, 'Alta de socio')
    return findSocio(socio.rows[0].id, db)
  })
  res.status(201).json(mapSocio(result))
}))

router.get('/socios/mi-perfil', requireRoles('SOCIO'), asyncRoute(async (req, res) => {
  const { rows } = await pool.query('SELECT id FROM gimnasio.socios WHERE usuario_id = $1', [req.user.id])
  if (!rows[0]) throw fail.missing('No existe un perfil de socio para este usuario')
  res.json(mapSocio(await findSocio(rows[0].id)))
}))

router.get('/socios', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), asyncRoute(async (req, res) => {
  const { page, size, offset } = paging(req, 10)
  const q = String(req.query.q ?? '').trim()
  if (req.query.activo !== undefined && !['true', 'false'].includes(String(req.query.activo))) throw fail.bad('El parametro activo debe ser true o false')
  const activo = req.query.activo === undefined ? null : req.query.activo === 'true'
  const params = [q, activo, size, offset]
  const where = `($1 = '' OR lower(u.nombre || ' ' || u.apellido) LIKE '%' || lower($1) || '%' OR s.dni LIKE '%' || $1 || '%' OR lower(u.correo) LIKE '%' || lower($1) || '%') AND ($2::boolean IS NULL OR u.activo = $2)`
  const [data, count] = await Promise.all([
    pool.query(`SELECT s.id, s.usuario_id, s.dni, s.telefono, s.genero, s.direccion, s.contacto_emergencia, s.creado_en, u.nombre, u.apellido, u.correo, u.activo
      FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id=s.usuario_id WHERE ${where}
      ORDER BY u.apellido, u.nombre LIMIT $3 OFFSET $4`, params),
    pool.query(`SELECT count(*)::int AS total FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id=s.usuario_id WHERE ${where}`, params.slice(0, 2))
  ])
  res.json(pageResult(data.rows.map(mapSocio), count.rows[0].total, page, size))
}))

router.get('/socios/:id', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA', 'SOCIO'), asyncRoute(async (req, res) => {
  const socio = await findSocio(positiveId(req.params.id))
  if (req.user.rol === 'SOCIO' && Number(socio.usuario_id) !== req.user.id) throw fail.forbidden('No puedes consultar el perfil de otro socio')
  res.json(mapSocio(socio))
}))

router.put('/socios/:id', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA', 'SOCIO'), validate(actualizacionSocio), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  const updated = await inTransaction(pool, async (db) => {
    const socio = await findSocio(id, db, true)
    const admin = req.user.rol === 'ADMINISTRADOR'
    const staff = admin || req.user.rol === 'RECEPCIONISTA'
    if (!staff && Number(socio.usuario_id) !== req.user.id) throw fail.forbidden('No puedes modificar el perfil de otro socio')
    if (req.body.dni && !admin) throw fail.forbidden('Solo un administrador puede corregir el DNI')
    if (req.body.correo !== undefined) await db.query('UPDATE gimnasio.usuarios SET correo = lower($1), actualizado_en = now() WHERE id = $2', [req.body.correo.trim(), socio.usuario_id])
    if (req.body.telefono !== undefined) await db.query('UPDATE gimnasio.socios SET telefono = $1 WHERE id = $2', [req.body.telefono, id])
    if (req.body.direccion !== undefined) await db.query('UPDATE gimnasio.socios SET direccion = $1 WHERE id = $2', [req.body.direccion?.trim() ?? null, id])
    if (req.body.contactoEmergencia !== undefined) await db.query('UPDATE gimnasio.socios SET contacto_emergencia = $1 WHERE id = $2', [req.body.contactoEmergencia?.trim() ?? null, id])
    if (req.body.dni !== undefined) await db.query('UPDATE gimnasio.socios SET dni = $1 WHERE id = $2', [req.body.dni, id])
    await audit(db, req.user.id, 'ACTUALIZAR', 'SOCIO', id, 'Datos de contacto actualizados')
    return findSocio(id, db)
  })
  res.json(mapSocio(updated))
}))

router.delete('/socios/:id', requireRoles('ADMINISTRADOR'), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  await inTransaction(pool, async (db) => {
    const socio = await findSocio(id, db, true)
    if (!socio.activo) throw fail.conflict('El socio ya esta inactivo')
    await db.query('UPDATE gimnasio.usuarios SET activo=false, actualizado_en=now() WHERE id=$1', [socio.usuario_id])
    await audit(db, req.user.id, 'DESACTIVAR', 'SOCIO', id, 'Cuenta desactivada; historial preservado')
  })
  res.status(204).end()
}))

router.post('/usuarios', requireRoles('ADMINISTRADOR'), validate(registroPersonal), asyncRoute(async (req, res) => {
  const body = req.body
  const result = await inTransaction(pool, async (db) => {
    const rol = await roleId(db, body.rol)
    const hash = await bcrypt.hash(body.password, 12)
    const { rows } = await db.query(`INSERT INTO gimnasio.usuarios(nombre,apellido,correo,password_hash,rol_id)
      VALUES($1,$2,lower($3),$4,$5) RETURNING id,nombre,apellido,correo,activo,creado_en`,
    [body.nombre, body.apellido, body.correo, hash, rol])
    const user = rows[0]
    await audit(db, req.user.id, 'CREAR', 'USUARIO', user.id, `Cuenta ${body.rol} ${user.correo}`)
    return { ...user, rol: body.rol }
  })
  res.status(201).json(mapUsuario(result))
}))

router.get('/usuarios', requireRoles('ADMINISTRADOR'), asyncRoute(async (req, res) => {
  const { page, size, offset } = paging(req, 10)
  const rol = String(req.query.rol ?? '').trim().toUpperCase()
  const [data, count] = await Promise.all([
    pool.query(`SELECT u.id,u.nombre,u.apellido,u.correo,u.activo,u.creado_en,r.nombre AS rol
      FROM gimnasio.usuarios u JOIN gimnasio.roles r ON r.id=u.rol_id WHERE ($1='' OR r.nombre=$1)
      ORDER BY u.apellido,u.nombre LIMIT $2 OFFSET $3`, [rol, size, offset]),
    pool.query(`SELECT count(*)::int AS total FROM gimnasio.usuarios u JOIN gimnasio.roles r ON r.id=u.rol_id WHERE ($1='' OR r.nombre=$1)`, [rol])
  ])
  res.json(pageResult(data.rows.map(mapUsuario), count.rows[0].total, page, size))
}))

router.patch('/usuarios/mi-password', authenticate, validate(cambioPassword), asyncRoute(async (req, res) => {
  const { rows } = await pool.query('SELECT password_hash FROM gimnasio.usuarios WHERE id=$1', [req.user.id])
  if (!(await bcrypt.compare(req.body.passwordActual, rows[0].password_hash))) throw fail.bad('La contrasena actual es incorrecta')
  if (await bcrypt.compare(req.body.passwordNueva, rows[0].password_hash)) throw fail.bad('La nueva contrasena debe ser distinta a la actual')
  const hash = await bcrypt.hash(req.body.passwordNueva, 12)
  await inTransaction(pool, async (db) => {
    await db.query('UPDATE gimnasio.usuarios SET password_hash=$1, actualizado_en=now() WHERE id=$2', [hash, req.user.id])
    await audit(db, req.user.id, 'CAMBIAR_PASSWORD', 'USUARIO', req.user.id, 'Cambio de contrasena por el propio usuario')
  })
  res.json({ mensaje: 'Contrasena actualizada correctamente' })
}))

router.patch('/usuarios/:id/rol', requireRoles('ADMINISTRADOR'), validate(cambioRol), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  const result = await inTransaction(pool, async (db) => {
    const { rows } = await db.query(`SELECT u.id,u.nombre,u.apellido,u.correo,u.activo,u.creado_en,r.nombre AS rol
      FROM gimnasio.usuarios u JOIN gimnasio.roles r ON r.id=u.rol_id WHERE u.id=$1 FOR UPDATE OF u`, [id])
    const user = rows[0]
    if (!user) throw fail.missing('Usuario no encontrado')
    if (id === req.user.id) throw fail.forbidden('No puedes cambiar tu propio rol')
    if (!['ADMINISTRADOR','RECEPCIONISTA'].includes(user.rol)) throw fail.conflict('Solo se puede cambiar el rol de administradores y recepcionistas')
    if (user.rol === req.body.rol) throw fail.conflict('El usuario ya tiene ese rol')
    const rolId = await roleId(db, req.body.rol)
    await db.query('UPDATE gimnasio.usuarios SET rol_id=$1, actualizado_en=now() WHERE id=$2', [rolId, id])
    await audit(db, req.user.id, 'CAMBIAR_ROL', 'USUARIO', id, `${user.rol} -> ${req.body.rol}`)
    return { ...user, rol: req.body.rol }
  })
  res.json(mapUsuario(result))
}))

router.patch('/usuarios/:id/estado', requireRoles('ADMINISTRADOR'), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  if (!['true', 'false'].includes(String(req.query.activo))) throw fail.bad('El parametro activo debe ser true o false')
  const activo = req.query.activo === 'true'
  const result = await inTransaction(pool, async (db) => {
    const { rows } = await db.query(`SELECT u.id,u.nombre,u.apellido,u.correo,u.activo,u.creado_en,r.nombre AS rol
      FROM gimnasio.usuarios u JOIN gimnasio.roles r ON r.id=u.rol_id WHERE u.id=$1 FOR UPDATE OF u`, [id])
    const user = rows[0]
    if (!user) throw fail.missing('Usuario no encontrado')
    if (id === req.user.id) throw fail.forbidden('No puedes desactivar tu propia cuenta')
    if (user.activo === activo) throw fail.conflict(activo ? 'La cuenta ya esta activa' : 'La cuenta ya esta inactiva')
    await db.query('UPDATE gimnasio.usuarios SET activo=$1, actualizado_en=now() WHERE id=$2', [activo, id])
    await audit(db, req.user.id, activo ? 'ACTIVAR' : 'DESACTIVAR', 'USUARIO', id, user.correo)
    return { ...user, activo }
  })
  res.json(mapUsuario(result))
}))

router.post('/entrenadores', requireRoles('ADMINISTRADOR'), validate(registroEntrenador), asyncRoute(async (req, res) => {
  const body = req.body
  const result = await inTransaction(pool, async (db) => {
    const rol = await roleId(db, 'ENTRENADOR')
    const hash = await bcrypt.hash(body.password, 12)
    const { rows } = await db.query(`INSERT INTO gimnasio.usuarios(nombre,apellido,correo,password_hash,rol_id)
      VALUES($1,$2,lower($3),$4,$5) RETURNING id,nombre,apellido,correo,activo`, [body.nombre, body.apellido, body.correo, hash, rol])
    const user = rows[0]
    const trainer = await db.query(`INSERT INTO gimnasio.entrenadores(usuario_id,dni,telefono,especialidad)
      VALUES($1,$2,$3,$4) RETURNING id,dni,telefono,especialidad,creado_en`, [user.id, body.dni, body.telefono ?? null, body.especialidad])
    await audit(db, req.user.id, 'CREAR', 'ENTRENADOR', trainer.rows[0].id, `DNI ${body.dni}`)
    return { ...trainer.rows[0], nombre: user.nombre, apellido: user.apellido, correo: user.correo, activo: user.activo }
  })
  res.status(201).json({ id: Number(result.id), nombreCompleto: `${result.nombre} ${result.apellido}`.trim(), correo: result.correo,
    dni: result.dni, telefono: result.telefono, especialidad: result.especialidad, activo: result.activo, creadoEn: result.creado_en })
}))

router.get('/entrenadores', requireRoles('ADMINISTRADOR','RECEPCIONISTA'), asyncRoute(async (req,res) => {
  const {page,size,offset}=paging(req,10)
  const [data,count]=await Promise.all([
    pool.query(`SELECT e.id,e.dni,e.telefono,e.especialidad,e.creado_en,u.nombre,u.apellido,u.correo,u.activo
      FROM gimnasio.entrenadores e JOIN gimnasio.usuarios u ON u.id=e.usuario_id ORDER BY u.apellido,u.nombre LIMIT $1 OFFSET $2`,[size,offset]),
    pool.query('SELECT count(*)::int AS total FROM gimnasio.entrenadores')
  ])
  const content=data.rows.map(r=>({id:Number(r.id),nombreCompleto:`${r.nombre} ${r.apellido}`.trim(),correo:r.correo,dni:r.dni,telefono:r.telefono,
    especialidad:r.especialidad,activo:r.activo,creadoEn:r.creado_en}))
  res.json(pageResult(content,count.rows[0].total,page,size))
}))

export default router
