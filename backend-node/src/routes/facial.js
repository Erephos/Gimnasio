import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncRoute, audit, fail, positiveId, requireRoles, toIsoDate, validate } from '../lib/http.js'
import { matchDescriptor } from '../lib/faceRecognition.js'
import { mapAsistencia, registrarAsistencia } from './finance.js'

const router = Router()
const descriptorSchema = z.object({ descriptor: z.array(z.number()).length(128) })

router.post('/socios/:id/rostro', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), validate(descriptorSchema), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  const socio = await prisma.socio.findUnique({ where: { id: BigInt(id) } })
  if (!socio) throw fail.missing('Socio no encontrado')
  await prisma.$transaction(async (tx) => {
    await tx.socio.update({ where: { id: socio.id }, data: { rostroDescriptor: req.body.descriptor } })
    await audit(tx, req.user.id, 'ENROLAR_ROSTRO', 'SOCIO', socio.id, 'Rostro registrado para check-in facial')
  })
  res.status(201).json({ mensaje: 'ROSTRO REGISTRADO' })
}))

router.post('/asistencias/facial', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), validate(descriptorSchema), asyncRoute(async (req, res) => {
  const candidatos = await prisma.socio.findMany({ select: { id: true, rostroDescriptor: true } })
  const enrolados = candidatos.filter((s) => s.rostroDescriptor).map((s) => ({ id: s.id, descriptor: s.rostroDescriptor }))
  const match = matchDescriptor(req.body.descriptor, enrolados)
  if (!match) throw fail.missing('No se reconocio a ningun socio con esa foto')

  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`
      SELECT s.id, s.dni, u.activo, u.nombre, u.apellido FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id = s.usuario_id
      WHERE s.id = ${BigInt(match.id)} FOR UPDATE OF s, u`
    const socio = rows[0]
    if (!socio) throw fail.missing('Socio no encontrado')
    return registrarAsistencia(tx, socio, req.user.id)
  })
  res.status(201).json({ ...mapAsistencia(result, toIsoDate(result.membresiaFin)), distancia: match.distancia })
}))

export default router
