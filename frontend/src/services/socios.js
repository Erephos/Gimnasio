import { del, get, post, put } from './api.js'

// Registro público: crea la cuenta y el perfil del socio.
export const registerSocio = (data) => post('/socios', data, { auth: false })

// Alta hecha por el personal (usa el mismo endpoint, con sesión iniciada).
export const createSocio = (data) => post('/socios', data)

export const listSocios = ({ q, activo, page = 0, size = 10 } = {}) =>
  get('/socios', { params: { q, activo, page, size } })

export const getSocio = (id) => get(`/socios/${id}`)
export const getMyProfile = () => get('/socios/mi-perfil')
export const updateSocio = (id, data) => put(`/socios/${id}`, data)
export const deactivateSocio = (id) => del(`/socios/${id}`)
