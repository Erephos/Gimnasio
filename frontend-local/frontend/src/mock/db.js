// Base de datos simulada en localStorage. Se siembra con datos de demostración la primera vez.
const STORAGE_KEY = 'gimnasio.mock.v1'
const pad = (n) => String(n).padStart(2, '0')

export function todayISO() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export const nowIso = () => new Date().toISOString()

// Hora de Lima (UTC-5) para las clases de demostración.
const limaDateTime = (dateISO, hhmm) => `${dateISO}T${hhmm}:00-05:00`

function seed() {
  const today = todayISO()
  const memb = (socioId, planId, planNombre, precio, inicioOffset, duracion, id) => {
    const fechaInicio = addDays(today, inicioOffset)
    return { id, socioId, planId, planNombre, precioPagado: precio, fechaInicio, fechaFin: addDays(fechaInicio, duracion) }
  }
  const pago = (id, socioId, socioNombre, membresiaId, monto, metodo, fechaPago) => ({
    id, socioId, socioNombre, membresiaId, monto, metodo, fechaPago,
    estado: 'REGISTRADO', registradoPor: 'Rocío Paredes', motivoAnulacion: null,
  })

  return {
    usuarios: [
      { id: 1, nombre: 'Andrea', apellido: 'Salazar', correo: 'admin@ximedgar.com', password: 'AdminGym2026!', rol: 'ADMINISTRADOR', activo: true, especialidad: null },
      { id: 2, nombre: 'Rocío', apellido: 'Paredes', correo: 'recepcion@ximedgar.com', password: 'Recepcion2026!', rol: 'RECEPCIONISTA', activo: true, especialidad: null },
      { id: 3, nombre: 'Luis', apellido: 'Ortega', correo: 'entrenador@ximedgar.com', password: 'Entrenador2026!', rol: 'ENTRENADOR', activo: true, especialidad: 'Musculación' },
      { id: 4, nombre: 'Sofía', apellido: 'Demo', correo: 'socio@ximedgar.com', password: 'Gimnasio2026!', rol: 'SOCIO', activo: true, especialidad: null },
      { id: 5, nombre: 'Lucía', apellido: 'Fernández', correo: 'lucia.fernandez@ximedgar.com', password: 'SocioGym2026!', rol: 'SOCIO', activo: true, especialidad: null },
      { id: 6, nombre: 'Carlos', apellido: 'Ruiz', correo: 'carlos.ruiz@ximedgar.com', password: 'SocioGym2026!', rol: 'SOCIO', activo: true, especialidad: null },
      { id: 7, nombre: 'Marta', apellido: 'Díaz', correo: 'marta.diaz@ximedgar.com', password: 'SocioGym2026!', rol: 'SOCIO', activo: true, especialidad: null },
    ],
    socios: [
      { id: 1, usuarioId: 4, nombre: 'Sofía', apellido: 'Demo', dni: '12345678', correo: 'socio@ximedgar.com', telefono: '+51 987 123 456', genero: 'FEMENINO', direccion: 'Av. Los Jardines 245, Lima', contactoEmergencia: 'Pedro Demo · +51 987 000 111', activo: true, creadoEn: `${addDays(today, -150)}T10:00:00.000Z` },
      { id: 2, usuarioId: 5, nombre: 'Lucía', apellido: 'Fernández', dni: '23456789', correo: 'lucia.fernandez@ximedgar.com', telefono: '+51 987 654 321', genero: 'FEMENINO', direccion: 'Calle Las Begonias 118, Miraflores', contactoEmergencia: 'Rosa Fernández · +51 987 111 222', activo: true, creadoEn: `${addDays(today, -95)}T10:00:00.000Z` },
      { id: 3, usuarioId: 6, nombre: 'Carlos', apellido: 'Ruiz', dni: '34567890', correo: 'carlos.ruiz@ximedgar.com', telefono: '+51 986 111 222', genero: 'MASCULINO', direccion: 'Jr. Ancash 540, Cercado de Lima', contactoEmergencia: 'Lucía Ruiz · +51 986 333 444', activo: true, creadoEn: `${addDays(today, -60)}T10:00:00.000Z` },
      { id: 4, usuarioId: 7, nombre: 'Marta', apellido: 'Díaz', dni: '45678901', correo: 'marta.diaz@ximedgar.com', telefono: '+51 985 333 444', genero: 'FEMENINO', direccion: 'Av. Arequipa 1820, Lince', contactoEmergencia: 'Jorge Díaz · +51 985 555 666', activo: true, creadoEn: `${addDays(today, -30)}T10:00:00.000Z` },
    ],
    planes: [
      { id: 1, nombre: 'Mensual', precio: 39.9, duracionDias: 30, activo: true, descripcion: 'Acceso completo durante 30 días.' },
      { id: 2, nombre: 'Trimestral', precio: 109.9, duracionDias: 90, activo: true, descripcion: 'Acceso completo durante 90 días.' },
      { id: 3, nombre: 'Anual', precio: 379.9, duracionDias: 365, activo: true, descripcion: 'Acceso completo durante 365 días.' },
      { id: 4, nombre: 'Promo verano', precio: 29.9, duracionDias: 30, activo: false, descripcion: 'Plan de temporada (inactivo).' },
    ],
    membresias: [
      memb(1, 1, 'Mensual', 39.9, -12, 30, 1),
      memb(1, 2, 'Trimestral', 109.9, -150, 90, 2),
      memb(2, 2, 'Trimestral', 109.9, -10, 90, 3),
      memb(3, 1, 'Mensual', 39.9, -45, 30, 4),
      memb(4, 3, 'Anual', 379.9, -20, 365, 5),
    ],
    pagos: [
      pago(1, 1, 'Sofía Demo', 1, 39.9, 'EFECTIVO', today),
      pago(2, 2, 'Lucía Fernández', 3, 109.9, 'TRANSFERENCIA', today),
      pago(3, 3, 'Carlos Ruiz', 4, 39.9, 'TARJETA', addDays(today, -1)),
      pago(4, 4, 'Marta Díaz', 5, 379.9, 'TRANSFERENCIA', addDays(today, -10)),
    ],
    asistencias: [],
    clases: [
      { id: 1, disciplina: 'Yoga', entrenadorId: 3, aula: 'Aula 1', inicio: limaDateTime(addDays(today, 1), '18:00'), fin: limaDateTime(addDays(today, 1), '19:00'), aforo: 12, estado: 'ACTIVA' },
      { id: 2, disciplina: 'Spinning', entrenadorId: 3, aula: 'Aula 2', inicio: limaDateTime(addDays(today, 2), '07:00'), fin: limaDateTime(addDays(today, 2), '08:00'), aforo: 15, estado: 'ACTIVA' },
      { id: 3, disciplina: 'Funcional', entrenadorId: 3, aula: 'Sala de pesas', inicio: limaDateTime(addDays(today, 3), '19:00'), fin: limaDateTime(addDays(today, 3), '20:00'), aforo: 10, estado: 'ACTIVA' },
    ],
    reservas: [
      { id: 1, claseId: 1, socioId: 1, estado: 'RESERVADA', creadaEn: nowIso(), asistioEn: null },
    ],
    auditoria: [],
    seq: { usuarios: 7, socios: 4, planes: 4, membresias: 5, pagos: 4, asistencias: 0, clases: 3, reservas: 1, auditoria: 0 },
  }
}

let cache = null

export function getDb() {
  if (cache) return cache
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    cache = raw ? JSON.parse(raw) : seed()
  } catch {
    cache = seed()
  }
  return cache
}

export function saveDb() {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // Sin almacenamiento disponible, los datos viven solo mientras la pestaña esté abierta.
  }
}

export function resetDb() {
  cache = seed()
  saveDb()
  return cache
}

export function nextId(db, table) {
  db.seq[table] = (db.seq[table] ?? 0) + 1
  return db.seq[table]
}
