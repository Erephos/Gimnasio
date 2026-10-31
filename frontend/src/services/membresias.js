import { get, post } from './api.js'

export const assignMembresia = (data) => post('/membresias', data)
export const listMembresiasBySocio = (socioId) => get(`/membresias/socio/${socioId}`)
export const getMembresiaVigenteBySocio = (socioId) => get(`/membresias/socio/${socioId}/vigente`)
export const listMyMembresias = () => get('/membresias/mia')
export const getMyMembresiaVigente = () => get('/membresias/mia/vigente')
export const listAlertas = (dias = 7) => get('/membresias/alertas', { params: { dias } })
