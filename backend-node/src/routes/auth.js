import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { z } from 'zod'
import pool from '../config/database.js'
import { asyncRoute, audit, fail, inTransaction, validate } from '../lib/http.js'

const router = Router()
const loginSchema = z.object({ correo: z.string().email().max(100), password: z.string().min(1) })
const resetSchema = z.object({ token: z.string().min(1), nuevaPassword: z.string().min(8).max(100) })
const dummyPasswordHash = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 12)

router.post('/login', validate(loginSchema), asyncRoute(async (req, res) => {
  const correo = req.body.correo.trim().toLowerCase()
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.correo, u.password_hash, u.activo, r.nombre AS rol
     FROM gimnasio.usuarios u JOIN gimnasio.roles r ON r.id = u.rol_id WHERE lower(u.correo) = $1`, [correo]
  )
  const user = rows[0]
  const passwordMatches = await bcrypt.compare(req.body.password, user?.password_hash ?? dummyPasswordHash)
  if (!user?.activo || !passwordMatches) {
    throw fail.unauthorized('Credenciales invalidas')
  }
  const token = jwt.sign({ correo: user.correo, rol: user.rol }, process.env.JWT_SECRET,
    { subject: String(user.id), expiresIn: process.env.JWT_EXPIRES_IN ?? '30m', algorithm: 'HS256' })
  await audit(pool, user.id, 'INICIAR_SESION', 'USUARIO', user.id, 'Inicio de sesion exitoso')
  res.json({ token, tokenType: 'Bearer', usuarioId: Number(user.id), nombre: `${user.nombre} ${user.apellido}`.trim(), rol: user.rol })
}))

router.post('/recuperar', validate(z.object({ correo: z.string().email() })), asyncRoute(async (req, res) => {
  // Sin proveedor SMTP configurado no se emite ni se persiste un token recuperable.
  // La respuesta siempre es genérica para evitar enumerar cuentas.
  if (process.env.APP_MAIL_ENABLED === 'true') {
    const { rows } = await pool.query('SELECT id FROM gimnasio.usuarios WHERE lower(correo) = $1 AND activo = true', [req.body.correo.trim().toLowerCase()])
    if (rows[0]) {
      const token = crypto.randomBytes(32).toString('base64url')
      const digest = crypto.createHash('sha256').update(token).digest('hex')
      await inTransaction(pool, async (db) => {
        await db.query('UPDATE gimnasio.recuperacion_tokens SET usado_en = now() WHERE usuario_id = $1 AND usado_en IS NULL', [rows[0].id])
        await db.query('INSERT INTO gimnasio.recuperacion_tokens (usuario_id, token_hash, expira_en) VALUES ($1, $2, now() + interval \'30 minutes\')', [rows[0].id, digest])
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
        await pool.query('UPDATE gimnasio.recuperacion_tokens SET usado_en=now() WHERE token_hash=$1', [digest])
      }
    }
  }
  res.status(202).json({ mensaje: 'Si el correo esta registrado, recibiras las instrucciones' })
}))

router.post('/restablecer', validate(resetSchema), asyncRoute(async (req, res) => {
  const digest = crypto.createHash('sha256').update(req.body.token).digest('hex')
  await inTransaction(pool, async (db) => {
    const { rows } = await db.query(
      `SELECT id, usuario_id FROM gimnasio.recuperacion_tokens
       WHERE token_hash = $1 AND usado_en IS NULL AND expira_en > now() FOR UPDATE`, [digest]
    )
    if (!rows[0]) throw fail.bad('El token de recuperacion es invalido o ha vencido')
    const hash = await bcrypt.hash(req.body.nuevaPassword, 12)
    await db.query('UPDATE gimnasio.usuarios SET password_hash = $1, actualizado_en = now() WHERE id = $2', [hash, rows[0].usuario_id])
    await db.query('UPDATE gimnasio.recuperacion_tokens SET usado_en = now() WHERE id = $1', [rows[0].id])
    await audit(db, rows[0].usuario_id, 'RESTABLECER_PASSWORD', 'USUARIO', rows[0].usuario_id, 'Restablecimiento por correo')
  })
  res.json({ mensaje: 'Contrasena actualizada correctamente' })
}))

export default router
