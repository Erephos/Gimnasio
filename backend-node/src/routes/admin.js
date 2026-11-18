import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncRoute, pageResult, paging, requireRoles, fail } from '../lib/http.js'

const router = Router()
const todayLima = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })

router.get('/reportes/resumen', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), asyncRoute(async (req, res) => {
  const today = todayLima()
  const defaultStart = `${today.slice(0, 7)}-01`
  const desde = String(req.query.desde ?? defaultStart)
  const hasta = String(req.query.hasta ?? today)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) throw fail.bad('Las fechas deben tener formato AAAA-MM-DD')
  if (desde > hasta) throw fail.bad('La fecha desde no puede ser posterior a hasta')
  if (hasta > today) throw fail.bad('La fecha hasta no puede estar en el futuro')
  // Reporte agregado sobre varias tablas: se queda en SQL crudo, igual que
  // con pg, en vez de forzarlo a varias llamadas separadas del ORM.
  const rows = await prisma.$queryRaw`SELECT
    coalesce((SELECT sum(monto) FROM gimnasio.pagos WHERE estado='REGISTRADO' AND fecha_pago >= (${desde}::date::timestamp AT TIME ZONE 'America/Lima') AND fecha_pago < ((${hasta}::date + 1)::timestamp AT TIME ZONE 'America/Lima')),0) AS ingresos,
    (SELECT count(*)::int FROM gimnasio.pagos WHERE estado='REGISTRADO' AND fecha_pago >= (${desde}::date::timestamp AT TIME ZONE 'America/Lima') AND fecha_pago < ((${hasta}::date + 1)::timestamp AT TIME ZONE 'America/Lima')) AS pagos,
    (SELECT count(*)::int FROM gimnasio.asistencias WHERE fecha BETWEEN ${desde}::date AND ${hasta}::date) AS asistencias,
    (SELECT count(*)::int FROM gimnasio.membresias m JOIN gimnasio.socios s ON s.id=m.socio_id JOIN gimnasio.usuarios u ON u.id=s.usuario_id WHERE u.activo=true AND m.fecha_inicio<=${hasta}::date AND m.fecha_fin>${hasta}::date) AS membresias_vigentes,
    (SELECT count(*)::int FROM gimnasio.membresias m JOIN gimnasio.socios s ON s.id=m.socio_id JOIN gimnasio.usuarios u ON u.id=s.usuario_id WHERE u.activo=true AND m.fecha_fin<=${hasta}::date) AS membresias_vencidas,
    (SELECT count(*)::int FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id=s.usuario_id WHERE u.creado_en >= (${desde}::date::timestamp AT TIME ZONE 'America/Lima') AND u.creado_en < ((${hasta}::date + 1)::timestamp AT TIME ZONE 'America/Lima')) AS socios_nuevos`
  const r = rows[0]
  res.json({
    desde, hasta, ingresosRegistrados: Number(r.ingresos), pagosRegistrados: Number(r.pagos), asistencias: Number(r.asistencias),
    membresiasVigentes: Number(r.membresias_vigentes), membresiasVencidas: Number(r.membresias_vencidas), sociosNuevos: Number(r.socios_nuevos)
  })
}))

router.get('/auditoria', requireRoles('ADMINISTRADOR'), asyncRoute(async (req, res) => {
  const { page, size, offset } = paging(req, 20, 100)
  const [data, total] = await Promise.all([
    prisma.auditoria.findMany({
      orderBy: { fecha: 'desc' }, skip: offset, take: size,
      include: { usuario: true }
    }),
    prisma.auditoria.count()
  ])
  const content = data.map((a) => ({
    id: Number(a.id), usuarioCorreo: a.usuario?.correo ?? null, accion: a.accion, entidad: a.entidad,
    entidadId: a.entidadId === null ? null : Number(a.entidadId), detalle: a.detalle, fecha: a.fecha
  }))
  res.json(pageResult(content, total, page, size))
}))

export default router
