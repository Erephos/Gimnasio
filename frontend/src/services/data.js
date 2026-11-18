import { api } from './api.js'

// ---- Planes ----
export async function listPlanes(all = false) {
  return api.get(all ? '/planes/todos' : '/planes')
}

export async function createPlan({ nombre, precio, duracionDias }) {
  return api.post('/planes', { nombre: nombre?.trim(), precio: Number(precio), duracionDias: Number(duracionDias) })
}

export async function updatePlan(id, { nombre, precio, duracionDias }) {
  return api.put(`/planes/${id}`, { nombre: nombre?.trim(), precio: Number(precio), duracionDias: Number(duracionDias) })
}

export async function setPlanActivo(id, activo) {
  return api.patch(`/planes/${id}/estado?activo=${activo}`)
}

// ---- Socios ----
export async function listSocios({ q = '', activo, page = 0, size = 50 } = {}) {
  const params = new URLSearchParams({ page, size })
  if (q) params.set('q', q)
  if (activo !== undefined) params.set('activo', activo)
  return api.get(`/socios?${params}`)
}

export async function getSocio(id) {
  return api.get(`/socios/${id}`)
}

export async function getMiPerfil() {
  return api.get('/socios/mi-perfil')
}

export async function createSocio({ nombre, apellido, correo, password, dni, telefono, genero, direccion, contactoEmergencia }) {
  return api.post('/socios', {
    nombre: nombre?.trim(), apellido: apellido?.trim(), correo: correo?.trim(), password, dni, genero,
    telefono: telefono?.trim() || undefined,
    direccion: direccion?.trim() || undefined,
    contactoEmergencia: contactoEmergencia?.trim() || undefined,
  })
}

export async function updateSocio(id, patch) {
  return api.put(`/socios/${id}`, patch)
}

export async function deactivateSocio(id) {
  return api.del(`/socios/${id}`)
}

// ---- Membresias ----
export async function crearMembresia({ socioId, planId, fechaInicio }) {
  return api.post('/membresias', { socioId: Number(socioId), planId: Number(planId), fechaInicio })
}

export async function getMembresiaVigenteSocio(socioId) {
  try {
    return await api.get(`/membresias/socio/${socioId}/vigente`)
  } catch {
    return null
  }
}

export async function getMiMembresiaVigente() {
  try {
    return await api.get('/membresias/mia/vigente')
  } catch {
    return null
  }
}

export async function getAlertas(dias = 7) {
  return api.get(`/membresias/alertas?dias=${dias}`)
}

// ---- Pagos ----
export async function listPagos({ page = 0, size = 10, socioId, q, estado } = {}) {
  const params = new URLSearchParams({ page, size })
  if (socioId) params.set('socioId', socioId)
  if (q) params.set('q', q)
  if (estado) params.set('estado', estado)
  return api.get(`/pagos?${params}`)
}

export async function registrarPago({ membresiaId, monto, metodo }) {
  return api.post('/pagos', { membresiaId: Number(membresiaId), monto: Number(monto), metodo })
}

export async function listPagosPorMembresia(membresiaId) {
  return api.get(`/pagos/membresia/${membresiaId}`)
}

export async function anularPago(id, motivo) {
  return api.patch(`/pagos/${id}/anular`, { motivo })
}

// ---- Asistencia ----
export async function checkIn(dni) {
  return api.post('/asistencias', { dni })
}

export async function enrolarRostro(socioId, descriptor) {
  return api.post(`/socios/${socioId}/rostro`, { descriptor })
}

export async function checkInFacial(descriptor) {
  return api.post('/asistencias/facial', { descriptor })
}

export async function listAsistencias({ fecha, q, page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page, size })
  if (fecha) params.set('fecha', fecha)
  if (q) params.set('q', q)
  return api.get(`/asistencias?${params}`)
}

// ---- Clases / Entrenadores ----
export async function listClases() {
  return api.get('/clases')
}

export async function createClase(body) {
  return api.post('/clases', body)
}

export async function cancelarClase(id) {
  return api.patch(`/clases/${id}/cancelar`)
}

export async function listEntrenadores() {
  return api.get('/entrenadores')
}

export async function createEntrenador({ nombre, apellido, correo, password, dni, telefono, especialidad }) {
  return api.post('/entrenadores', {
    nombre: nombre?.trim(), apellido: apellido?.trim(), correo: correo?.trim(), password, dni,
    telefono: telefono?.trim() || undefined, especialidad: especialidad?.trim(),
  })
}

// ---- Admin / Usuarios ----
export async function listUsers({ page = 0, size = 20, rol } = {}) {
  const params = new URLSearchParams({ page, size })
  if (rol) params.set('rol', rol)
  return api.get(`/usuarios?${params}`)
}

export async function toggleUserActive(userId, activo) {
  return api.patch(`/usuarios/${userId}/estado?activo=${activo}`)
}

export async function changeUserRole(userId, rol) {
  return api.patch(`/usuarios/${userId}/rol`, { rol })
}

// ---- Reportes / Auditoria ----
export async function getResumen({ desde, hasta } = {}) {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  return api.get(`/reportes/resumen?${params}`)
}

export async function listAuditoria({ page = 0, size = 20 } = {}) {
  return api.get(`/auditoria?page=${page}&size=${size}`)
}

// ---- Recuperacion de contrasena ----
export async function recoverPassword(correo) {
  return api.post('/auth/recuperar', { correo })
}

export async function resetPassword(token, nuevaPassword) {
  return api.post('/auth/restablecer', { token, nuevaPassword })
}

export async function registerPublic({ nombre, apellido, correo, password, dni, genero, telefono }) {
  return api.post('/socios', { nombre: nombre?.trim(), apellido: apellido?.trim(), correo: correo?.trim(), password, dni, genero, telefono: telefono?.trim() || undefined })
}
