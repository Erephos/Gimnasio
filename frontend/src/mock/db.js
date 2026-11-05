<<<<<<< HEAD
const KEY = 'ximedgar.gym.v1'

const seed = {
  users: [
    { id: 1, correo: 'admin@ximedgar.com', password: 'Admin2026!', nombre: 'Edgar Admin', rol: 'ADMINISTRADOR', activo: true },
    { id: 2, correo: 'recepcion@ximedgar.com', password: 'Recepcion2026!', nombre: 'Lucía Martínez', rol: 'RECEPCIONISTA', activo: true },
    { id: 3, correo: 'entrenador@ximedgar.com', password: 'Entrenador2026!', nombre: 'Carlos Ruiz', rol: 'ENTRENADOR', activo: true },
    { id: 4, correo: 'sofia@email.com', password: 'Socio2026!', nombre: 'Sofía González', rol: 'SOCIO', activo: true, dni: '38245916', socioId: 1 },
  ],
  socios: [
    { id: 1, codigo: 'SOC-0248', nombre: 'Sofía González', dni: '38245916', correo: 'sofia@email.com', telefono: '999111222', planId: 1, estado: 'por_vencer', ultimaAsistencia: 'Hoy, 08:15', fechaAlta: '2025-03-10', activo: true },
    { id: 2, codigo: 'SOC-0182', nombre: 'Martín Fernández', dni: '32681450', correo: 'martin@email.com', telefono: '999333444', planId: 2, estado: 'activa', ultimaAsistencia: 'Hoy, 10:42', fechaAlta: '2024-11-02', activo: true },
    { id: 3, codigo: 'SOC-0361', nombre: 'Valentina López', dni: '40192783', correo: 'valen@email.com', telefono: '999555666', planId: 3, estado: 'activa', ultimaAsistencia: 'Hoy, 10:38', fechaAlta: '2025-01-15', activo: true },
    { id: 4, codigo: 'SOC-0094', nombre: 'Diego Ramírez', dni: '29543208', correo: 'diego@email.com', telefono: '999777888', planId: 1, estado: 'vencida', ultimaAsistencia: '14 oct, 18:20', fechaAlta: '2023-08-20', activo: true },
    { id: 5, codigo: 'SOC-0415', nombre: 'Camila Torres', dni: '41706532', correo: 'camila@email.com', telefono: '999000111', planId: 4, estado: 'activa', ultimaAsistencia: 'Hoy, 10:24', fechaAlta: '2025-06-01', activo: true },
    { id: 6, codigo: 'SOC-0276', nombre: 'Nicolás Pérez', dni: '35821604', correo: 'nico@email.com', telefono: '999222333', planId: 1, estado: 'por_vencer', ultimaAsistencia: 'Ayer, 19:05', fechaAlta: '2024-12-10', activo: true },
    { id: 7, codigo: 'SOC-0309', nombre: 'Julieta Acosta', dni: '39450127', correo: 'julieta@email.com', telefono: '999444555', planId: 3, estado: 'activa', ultimaAsistencia: 'Hoy, 09:56', fechaAlta: '2025-02-28', activo: true },
  ],
  planes: [
    { id: 1, nombre: 'Full mensual', precio: 18000, dias: 30, disciplina: 'Full', activo: true },
    { id: 2, nombre: 'Full trimestral', precio: 48000, dias: 90, disciplina: 'Full', activo: true },
    { id: 3, nombre: 'Musculación', precio: 14000, dias: 30, disciplina: 'Musculación', activo: true },
    { id: 4, nombre: 'Full anual', precio: 160000, dias: 365, disciplina: 'Full', activo: true },
  ],
  pagos: [
    { id: 1, hora: '10:35', comprobante: 'REC-00918', socio: 'Camila Torres', concepto: 'Cuota complementaria', medio: 'Tarjeta', importe: 10000, estado: 'Pagado' },
    { id: 2, hora: '10:20', comprobante: 'REC-00917', socio: 'Valentina López', concepto: 'Musculación', medio: 'Efectivo', importe: 14000, estado: 'Pagado' },
    { id: 3, hora: '10:05', comprobante: 'REC-00916', socio: 'Mateo Silva', concepto: 'Full mensual', medio: 'Transferencia', importe: 18000, estado: 'Pagado' },
    { id: 4, hora: '09:48', comprobante: 'REC-00915', socio: 'Ana Rojas', concepto: 'Full trimestral', medio: 'Tarjeta', importe: 48000, estado: 'Pagado' },
    { id: 5, hora: '09:25', comprobante: 'REC-00914', socio: 'Luis Medina', concepto: 'Full mensual', medio: 'Efectivo', importe: 18000, estado: 'Pagado' },
    { id: 6, hora: '09:10', comprobante: 'REC-00913', socio: 'Paula Díaz', concepto: 'Musculación', medio: 'Transferencia', importe: 14000, estado: 'Pagado' },
  ],
  clases: [
    { id: 1, nombre: 'Pilates Mat', dia: 'Lunes', hora: '08:00', entrenador: 'Carlos Ruiz', cupo: 12, inscritos: 9, aula: 'Aula 1' },
    { id: 2, nombre: 'HIIT', dia: 'Lunes', hora: '18:00', entrenador: 'Carlos Ruiz', cupo: 15, inscritos: 15, aula: 'Sala de pesas' },
    { id: 3, nombre: 'Yoga', dia: 'Martes', hora: '09:00', entrenador: 'Ana Torres', cupo: 10, inscritos: 7, aula: 'Aula 2' },
    { id: 4, nombre: 'Spinning', dia: 'Miércoles', hora: '19:00', entrenador: 'Carlos Ruiz', cupo: 20, inscritos: 14, aula: 'Aula 3' },
  ],
  entrenadores: [
    { id: 1, nombre: 'Carlos Ruiz', especialidad: 'HIIT / Pilates', clases: 4, activo: true },
    { id: 2, nombre: 'Ana Torres', especialidad: 'Yoga / Stretching', clases: 2, activo: true },
  ],
  alertas: [
    { id: 1, socio: 'Sofía González', plan: 'Full mensual', vence: '19 oct 2026', dias: 3 },
    { id: 2, socio: 'Nicolás Pérez', plan: 'Full mensual', vence: '20 oct 2026', dias: 4 },
    { id: 3, socio: 'Diego Ramírez', plan: 'Full mensual', vence: '01 oct 2026', dias: -15 },
  ],
  caja: {
    abierta: true,
    responsable: 'Lucía Martínez',
    saldoInicial: 20000,
    ingresosEfectivo: 124500,
    transferencias: 96000,
    tarjetas: 64000,
  },
}

function load() {
  if (typeof localStorage === 'undefined') return structuredClone(seed)
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  try {
    localStorage.setItem(KEY, JSON.stringify(seed))
  } catch {}
  return structuredClone(seed)
}

function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {}
}

export function getDb() {
  return load()
}

export function updateDb(mutator) {
  const db = load()
  mutator(db)
  save(db)
  return db
}

export function resetDb() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
  return load()
=======
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
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
}
