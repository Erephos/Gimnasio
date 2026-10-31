import { get, patch, post } from './api.js'

export const listClases = () => get('/clases')
export const createClase = (data) => post('/clases', data)
export const cancelClase = (id) => patch(`/clases/${id}/cancelar`)

export const createReserva = (data) => post('/reservas', data)
export const listMyReservas = () => get('/reservas/mias')
export const listReservasByClase = (claseId) => get(`/reservas/clase/${claseId}`)
export const cancelReserva = (id) => patch(`/reservas/${id}/cancelar`)
export const markReservaAsistencia = (id) => patch(`/reservas/${id}/asistencia`)
