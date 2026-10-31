import { get, patch, post } from './api.js'

export const createPago = (data) => post('/pagos', data)

export const listPagos = ({ socioId, q, estado, page = 0, size = 10 } = {}) =>
  get('/pagos', { params: { socioId, q, estado, page, size } })

export const listPagosByMembresia = (membresiaId) => get(`/pagos/membresia/${membresiaId}`)
export const annulPago = (id, motivo) => patch(`/pagos/${id}/anular`, { motivo })
