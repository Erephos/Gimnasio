import { getDb, updateDb, resetDb } from '../mock/db.js'

function nextId(list) {
  return list.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1
}

function nowHora() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function listSocios() {
  return getDb().socios.filter((s) => s.activo !== false)
}

export function listPlanes(all = false) {
  const planes = getDb().planes
  return all ? planes : planes.filter((p) => p.activo !== false)
}

export function listPagos() {
  return getDb().pagos
}

export function listClases() {
  return getDb().clases
}

export function listEntrenadores() {
  return getDb().entrenadores.filter((e) => e.activo !== false)
}

export function listUsers() {
  return getDb().users
}

export function getCaja() {
  return getDb().caja
}

export function getAlertas() {
  const socios = listSocios()
  const planes = getDb().planes
  return socios
    .filter((s) => s.estado === 'por_vencer' || s.estado === 'vencida')
    .map((s, i) => ({
      id: s.id,
      socio: s.nombre,
      plan: planes.find((p) => p.id === s.planId)?.nombre || '—',
      estado: s.estado,
      dias: s.estado === 'vencida' ? -1 : 3,
      codigo: s.codigo,
    }))
}

export function getStats() {
  const socios = listSocios()
  const pagos = listPagos()
  const ingresos = pagos.reduce((a, p) => a + (p.importe || 0), 0)
  return {
    sociosTotal: socios.length,
    sociosActivos: socios.filter((s) => s.estado === 'activa' || s.estado === 'por_vencer').length,
    porVencer: socios.filter((s) => s.estado === 'por_vencer').length,
    vencidos: socios.filter((s) => s.estado === 'vencida').length,
    cobros: pagos.length,
    ingresos,
    clases: listClases().length,
    entrenadores: listEntrenadores().length,
  }
}

export function createSocio({ nombre, dni, correo, telefono, planId, password }) {
  const dniClean = String(dni).replace(/\D/g, '')
  if (!nombre?.trim()) throw new Error('El nombre es obligatorio')
  if (dniClean.length < 7) throw new Error('DNI inválido')
  if (!correo?.includes('@')) throw new Error('Correo inválido')

  let created
  updateDb((db) => {
    if (db.socios.some((s) => s.dni === dniClean && s.activo !== false)) throw new Error('Ya existe un socio con ese DNI')
    if (db.socios.some((s) => s.correo?.toLowerCase() === correo.toLowerCase() && s.activo !== false)) throw new Error('Ya existe un socio con ese correo')
    const id = nextId(db.socios)
    created = {
      id,
      codigo: `SOC-${String(id).padStart(4, '0')}`,
      nombre: nombre.trim(),
      dni: dniClean,
      correo: correo.trim().toLowerCase(),
      telefono: telefono?.trim() || '',
      planId: Number(planId) || db.planes[0]?.id || 1,
      estado: 'activa',
      ultimaAsistencia: '—',
      fechaAlta: new Date().toISOString().slice(0, 10),
      activo: true,
    }
    db.socios.push(created)
    if (password && password.length >= 4) {
      db.users.push({
        id: nextId(db.users),
        correo: created.correo,
        password,
        nombre: created.nombre,
        rol: 'SOCIO',
        activo: true,
        socioId: id,
      })
    }
  })
  return created
}

export function updateSocio(id, patch) {
  let updated
  updateDb((db) => {
    const s = db.socios.find((x) => x.id === Number(id))
    if (!s) throw new Error('Socio no encontrado')
    if (patch.nombre != null) s.nombre = String(patch.nombre).trim()
    if (patch.telefono != null) s.telefono = String(patch.telefono).trim()
    if (patch.correo != null) s.correo = String(patch.correo).trim().toLowerCase()
    if (patch.planId != null) s.planId = Number(patch.planId)
    if (patch.estado != null) s.estado = patch.estado
    if (patch.dni != null) s.dni = String(patch.dni).replace(/\D/g, '')
    updated = { ...s }
  })
  return updated
}

export function deactivateSocio(id) {
  updateDb((db) => {
    const s = db.socios.find((x) => x.id === Number(id))
    if (!s) throw new Error('Socio no encontrado')
    s.activo = false
    s.estado = 'vencida'
    const u = db.users.find((x) => x.socioId === s.id || x.correo === s.correo)
    if (u) u.activo = false
  })
}

export function registerPago({ socioId, concepto, medio, importe, renovar }) {
  const amount = Number(importe)
  if (!amount || amount <= 0) throw new Error('Importe inválido')
  if (!medio) throw new Error('Elige un medio de pago')

  let pago
  updateDb((db) => {
    const socio = db.socios.find((s) => s.id === Number(socioId))
    if (!socio) throw new Error('Socio no encontrado')
    const id = nextId(db.pagos)
    pago = {
      id,
      hora: nowHora(),
      comprobante: `REC-${String(90000 + id).slice(-5)}`,
      socio: socio.nombre,
      socioId: socio.id,
      concepto: concepto?.trim() || 'Pago membresía',
      medio,
      importe: amount,
      estado: 'Pagado',
    }
    db.pagos.unshift(pago)
    if (renovar !== false) socio.estado = 'activa'
    if (medio === 'Efectivo') db.caja.ingresosEfectivo = (db.caja.ingresosEfectivo || 0) + amount
    else if (medio === 'Transferencia') db.caja.transferencias = (db.caja.transferencias || 0) + amount
    else if (medio === 'Tarjeta') db.caja.tarjetas = (db.caja.tarjetas || 0) + amount
  })
  return pago
}

