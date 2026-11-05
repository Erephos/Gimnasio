<<<<<<< HEAD
import { getDb } from '../mock/db.js'

export function login({ correo, password }) {
  const db = getDb()
  const user = db.users.find(
    (u) => u.correo.toLowerCase() === correo.toLowerCase() && u.password === password && u.activo
  )
  if (!user) {
    const err = new Error('Correo o contraseña incorrectos')
    err.status = 401
    throw err
  }
  return {
    token: 'mock-token-' + user.id,
    usuarioId: user.id,
    nombre: user.nombre,
    rol: user.rol,
    correo: user.correo,
  }
}

export function registerSocio(data) {
  // solo staff crea socios; el registro público de demo redirige a login
  return { ok: true }
}
=======
import { patch, post } from './api.js'

export const login = ({ correo, password }) =>
  post('/auth/login', { correo, password }, { auth: false })

export const requestPasswordReset = (correo) =>
  post('/auth/recuperar', { correo }, { auth: false })

export const resetPassword = ({ token, nuevaPassword }) =>
  post('/auth/restablecer', { token, nuevaPassword }, { auth: false })

export const changeOwnPassword = ({ passwordActual, passwordNueva }) =>
  patch('/usuarios/mi-password', { passwordActual, passwordNueva })
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
