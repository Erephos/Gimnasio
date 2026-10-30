import { Router } from 'express'
import { z } from 'zod'
import pool from '../config/database.js'
import { asyncRoute, audit, fail, inTransaction, mapMembresia, pageResult, positiveId, requireRoles, validate, validIsoDate } from '../lib/http.js'

const router = Router()
const planSchema = z.object({ nombre: z.string().trim().min(1).max(30), precio: z.coerce.number().positive().max(99_999_999.99).multipleOf(0.01), duracionDias: z.coerce.number().int().positive() })
const membresiaSchema = z.object({ socioId: z.coerce.number().int().positive(), planId: z.coerce.number().int().positive(), fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() })
const todayLima = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
const validDate = (value) => {
  return validIsoDate(value)
}

function planMap(row) { return { id: Number(row.id), nombre: row.nombre, precio: Number(row.precio), duracionDias: row.duracion_dias, activo: row.activo } }

const membershipSelect = `SELECT m.id,m.socio_id,u.nombre || ' ' || u.apellido AS socio_nombre,m.plan_id,p.nombre AS plan_nombre,
  m.fecha_inicio,m.fecha_fin,m.precio_pagado,m.creada_en
  FROM gimnasio.membresias m JOIN gimnasio.socios s ON s.id=m.socio_id
  JOIN gimnasio.usuarios u ON u.id=s.usuario_id JOIN gimnasio.planes p ON p.id=m.plan_id`

router.get('/planes', asyncRoute(async (req,res) => {
  const {rows}=await pool.query('SELECT * FROM gimnasio.planes WHERE activo=true ORDER BY precio')
  res.json(rows.map(planMap))
}))
router.get('/planes/todos', requireRoles('ADMINISTRADOR'), asyncRoute(async (req,res) => {
  const {rows}=await pool.query('SELECT * FROM gimnasio.planes ORDER BY precio')
  res.json(rows.map(planMap))
}))
router.post('/planes', requireRoles('ADMINISTRADOR'), validate(planSchema), asyncRoute(async (req,res) => {
  const plan=await inTransaction(pool,async db=>{
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`plan:${req.body.nombre.toLowerCase()}`])
    const duplicate=await db.query('SELECT 1 FROM gimnasio.planes WHERE lower(nombre)=lower($1) LIMIT 1',[req.body.nombre])
    if(duplicate.rows[0])throw fail.conflict('Ya existe un plan con ese nombre')
    const result=await db.query('INSERT INTO gimnasio.planes(nombre,precio,duracion_dias) VALUES($1,$2,$3) RETURNING *',[req.body.nombre,req.body.precio,req.body.duracionDias])
    await audit(db,req.user.id,'CREAR','PLAN',result.rows[0].id,`Plan ${req.body.nombre}`)
    return result.rows[0]
  })
  res.status(201).json(planMap(plan))
}))
router.put('/planes/:id', requireRoles('ADMINISTRADOR'), validate(planSchema), asyncRoute(async (req,res) => {
  const id=positiveId(req.params.id)
  const rows=await inTransaction(pool,async db=>{
    const existing=await db.query('SELECT id FROM gimnasio.planes WHERE id=$1 FOR UPDATE',[id])
    if(!existing.rows[0]) throw fail.missing('Plan no encontrado')
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`plan:${req.body.nombre.toLowerCase()}`])
    const duplicate=await db.query('SELECT 1 FROM gimnasio.planes WHERE lower(nombre)=lower($1) AND id<>$2 LIMIT 1',[req.body.nombre,id])
    if(duplicate.rows[0])throw fail.conflict('Ya existe otro plan con ese nombre')
    const updated=await db.query('UPDATE gimnasio.planes SET nombre=$1,precio=$2,duracion_dias=$3 WHERE id=$4 RETURNING *',[req.body.nombre,req.body.precio,req.body.duracionDias,id])
    await audit(db,req.user.id,'ACTUALIZAR','PLAN',id,`Plan ${req.body.nombre}`)
    return updated.rows
  })
  res.json(planMap(rows[0]))
}))
router.patch('/planes/:id/estado', requireRoles('ADMINISTRADOR'), asyncRoute(async (req,res)=>{
  const id=positiveId(req.params.id)
  if(!['true','false'].includes(String(req.query.activo))) throw fail.bad('El parametro activo debe ser true o false')
  const rows=await inTransaction(pool,async db=>{
    const result=await db.query('UPDATE gimnasio.planes SET activo=$1 WHERE id=$2 RETURNING *',[req.query.activo==='true',id])
    if(!result.rows[0]) throw fail.missing('Plan no encontrado')
    await audit(db,req.user.id,result.rows[0].activo?'ACTIVAR':'DESACTIVAR','PLAN',id,result.rows[0].nombre)
    return result.rows
  })
  res.json(planMap(rows[0]))
}))

