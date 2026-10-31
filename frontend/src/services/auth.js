import { patch, post } from './api.js'

export const login = ({ correo, password }) =>
  post('/auth/login', { correo, password }, { auth: false })

export const requestPasswordReset = (correo) =>
  post('/auth/recuperar', { correo }, { auth: false })

export const resetPassword = ({ token, nuevaPassword }) =>
  post('/auth/restablecer', { token, nuevaPassword }, { auth: false })

export const changeOwnPassword = ({ passwordActual, passwordNueva }) =>
  patch('/usuarios/mi-password', { passwordActual, passwordNueva })
