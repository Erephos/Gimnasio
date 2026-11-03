import { Router } from 'express'
import { z } from 'zod'
import pool from '../config/database.js'
import { asyncRoute, audit, fail, inTransaction, pageResult, paging, positiveId, requireRoles, validate } from '../lib/http.js'

const router=Router()
const paymentSchema=z.object({membresiaId:z.coerce.number().int().positive(),monto:z.coerce.number().positive().max(99_999_999.99).multipleOf(0.01),metodo:z.enum(['EFECTIVO','TRANSFERENCIA','TARJETA'])})
const annulSchema=z.object({motivo:z.string().trim().min(1).max(200)})
const checkinSchema=z.object({dni:z.string().regex(/^\d{8}$/,'El DNI debe tener exactamente 8 digitos')})
const todayLima=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Lima'})

const paymentSelect=`SELECT p.id,p.socio_id,su.nombre || ' ' || su.apellido AS socio_nombre,p.membresia_id,p.monto,p.metodo,p.estado,p.fecha_pago,
  ru.nombre || ' ' || ru.apellido AS registrado_por,au.nombre || ' ' || au.apellido AS anulado_por,p.anulado_en,p.motivo_anulacion
  FROM gimnasio.pagos p JOIN gimnasio.socios s ON s.id=p.socio_id JOIN gimnasio.usuarios su ON su.id=s.usuario_id
  JOIN gimnasio.usuarios ru ON ru.id=p.registrado_por LEFT JOIN gimnasio.usuarios au ON au.id=p.anulado_por`
const mapPago=r=>({id:Number(r.id),socioId:Number(r.socio_id),socioNombre:r.socio_nombre,membresiaId:Number(r.membresia_id),monto:Number(r.monto),metodo:r.metodo,estado:r.estado,fechaPago:r.fecha_pago,registradoPor:r.registrado_por,anuladoPor:r.anulado_por,anuladoEn:r.anulado_en,motivoAnulacion:r.motivo_anulacion})
const attendanceSelect=`SELECT a.id,a.socio_id,u.nombre || ' ' || u.apellido AS socio_nombre,s.dni,a.fecha,a.hora_entrada
  FROM gimnasio.asistencias a JOIN gimnasio.socios s ON s.id=a.socio_id JOIN gimnasio.usuarios u ON u.id=s.usuario_id`
const mapAsistencia=(r,membresiaVigenteHasta=null)=>({id:Number(r.id),socioId:Number(r.socio_id),socioNombre:r.socio_nombre,dni:r.dni,fecha:r.fecha,horaEntrada:r.hora_entrada,membresiaVigenteHasta})

router.post('/pagos',requireRoles('ADMINISTRADOR','RECEPCIONISTA'),validate(paymentSchema),asyncRoute(async(req,res)=>{
  const result=await inTransaction(pool,async db=>{
    const {rows}=await db.query(`SELECT m.id,m.socio_id,m.precio_pagado,s.dni FROM gimnasio.membresias m JOIN gimnasio.socios s ON s.id=m.socio_id WHERE m.id=$1 FOR UPDATE OF m`,[req.body.membresiaId])
    const m=rows[0]; if(!m) throw fail.missing('Membresia no encontrada')
    const paid=await db.query(`SELECT coalesce(sum(monto),0) AS total FROM gimnasio.pagos WHERE membresia_id=$1 AND estado='REGISTRADO'`,[m.id])
    const balance=Number(m.precio_pagado)-Number(paid.rows[0].total)
    if(req.body.monto>balance+0.00001) throw fail.conflict(`El monto excede el saldo pendiente de la membresia (S/ ${balance.toFixed(2)})`)
    const inserted=await db.query(`INSERT INTO gimnasio.pagos(socio_id,membresia_id,monto,metodo,registrado_por)
      VALUES($1,$2,$3,$4,$5) RETURNING id`,[m.socio_id,m.id,req.body.monto,req.body.metodo,req.user.id])
    await audit(db,req.user.id,'REGISTRAR','PAGO',inserted.rows[0].id,`S/ ${req.body.monto.toFixed(2)} ${req.body.metodo}, membresia ${m.id}`)
    const selected=await db.query(`${paymentSelect} WHERE p.id=$1`,[inserted.rows[0].id])
    return selected.rows[0]
  })
  res.status(201).json(mapPago(result))
}))

