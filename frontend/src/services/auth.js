import { api } from './api.js'

export async function login({ correo, password }) {
  return api.post('/auth/login', { correo, password })
}
