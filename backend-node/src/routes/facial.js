import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncRoute, audit, fail, positiveId, requireRoles, toIsoDate, validate } from '../lib/http.js'
import { enrollFace, identifyFace } from '../lib/faceRecognition.js'
import { mapAsistencia, registrarAsistencia } from './finance.js'

const router = Router()
const imagenSchema = z.object({ imagenBase64: z.string().min(100) })

function decodeImagen(imagenBase64) {
  const base64 = imagenBase64.replace(/^data:image\/\w+;base64,/, '')
  try {
    return Buffer.from(base64, 'base64')
  } catch {
    throw fail.bad('La imagen no es un base64 valido')
  }
}

router.post('/socios/:id/rostro', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), validate(imagenSchema), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id)
  const socio = await prisma.socio.findUnique({ where: { id: BigInt(id) }, include: { usuario: true } })
  if (!socio) throw fail.missing('Socio no encontrado')
  const imagen = decodeImagen(req.body.imagenBase64)
  const personId = await enrollFace(socio.id, `${socio.usuario.nombre} ${socio.usuario.apellido}`, imagen)
  await prisma.$transaction(async (tx) => {
    await tx.socio.update({ where: { id: socio.id }, data: { rostroPersonId: personId } })
    await audit(tx, req.user.id, 'ENROLAR_ROSTRO', 'SOCIO', socio.id, 'Rostro registrado para check-in facial')
  })
  res.status(201).json({ mensaje: 'ROSTRO REGISTRADO' })
}))

router.post('/asistencias/facial', requireRoles('ADMINISTRADOR', 'RECEPCIONISTA'), validate(imagenSchema), asyncRoute(async (req, res) => {
  const imagen = decodeImagen(req.body.imagenBase64)
  const match = await identifyFace(imagen)
  if (!match) throw fail.missing('No se reconocio a ningun socio con esa foto')
  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`
      SELECT s.id, s.dni, u.activo, u.nombre, u.apellido FROM gimnasio.socios s JOIN gimnasio.usuarios u ON u.id = s.usuario_id
      WHERE s.rostro_person_id = ${match.personId} FOR UPDATE OF s, u`
    const socio = rows[0]
    if (!socio) throw fail.missing('El rostro reconocido ya no corresponde a ningun socio')
    return registrarAsistencia(tx, socio, req.user.id)
  })
  res.status(201).json({ ...mapAsistencia(result, toIsoDate(result.membresiaFin)), confianza: match.confianza })
}))

export default router
