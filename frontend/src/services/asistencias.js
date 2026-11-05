import { get, post } from './api.js'

export const registerAsistencia = (dni) => post('/asistencias', { dni })

export const listAsistencias = ({ fecha, q, page = 0, size = 20 } = {}) =>
  get('/asistencias', { params: { fecha, q, page, size } })

export const listAsistenciasBySocio = (socioId, { page = 0, size = 20 } = {}) =>
  get(`/asistencias/socio/${socioId}`, { params: { page, size } })
