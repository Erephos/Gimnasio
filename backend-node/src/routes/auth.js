import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncRoute, audit, fail, validate } from '../lib/http.js'

const router = Router()
const loginSchema = z.object({ correo: z.string().email().max(100), password: z.string().min(1) })
const resetSchema = z.object({ token: z.string().min(1), nuevaPassword: z.string().min(8).max(100) })
const dummyPasswordHash = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 12)

router.post('/login', validate(loginSchema), asyncRoute(async (req, res) => {
  const correo = req.body.correo.trim().toLowerCase()
  const user = await prisma.usuario.findUnique({ where: { correo }, include: { rol: true } })
  const passwordMatches = await bcrypt.compare(req.body.password, user?.passwordHash ?? dummyPasswordHash)
  if (!user?.activo || !passwordMatches) {
    throw fail.unauthorized('Credenciales invalidas')
  }
  const token = jwt.sign({ correo: user.correo, rol: user.rol.nombre }, process.env.JWT_SECRET,
    { subject: String(user.id), expiresIn: process.env.JWT_EXPIRES_IN ?? '30m', algorithm: 'HS256' })
  await audit(prisma, user.id, 'INICIAR_SESION', 'USUARIO', user.id, 'Inicio de sesion exitoso')
  res.json({ token, tokenType: 'Bearer', usuarioId: Number(user.id), nombre: `${user.nombre} ${user.apellido}`.trim(), correo: user.correo, rol: user.rol.nombre })
}))

router.post('/recuperar', validate(z.object({ correo: z.string().email() })), asyncRoute(async (req, res) => {
  // Sin proveedor SMTP configurado no se emite ni se persiste un token recuperable.
  // La respuesta siempre es genérica para evitar enumerar cuentas.
  if (process.env.APP_MAIL_ENABLED === 'true') {
    const correo = req.body.correo.trim().toLowerCase()
    const usuario = await prisma.usuario.findFirst({ where: { correo, activo: true } })
    if (usuario) {
      const token = crypto.randomBytes(32).toString('base64url')
      const digest = crypto.createHash('sha256').update(token).digest('hex')
      await prisma.$transaction(async (tx) => {
        await tx.recuperacionToken.updateMany({ where: { usuarioId: usuario.id, usadoEn: null }, data: { usadoEn: new Date() } })
        await tx.recuperacionToken.create({
          data: { usuarioId: usuario.id, tokenHash: digest, expiraEn: new Date(Date.now() + 30 * 60 * 1000) }
        })
      })
      try {
        const { default: nodemailer } = await import('nodemailer')
        const transporter = nodemailer.createTransport({
          host: process.env.MAIL_HOST,
          port: Number(process.env.MAIL_PORT ?? 587),
          secure: Number(process.env.MAIL_PORT ?? 587) === 465,
          auth: process.env.MAIL_USERNAME ? {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD
          } : undefined
        })
        const resetUrl = new URL(process.env.APP_MAIL_RESET_URL ?? 'http://localhost:5173/#/restablecer')
        resetUrl.searchParams.set('token', token)
        await transporter.sendMail({
          from: process.env.APP_MAIL_FROM ?? 'no-reply@gimnasio.local',
          to: req.body.correo.trim(),
          subject: 'Restablecimiento de contrasena',
          text: `Solicitaste restablecer tu contrasena. Usa este enlace antes de 30 minutos: ${resetUrl}`
        })
      } catch (error) {
        console.error('No se pudo enviar el correo de recuperacion:', error.message)
        await prisma.recuperacionToken.updateMany({ where: { tokenHash: digest }, data: { usadoEn: new Date() } })
      }
    }
  }
  res.status(202).json({ mensaje: 'Si el correo esta registrado, recibiras las instrucciones' })
}))

router.post('/restablecer', validate(resetSchema), asyncRoute(async (req, res) => {
  const digest = crypto.createHash('sha256').update(req.body.token).digest('hex')
  await prisma.$transaction(async (tx) => {
    // UPDATE ... RETURNING es atomico: equivale al SELECT ... FOR UPDATE +
    // UPDATE que hacia la version con pg, en un solo viaje a la base.
    const rows = await tx.$queryRaw`
      UPDATE gimnasio.recuperacion_tokens SET usado_en = now()
      WHERE token_hash = ${digest} AND usado_en IS NULL AND expira_en > now()
      RETURNING id, usuario_id AS "usuarioId"`
    const tokenRow = rows[0]
    if (!tokenRow) throw fail.bad('El token de recuperacion es invalido o ha vencido')
    const hash = await bcrypt.hash(req.body.nuevaPassword, 12)
    await tx.usuario.update({ where: { id: tokenRow.usuarioId }, data: { passwordHash: hash, actualizadoEn: new Date() } })
    await audit(tx, tokenRow.usuarioId, 'RESTABLECER_PASSWORD', 'USUARIO', tokenRow.usuarioId, 'Restablecimiento por correo')
  })
  res.json({ mensaje: 'Contrasena actualizada correctamente' })
}))

export default router
