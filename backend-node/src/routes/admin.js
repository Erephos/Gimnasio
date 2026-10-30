import { Router } from 'express'
import pool from '../config/database.js'
import { asyncRoute, pageResult, paging, requireRoles, fail } from '../lib/http.js'

const router=Router()
const todayLima=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Lima'})

router.get('/reportes/resumen',requireRoles('ADMINISTRADOR','RECEPCIONISTA'),asyncRoute(async(req,res)=>{
  const today=todayLima()
  const defaultStart=`${today.slice(0,7)}-01`
  const desde=String(req.query.desde??defaultStart)
  const hasta=String(req.query.hasta??today)
  if(!/^\d{4}-\d{2}-\d{2}$/.test(desde)||!/^\d{4}-\d{2}-\d{2}$/.test(hasta))throw fail.bad('Las fechas deben tener formato AAAA-MM-DD')
  if(desde>hasta)throw fail.bad('La fecha desde no puede ser posterior a hasta')
  if(hasta>today)throw fail.bad('La fecha hasta no puede estar en el futuro')
  const {rows}=await pool.query(`SELECT
    coalesce((SELECT sum(monto) FROM gimnasio.pagos WHERE estado='REGISTRADO' AND fecha_pago >= ($1::date::timestamp AT TIME ZONE 'America/Lima') AND fecha_pago < (($2::date + 1)::timestamp AT TIME ZONE 'America/Lima')),0) AS ingresos,
    (SELECT count(*)::int FROM gimnasio.pagos WHERE estado='REGISTRADO' AND fecha_pago >= ($1::date::timestamp AT TIME ZONE 'America/Lima') AND fecha_pago < (($2::date + 1)::timestamp AT TIME ZONE 'America/Lima')) AS pagos,
    (SELECT count(*)::int FROM gimnasio.asistencias WHERE fecha BETWEEN $1::date AND $2::date) AS asistencias,
    (SELECT count(*)::int FROM gimnasio.membresias m JOIN gimnasio.socios s ON s.id=m.socio_id JOIN gimnasio.usuarios u ON u.id=s.usuario_id WHERE u.activo=true AND m.fecha_inicio<=$2::date AND m.fecha_fin>$2::date) AS membresias_vigentes,
    (SELECT count(*)::int FROM gimnasio.membresias m JOIN gimnasio.socios s ON s.id=m.socio_id JOIN gimnasio.usuarios u ON u.id=s.usuario_id WHERE u.activo=true AND m.fecha_fin<=$2::date) AS membresias_vencidas,
    (SELECT count(*)::int FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id=s.usuario_id WHERE u.creado_en >= ($1::date::timestamp AT TIME ZONE 'America/Lima') AND u.creado_en < (($2::date + 1)::timestamp AT TIME ZONE 'America/Lima')) AS socios_nuevos`,[desde,hasta])
  const r=rows[0]
  res.json({desde,hasta,ingresosRegistrados:Number(r.ingresos),pagosRegistrados:Number(r.pagos),asistencias:Number(r.asistencias),
    membresiasVigentes:Number(r.membresias_vigentes),membresiasVencidas:Number(r.membresias_vencidas),sociosNuevos:Number(r.socios_nuevos)})
}))

router.get('/auditoria',requireRoles('ADMINISTRADOR'),asyncRoute(async(req,res)=>{
  const {page,size,offset}=paging(req,20,100)
  const [data,count]=await Promise.all([
    pool.query(`SELECT a.id,u.correo AS usuario_correo,a.accion,a.entidad,a.entidad_id,a.detalle,a.fecha
      FROM gimnasio.auditoria a LEFT JOIN gimnasio.usuarios u ON u.id=a.usuario_id ORDER BY a.fecha DESC LIMIT $1 OFFSET $2`,[size,offset]),
    pool.query('SELECT count(*)::int AS total FROM gimnasio.auditoria')
  ])
  const content=data.rows.map(r=>({id:Number(r.id),usuarioCorreo:r.usuario_correo,accion:r.accion,entidad:r.entidad,entidadId:r.entidad_id===null?null:Number(r.entidad_id),detalle:r.detalle,fecha:r.fecha}))
  res.json(pageResult(content,count.rows[0].total,page,size))
}))

export default router