router.post('/membresias',requireRoles('ADMINISTRADOR','RECEPCIONISTA'),validate(membresiaSchema),asyncRoute(async(req,res)=>{
  const inicio=req.body.fechaInicio??todayLima()
  if (!validDate(inicio)) throw fail.bad('La fecha de inicio debe ser una fecha valida con formato AAAA-MM-DD')
  const result=await inTransaction(pool,async db=>{
    const socio=await db.query('SELECT s.id,u.activo,s.dni FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id=s.usuario_id WHERE s.id=$1 FOR UPDATE OF s,u',[req.body.socioId])
    if(!socio.rows[0]) throw fail.missing('Socio no encontrado')
    if(!socio.rows[0].activo) throw fail.conflict('El socio esta inactivo')
    const plan=await db.query('SELECT * FROM gimnasio.planes WHERE id=$1 FOR SHARE',[req.body.planId])
    if(!plan.rows[0]) throw fail.missing('Plan no encontrado')
    if(!plan.rows[0].activo) throw fail.conflict('El plan seleccionado no esta activo')
    if(inicio<todayLima()) throw fail.bad('La fecha de inicio no puede ser anterior a hoy')
    const overlap=await db.query(`SELECT 1 FROM gimnasio.membresias WHERE socio_id=$1 AND fecha_inicio < ($2::date + $3::int) AND fecha_fin > $2::date LIMIT 1`,[req.body.socioId,inicio,plan.rows[0].duracion_dias])
    if(overlap.rows[0]) throw fail.conflict('El socio ya tiene una membresia que cubre parte de ese periodo')
    const inserted=await db.query(`INSERT INTO gimnasio.membresias(socio_id,plan_id,fecha_inicio,fecha_fin,precio_pagado)
      VALUES($1,$2,$3::date,($3::date + $4::int),$5) RETURNING id`,[req.body.socioId,req.body.planId,inicio,plan.rows[0].duracion_dias,plan.rows[0].precio])
    await audit(db,req.user.id,'CREAR','MEMBRESIA',inserted.rows[0].id,`Socio DNI ${socio.rows[0].dni}, plan ${plan.rows[0].nombre}, ${inicio}`)
    const selected=await db.query(`${membershipSelect} WHERE m.id=$1`,[inserted.rows[0].id])
    return selected.rows[0]
  })
  res.status(201).json(mapMembresia(result))
}))

router.get('/membresias/mia/vigente',requireRoles('SOCIO'),asyncRoute(async(req,res)=>{
  const {rows}=await pool.query(`${membershipSelect} WHERE m.socio_id=(SELECT id FROM gimnasio.socios WHERE usuario_id=$1)
    AND m.fecha_inicio <= $2::date AND m.fecha_fin > $2::date ORDER BY m.fecha_inicio DESC LIMIT 1`,[req.user.id,todayLima()])
  if(!rows[0]) throw fail.missing('El socio no tiene una membresia vigente')
  res.json(mapMembresia(rows[0]))
}))
router.get('/membresias/mia',requireRoles('SOCIO'),asyncRoute(async(req,res)=>{
  const {rows}=await pool.query(`${membershipSelect} WHERE m.socio_id=(SELECT id FROM gimnasio.socios WHERE usuario_id=$1) ORDER BY m.fecha_inicio DESC`,[req.user.id])
  res.json(rows.map(row=>mapMembresia(row)))
}))
router.get('/membresias/alertas',requireRoles('ADMINISTRADOR','RECEPCIONISTA'),asyncRoute(async(req,res)=>{
  const dias=Number(req.query.dias??7)
  if(!Number.isInteger(dias)||dias<0||dias>90) throw fail.bad('El rango de alerta debe estar entre 0 y 90 dias')
  const {rows}=await pool.query(`SELECT m.id AS membresia_id,s.id AS socio_id,u.nombre || ' ' || u.apellido AS socio_nombre,u.correo,s.dni,p.nombre AS plan,m.fecha_fin,
    (m.fecha_fin - $1::date) AS dias_restantes
    FROM gimnasio.membresias m JOIN gimnasio.socios s ON s.id=m.socio_id JOIN gimnasio.usuarios u ON u.id=s.usuario_id
    JOIN gimnasio.planes p ON p.id=m.plan_id WHERE u.activo=true AND m.fecha_fin >= $1::date - 30 AND m.fecha_fin <= $1::date + $2::int
    ORDER BY m.fecha_fin`,[todayLima(),dias])
  res.json(rows.map(r=>({membresiaId:Number(r.membresia_id),socioId:Number(r.socio_id),socioNombre:r.socio_nombre,correo:r.correo,dni:r.dni,
    plan:r.nombre,fechaFin:r.fecha_fin,diasRestantes:r.dias_restantes,estado:r.dias_restantes<=0?'VENCIDA':'POR_VENCER'})))
}))

async function getMembresiaList(socioId) {
  const exists=await pool.query('SELECT 1 FROM gimnasio.socios WHERE id=$1',[socioId])
  if(!exists.rows[0]) throw fail.missing('Socio no encontrado')
  const {rows}=await pool.query(`${membershipSelect} WHERE m.socio_id=$1 ORDER BY m.fecha_inicio DESC`,[socioId])
  return rows.map(row=>mapMembresia(row))
}
router.get('/membresias/socio/:socioId',requireRoles('ADMINISTRADOR','RECEPCIONISTA'),asyncRoute(async(req,res)=>res.json(await getMembresiaList(positiveId(req.params.socioId,'socioId')))))
router.get('/membresias/socio/:socioId/vigente',requireRoles('ADMINISTRADOR','RECEPCIONISTA'),asyncRoute(async(req,res)=>{
  const socioId=positiveId(req.params.socioId,'socioId')
  const {rows}=await pool.query(`${membershipSelect} WHERE m.socio_id=$1 AND m.fecha_inicio <= $2::date AND m.fecha_fin > $2::date ORDER BY m.fecha_inicio DESC LIMIT 1`,[socioId,todayLima()])
  if(!rows[0]) throw fail.missing('El socio no tiene una membresia vigente')
  res.json(mapMembresia(rows[0]))
}))

export default router
