import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncRoute, validate } from '../lib/http.js'

const router = Router()
const scoreSchema = z.object({
  nombre: z.string().trim().min(1).max(60),
  repeticiones: z.coerce.number().int().min(0).max(500),
  duracionSegundos: z.coerce.number().int().positive().max(600)
})

function mapScore(row) {
  return { id: Number(row.id), nombre: row.nombre, repeticiones: row.repeticiones, duracionSegundos: row.duracionSegundos, creadoEn: row.creadoEn }
}

// Publico: stand de feria, visitantes sin cuenta compiten contando sentadillas.
router.post('/reto-sentadillas', validate(scoreSchema), asyncRoute(async (req, res) => {
  const creado = await prisma.retoSentadilla.create({ data: req.body })
  res.status(201).json(mapScore(creado))
}))

router.get('/reto-sentadillas/top', asyncRoute(async (req, res) => {
  const limit = Math.max(1, Math.min(Number.parseInt(req.query.limit ?? '10', 10) || 10, 50))
  const top = await prisma.retoSentadilla.findMany({ orderBy: [{ repeticiones: 'desc' }, { creadoEn: 'asc' }], take: limit })
  res.json(top.map(mapScore))
}))

export default router
