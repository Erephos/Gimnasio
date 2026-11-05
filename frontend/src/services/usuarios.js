import { get, patch, post } from './api.js'

export const listUsuarios = ({ rol, page = 0, size = 10 } = {}) =>
  get('/usuarios', { params: { rol, page, size } })

export const createUsuario = (data) => post('/usuarios', data)
export const changeUsuarioRol = (id, rol) => patch(`/usuarios/${id}/rol`, { rol })
export const setUsuarioActivo = (id, activo) =>
  patch(`/usuarios/${id}/estado`, undefined, { params: { activo } })

export const listEntrenadores = ({ page = 0, size = 50 } = {}) =>
  get('/entrenadores', { params: { page, size } })

export const createEntrenador = (data) => post('/entrenadores', data)
