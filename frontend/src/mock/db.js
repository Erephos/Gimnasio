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
}