export function checkIn(dni) {
  const dniClean = String(dni).replace(/\D/g, '')
  let result
  updateDb((db) => {
    const socio = db.socios.find((s) => s.dni === dniClean && s.activo !== false)
    if (!socio) {
      result = { ok: false, msg: 'DNI no encontrado en el sistema.' }
      return
    }
    if (socio.estado === 'vencida') {
      result = { ok: false, msg: `Acceso rechazado. Membresía de ${socio.nombre} vencida.`, socio }
      return
    }
    socio.ultimaAsistencia = `Hoy, ${nowHora()}`
    result = { ok: true, msg: `Ingreso registrado. Bienvenido/a ${socio.nombre}.`, socio: { ...socio } }
  })
  return result
}

export function createPlan({ nombre, precio, dias, disciplina }) {
  if (!nombre?.trim()) throw new Error('Nombre obligatorio')
  let plan
  updateDb((db) => {
    plan = {
      id: nextId(db.planes),
      nombre: nombre.trim(),
      precio: Number(precio) || 0,
      dias: Number(dias) || 30,
      disciplina: disciplina?.trim() || 'Full',
      activo: true,
    }
    db.planes.push(plan)
  })
  return plan
}

export function updatePlan(id, patch) {
  let plan
  updateDb((db) => {
    const p = db.planes.find((x) => x.id === Number(id))
    if (!p) throw new Error('Plan no encontrado')
    if (patch.nombre != null) p.nombre = String(patch.nombre).trim()
    if (patch.precio != null) p.precio = Number(patch.precio)
    if (patch.dias != null) p.dias = Number(patch.dias)
    if (patch.disciplina != null) p.disciplina = String(patch.disciplina).trim()
    if (patch.activo != null) p.activo = Boolean(patch.activo)
    plan = { ...p }
  })
  return plan
}

export function createClase({ nombre, dia, hora, entrenador, cupo, aula }) {
  if (!nombre?.trim()) throw new Error('Nombre obligatorio')
  let clase
  updateDb((db) => {
    clase = {
      id: nextId(db.clases),
      nombre: nombre.trim(),
      dia: dia || 'Lunes',
      hora: hora || '09:00',
      entrenador: entrenador || 'Sin asignar',
      cupo: Number(cupo) || 10,
      inscritos: 0,
      aula: aula || 'Aula 1',
    }
    db.clases.push(clase)
  })
  return clase
}

export function updateClase(id, patch) {
  let clase
  updateDb((db) => {
    const c = db.clases.find((x) => x.id === Number(id))
    if (!c) throw new Error('Clase no encontrada')
    Object.assign(c, patch)
    clase = { ...c }
  })
  return clase
}

export function deleteClase(id) {
  updateDb((db) => {
    db.clases = db.clases.filter((c) => c.id !== Number(id))
  })
}

export function createEntrenador({ nombre, especialidad }) {
  if (!nombre?.trim()) throw new Error('Nombre obligatorio')
  let e
  updateDb((db) => {
    e = {
      id: nextId(db.entrenadores),
      nombre: nombre.trim(),
      especialidad: especialidad?.trim() || 'General',
      clases: 0,
      activo: true,
    }
    db.entrenadores.push(e)
  })
  return e
}

export function recoverPassword(correo) {
  const db = getDb()
  const user = db.users.find((u) => u.correo.toLowerCase() === String(correo).trim().toLowerCase() && u.activo)
  if (!user) throw new Error('No hay una cuenta con ese correo')
  // Simulación: “enviamos” y devolvemos token demo
  return {
    ok: true,
    message: `Se envió un enlace de recuperación a ${user.correo} (simulado). Usa la contraseña actual o restablécela abajo.`,
    correo: user.correo,
    canReset: true,
  }
}

export function resetPassword(correo, newPassword) {
  if (!newPassword || newPassword.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')
  updateDb((db) => {
    const user = db.users.find((u) => u.correo.toLowerCase() === String(correo).trim().toLowerCase())
    if (!user) throw new Error('Usuario no encontrado')
    user.password = newPassword
  })
  return { ok: true }
}

export function registerPublic({ nombre, correo, password, dni }) {
  return createSocio({
    nombre,
    correo,
    password,
    dni: dni || String(Math.floor(10000000 + Math.random() * 89999999)),
    telefono: '',
    planId: 1,
  })
}

export function toggleUserActive(userId) {
  updateDb((db) => {
    const u = db.users.find((x) => x.id === Number(userId))
    if (!u) throw new Error('Usuario no encontrado')
    if (u.rol === 'ADMINISTRADOR') throw new Error('No se puede desactivar al administrador principal')
    u.activo = !u.activo
  })
}

export function changeUserRole(userId, rol) {
  updateDb((db) => {
    const u = db.users.find((x) => x.id === Number(userId))
    if (!u) throw new Error('Usuario no encontrado')
    u.rol = rol
  })
}

export function resetAllData() {
  return resetDb()
}
