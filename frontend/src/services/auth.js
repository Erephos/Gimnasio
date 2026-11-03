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
