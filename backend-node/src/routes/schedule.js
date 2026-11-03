import { Router } from 'express'
import { z } from 'zod'
import pool from '../config/database.js'
import { asyncRoute, audit, fail, inTransaction, positiveId, requireRoles, validate } from '../lib/http.js'

const router=Router()
const claseSchema=z.object({disciplina:z.string().trim().min(1).max(30),entrenadorId:z.coerce.number().int().positive(),aula:z.string().trim().min(1).max(30),inicio:z.string().datetime({offset:true}),fin:z.string().datetime({offset:true}),aforo:z.coerce.number().int().positive()})
const reservaSchema=z.object({claseId:z.coerce.number().int().positive(),socioId:z.coerce.number().int().positive().optional()})
const classSelect=`SELECT c.id,c.disciplina,c.entrenador_id,e.usuario_id AS entrenador_usuario_id,u.nombre AS entrenador_nombre,u.apellido AS entrenador_apellido,
  c.aula,c.inicio,c.fin,c.aforo,c.activa,c.creada_en FROM gimnasio.clases c
  JOIN gimnasio.entrenadores e ON e.id=c.entrenador_id JOIN gimnasio.usuarios u ON u.id=e.usuario_id`
const mapClase=(r,reservas=0)=>({id:Number(r.id),disciplina:r.disciplina,entrenadorId:Number(r.entrenador_id),entrenadorNombre:`${r.entrenador_nombre} ${r.entrenador_apellido}`.trim(),
  aula:r.aula,inicio:r.inicio,fin:r.fin,aforo:r.aforo,reservasActivas:Number(reservas),cuposDisponibles:Math.max(0,r.aforo-Number(reservas)),activa:r.activa})
const mapReserva=r=>({id:Number(r.id),claseId:Number(r.clase_id),disciplina:r.disciplina,inicio:r.inicio,fin:r.fin,socioId:Number(r.socio_id),socioNombre:r.socio_nombre,estado:r.estado,asistioEn:r.asistio_en,creadaEn:r.creada_en})
const reservaSelect=`SELECT r.id,r.clase_id,c.disciplina,c.inicio,c.fin,r.socio_id,su.nombre || ' ' || su.apellido AS socio_nombre,r.estado,r.asistio_en,r.creada_en
  FROM gimnasio.reservas r JOIN gimnasio.clases c ON c.id=r.clase_id JOIN gimnasio.socios s ON s.id=r.socio_id JOIN gimnasio.usuarios su ON su.id=s.usuario_id`