router.get('/pagos',requireRoles('ADMINISTRADOR','RECEPCIONISTA'),asyncRoute(async(req,res)=>{
  const {page,size,offset}=paging(req,10)
  const socioId=req.query.socioId?positiveId(req.query.socioId,'socioId'):null
  const q=String(req.query.q??'').trim()
  const estado=String(req.query.estado??'').trim().toUpperCase()||null
  if(estado&&!['REGISTRADO','ANULADO'].includes(estado)) throw fail.bad('El estado debe ser REGISTRADO o ANULADO')
  const params=[socioId,q,estado,size,offset]
  const where=`($1::bigint IS NULL OR p.socio_id=$1) AND ($2='' OR lower(su.nombre || ' ' || su.apellido) LIKE '%'||lower($2)||'%' OR s.dni LIKE '%'||$2||'%' OR lower(su.correo) LIKE '%'||lower($2)||'%') AND ($3::text IS NULL OR p.estado=$3)`
  const [data,count]=await Promise.all([
    pool.query(`${paymentSelect} WHERE ${where} ORDER BY p.fecha_pago DESC LIMIT $4 OFFSET $5`,params),
    pool.query(`SELECT count(*)::int AS total FROM gimnasio.pagos p JOIN gimnasio.socios s ON s.id=p.socio_id JOIN gimnasio.usuarios su ON su.id=s.usuario_id WHERE ${where}`,params.slice(0,3))
  ])
  res.json(pageResult(data.rows.map(mapPago),count.rows[0].total,page,size))
}))
router.get('/pagos/membresia/:membresiaId',requireRoles('ADMINISTRADOR','RECEPCIONISTA'),asyncRoute(async(req,res)=>{
  const id=positiveId(req.params.membresiaId,'membresiaId')
  const exists=await pool.query('SELECT 1 FROM gimnasio.membresias WHERE id=$1',[id]);if(!exists.rows[0])throw fail.missing('Membresia no encontrada')
  const {rows}=await pool.query(`${paymentSelect} WHERE p.membresia_id=$1 ORDER BY p.fecha_pago DESC`,[id])
  res.json(rows.map(mapPago))
}))
router.patch('/pagos/:id/anular',requireRoles('ADMINISTRADOR'),validate(annulSchema),asyncRoute(async(req,res)=>{
  const id=positiveId(req.params.id)
  const result=await inTransaction(pool,async db=>{
    const {rows}=await db.query('SELECT id,estado FROM gimnasio.pagos WHERE id=$1 FOR UPDATE',[id]);
    if(!rows[0])throw fail.missing('Pago no encontrado');if(rows[0].estado==='ANULADO')throw fail.conflict('El pago ya fue anulado')
    await db.query(`UPDATE gimnasio.pagos SET estado='ANULADO',anulado_por=$1,anulado_en=now(),motivo_anulacion=$2 WHERE id=$3`,[req.user.id,req.body.motivo,id])
    await audit(db,req.user.id,'ANULAR','PAGO',id,`Motivo: ${req.body.motivo}`)
    const selected=await db.query(`${paymentSelect} WHERE p.id=$1`,[id]);return selected.rows[0]
  })
  res.json(mapPago(result))
}))

router.post('/asistencias',requireRoles('ADMINISTRADOR','RECEPCIONISTA'),validate(checkinSchema),asyncRoute(async(req,res)=>{
  const result=await inTransaction(pool,async db=>{
    const {rows}=await db.query(`SELECT s.id,s.dni,u.activo FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id=s.usuario_id WHERE s.dni=$1 FOR UPDATE OF s,u`,[req.body.dni])
    const socio=rows[0];if(!socio)throw fail.missing('No existe un socio con ese DNI');if(!socio.activo)throw fail.conflict('El socio esta inactivo')
    const {rows: memberships}=await db.query(`SELECT fecha_fin FROM gimnasio.membresias WHERE socio_id=$1 AND fecha_inicio <= $2::date AND fecha_fin > $2::date ORDER BY fecha_inicio DESC LIMIT 1`,[socio.id,todayLima()])
    if(!memberships[0])throw fail.conflict('El socio no tiene una membresia vigente')
    const inserted=await db.query(`INSERT INTO gimnasio.asistencias(socio_id,fecha,registrado_por) VALUES($1,$2::date,$3) RETURNING id,socio_id,fecha,hora_entrada`,[socio.id,todayLima(),req.user.id])
    await audit(db,req.user.id,'REGISTRAR','ASISTENCIA',inserted.rows[0].id,`Socio ${socio.id}`)
    return {...inserted.rows[0],dni:socio.dni,socio_nombre:(await db.query('SELECT nombre || \' \' || apellido AS n FROM gimnasio.usuarios WHERE id=(SELECT usuario_id FROM gimnasio.socios WHERE id=$1)',[socio.id])).rows[0].n,membresiaFin:memberships[0].fecha_fin}
  })
  res.status(201).json(mapAsistencia(result,result.membresiaFin))
}))
router.get('/asistencias',requireRoles('ADMINISTRADOR','RECEPCIONISTA'),asyncRoute(async(req,res)=>{
  const {page,size,offset}=paging(req,20)
  const fecha=String(req.query.fecha??todayLima())
  if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha))throw fail.bad('La fecha debe tener formato AAAA-MM-DD')
  const q=String(req.query.q??'').trim();const params=[fecha,q,size,offset]
  const where=`a.fecha=$1::date AND ($2='' OR lower(u.nombre || ' ' || u.apellido) LIKE '%'||lower($2)||'%' OR s.dni LIKE '%'||$2||'%')`
  const [data,count]=await Promise.all([
    pool.query(`${attendanceSelect} WHERE ${where} ORDER BY a.hora_entrada DESC LIMIT $3 OFFSET $4`,params),
    pool.query(`SELECT count(*)::int AS total FROM gimnasio.asistencias a JOIN gimnasio.socios s ON s.id=a.socio_id JOIN gimnasio.usuarios u ON u.id=s.usuario_id WHERE ${where}`,params.slice(0,2))
  ])
  res.json(pageResult(data.rows.map(r=>mapAsistencia(r)),count.rows[0].total,page,size))
}))
router.get('/asistencias/socio/:socioId',requireRoles('ADMINISTRADOR','RECEPCIONISTA'),asyncRoute(async(req,res)=>{
  const socioId=positiveId(req.params.socioId,'socioId');const {page,size,offset}=paging(req,20)
  const exists=await pool.query('SELECT 1 FROM gimnasio.socios WHERE id=$1',[socioId]);if(!exists.rows[0])throw fail.missing('Socio no encontrado')
  const [data,count]=await Promise.all([
    pool.query(`${attendanceSelect} WHERE a.socio_id=$1 ORDER BY a.hora_entrada DESC LIMIT $2 OFFSET $3`,[socioId,size,offset]),
    pool.query('SELECT count(*)::int AS total FROM gimnasio.asistencias WHERE socio_id=$1',[socioId])
  ])
  res.json(pageResult(data.rows.map(r=>mapAsistencia(r)),count.rows[0].total,page,size))
}))

export default router