router.get('/clases',asyncRoute(async(req,res)=>{
  const {rows}=await pool.query(`${classSelect} WHERE c.activa=true AND c.fin>now() ORDER BY c.inicio`)
  const content=await Promise.all(rows.map(async row=>{
    const n=await pool.query("SELECT count(*)::int AS n FROM gimnasio.reservas WHERE clase_id=$1 AND estado='RESERVADA'",[row.id])
    return mapClase(row,n.rows[0].n)
  }))
  res.json(content)
}))
router.post('/clases',requireRoles('ADMINISTRADOR'),validate(claseSchema),asyncRoute(async(req,res)=>{
  const b=req.body
  if(new Date(b.fin)<=new Date(b.inicio))throw fail.bad('La hora de fin debe ser posterior a la de inicio')
  if(new Date(b.inicio)<=new Date())throw fail.bad('La clase debe empezar en el futuro')
  const result=await inTransaction(pool,async db=>{
    // Serialize concurrent class creation for the same trainer and room.
    const lockKeys=[`trainer:${b.entrenadorId}`,`room:${b.aula.toLowerCase()}`].sort()
    for(const key of lockKeys) await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[key])
    const trainer=await db.query(`SELECT e.id,u.activo FROM gimnasio.entrenadores e JOIN gimnasio.usuarios u ON u.id=e.usuario_id WHERE e.id=$1`,[b.entrenadorId])
    if(!trainer.rows[0])throw fail.missing('Entrenador no encontrado')
    if(!trainer.rows[0].activo)throw fail.conflict('El entrenador esta inactivo')
    const overlapTrainer=await db.query(`SELECT 1 FROM gimnasio.clases WHERE activa=true AND entrenador_id=$1 AND inicio<$3 AND fin>$2 LIMIT 1`,[b.entrenadorId,b.inicio,b.fin])
    if(overlapTrainer.rows[0])throw fail.conflict('El entrenador ya tiene otra clase en ese horario')
    const overlapRoom=await db.query(`SELECT 1 FROM gimnasio.clases WHERE activa=true AND lower(aula)=lower($1) AND inicio<$3 AND fin>$2 LIMIT 1`,[b.aula,b.inicio,b.fin])
    if(overlapRoom.rows[0])throw fail.conflict('El aula ya esta ocupada en ese horario')
    const {rows}=await db.query(`INSERT INTO gimnasio.clases(disciplina,entrenador_id,aula,inicio,fin,aforo)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,[b.disciplina,b.entrenadorId,b.aula,b.inicio,b.fin,b.aforo])
    await audit(db,req.user.id,'CREAR','CLASE',rows[0].id,`${b.disciplina} en ${b.aula} ${b.inicio}`)
    return (await db.query(`${classSelect} WHERE c.id=$1`,[rows[0].id])).rows[0]
  })
  res.status(201).json(mapClase(result))
}))
router.patch('/clases/:id/cancelar',requireRoles('ADMINISTRADOR'),asyncRoute(async(req,res)=>{
  const id=positiveId(req.params.id)
  const result=await inTransaction(pool,async db=>{
    const {rows}=await db.query(`${classSelect} WHERE c.id=$1 FOR UPDATE OF c`,[id])
    if(!rows[0])throw fail.missing('Clase no encontrada')
    if(!rows[0].activa)throw fail.conflict('La clase ya esta cancelada')
    await db.query('UPDATE gimnasio.clases SET activa=false WHERE id=$1',[id])
    const canceled=await db.query("UPDATE gimnasio.reservas SET estado='CANCELADA' WHERE clase_id=$1 AND estado='RESERVADA'",[id])
    await audit(db,req.user.id,'CANCELAR','CLASE',id,`${canceled.rowCount} reservas canceladas`)
    return rows[0]
  })
  res.json(mapClase({...result,activa:false},0))
}))

router.post('/reservas',requireRoles('SOCIO','ADMINISTRADOR','RECEPCIONISTA'),validate(reservaSchema),asyncRoute(async(req,res)=>{
  const result=await inTransaction(pool,async db=>{
    await db.query('SELECT pg_advisory_xact_lock($1::int, $2::int)',[71001,req.body.claseId])
    let socioId
    if(req.user.rol==='SOCIO'){
      const own=await db.query('SELECT id FROM gimnasio.socios WHERE usuario_id=$1',[req.user.id]);if(!own.rows[0])throw fail.missing('Perfil de socio no encontrado');socioId=own.rows[0].id
    }else{
      if(!req.body.socioId)throw fail.bad('Debe indicar el socioId')
      socioId=req.body.socioId
    }
    const {rows:classes}=await db.query(`${classSelect} WHERE c.id=$1 FOR UPDATE OF c`,[req.body.claseId])
    const c=classes[0];if(!c)throw fail.missing('Clase no encontrada')
    if(!c.activa)throw fail.conflict('La clase esta cancelada')
    if(new Date(c.inicio)<=new Date())throw fail.conflict('La clase ya comenzo')
    const socio=await db.query('SELECT s.id,u.activo FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id=s.usuario_id WHERE s.id=$1',[socioId])
    if(!socio.rows[0])throw fail.missing('Socio no encontrado')
    if(!socio.rows[0].activo)throw fail.conflict('El socio esta inactivo')
    const dup=await db.query("SELECT 1 FROM gimnasio.reservas WHERE clase_id=$1 AND socio_id=$2 AND estado='RESERVADA'",[c.id,socioId])
    if(dup.rows[0])throw fail.conflict('El socio ya tiene una reserva en esta clase')
    const member=await db.query(`SELECT 1 FROM gimnasio.membresias WHERE socio_id=$1 AND fecha_inicio<=$2::date AND fecha_fin>$2::date LIMIT 1`,[socioId,new Date(c.inicio).toLocaleDateString('en-CA',{timeZone:'America/Lima'})])
    if(!member.rows[0])throw fail.conflict('El socio no tiene membresia vigente en la fecha de la clase')
    const cnt=await db.query("SELECT count(*)::int AS n FROM gimnasio.reservas WHERE clase_id=$1 AND estado='RESERVADA'",[c.id])
    if(cnt.rows[0].n>=c.aforo)throw fail.conflict('La clase esta llena')
    const {rows}=await db.query('INSERT INTO gimnasio.reservas(clase_id,socio_id) VALUES($1,$2) RETURNING id',[c.id,socioId])
    await audit(db,req.user.id,'RESERVAR','RESERVA',rows[0].id,`Clase ${c.id}, socio ${socioId}`)
    return (await db.query(`${reservaSelect} WHERE r.id=$1`,[rows[0].id])).rows[0]
  })
  res.status(201).json(mapReserva(result))
}))
router.get('/reservas/mias',requireRoles('SOCIO'),asyncRoute(async(req,res)=>{
  const {rows:s}=await pool.query('SELECT id FROM gimnasio.socios WHERE usuario_id=$1',[req.user.id]);if(!s[0])throw fail.missing('Perfil de socio no encontrado')
  const {rows}=await pool.query(`${reservaSelect} WHERE r.socio_id=$1 ORDER BY c.inicio DESC`,[s[0].id]);res.json(rows.map(mapReserva))
}))
router.get('/reservas/clase/:claseId',requireRoles('ENTRENADOR','ADMINISTRADOR','RECEPCIONISTA'),asyncRoute(async(req,res)=>{
  const id=positiveId(req.params.claseId,'claseId')
  const {rows:c}=await pool.query(`${classSelect} WHERE c.id=$1`,[id]);if(!c[0])throw fail.missing('Clase no encontrada')
  if(req.user.rol==='ENTRENADOR'&&Number(c[0].entrenador_usuario_id)!==req.user.id)throw fail.forbidden('Esta clase pertenece a otro entrenador')
  const {rows}=await pool.query(`${reservaSelect} WHERE r.clase_id=$1 AND r.estado='RESERVADA' ORDER BY r.creada_en`,[id]);res.json(rows.map(mapReserva))
}))
router.patch('/reservas/:id/cancelar',requireRoles('SOCIO','ADMINISTRADOR','RECEPCIONISTA'),asyncRoute(async(req,res)=>{
  const id=positiveId(req.params.id)
  const result=await inTransaction(pool,async db=>{
    const {rows}=await db.query(`${reservaSelect} WHERE r.id=$1 FOR UPDATE OF r`,[id]);const r=rows[0]
    if(!r)throw fail.missing('Reserva no encontrada')
    const owner=await db.query('SELECT usuario_id FROM gimnasio.socios WHERE id=$1',[r.socio_id])
    if(req.user.rol==='SOCIO'&&Number(owner.rows[0].usuario_id)!==req.user.id)throw fail.forbidden('No puedes cancelar la reserva de otro socio')
    if(r.estado!=='RESERVADA')throw fail.conflict('La reserva ya esta cancelada')
    if(new Date(r.inicio)<=new Date())throw fail.conflict('No se puede cancelar una clase que ya comenzo')
    await db.query("UPDATE gimnasio.reservas SET estado='CANCELADA' WHERE id=$1",[id])
    await audit(db,req.user.id,'CANCELAR','RESERVA',id,'Reserva cancelada')
    return {...r,estado:'CANCELADA'}
  })
  res.json(mapReserva(result))
}))
router.patch('/reservas/:id/asistencia',requireRoles('ENTRENADOR','ADMINISTRADOR','RECEPCIONISTA'),asyncRoute(async(req,res)=>{
  const id=positiveId(req.params.id)
  const result=await inTransaction(pool,async db=>{
    const {rows}=await db.query(`${reservaSelect} WHERE r.id=$1 FOR UPDATE OF r`,[id]);const r=rows[0]
    if(!r)throw fail.missing('Reserva no encontrada')
    const {rows:owner}=await db.query('SELECT e.usuario_id FROM gimnasio.clases c JOIN gimnasio.entrenadores e ON e.id=c.entrenador_id WHERE c.id=$1',[r.clase_id])
    if(req.user.rol==='ENTRENADOR'&&Number(owner[0].usuario_id)!==req.user.id)throw fail.forbidden('Esta clase pertenece a otro entrenador')
    if(r.estado!=='RESERVADA')throw fail.conflict('No se puede marcar asistencia en una reserva cancelada')
    if(r.asistio_en)throw fail.conflict('La asistencia ya fue marcada')
    await db.query('UPDATE gimnasio.reservas SET asistio_en=now() WHERE id=$1',[id])
    await audit(db,req.user.id,'ASISTENCIA','RESERVA',id,'Asistencia a clase registrada')
    return {...r,asistio_en:new Date().toISOString()}
  })
  res.json(mapReserva(result))
}))

export default router
