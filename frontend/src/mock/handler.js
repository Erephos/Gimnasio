import { ROLES, isStaff } from '../config/roles.js'
import { HttpError, created, ok } from './errors.js'
import { addDays, getDb, nextId, nowIso, saveDb, todayISO } from './db.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const METODOS = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']
const GENEROS = ['MASCULINO', 'FEMENINO']

const routes = []
function on(method, pattern, handler, options = {}) {
  routes.push({ method, re: new RegExp(`^${pattern}$`), handler, auth: true, roles: null, ...options })
}

// ---------- utilidades ----------
const norm = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const num = (value) => Number(value)
const bool = (value) => value === true || value === 'true'

function paginate(list, { page = 0, size = 10 } = {}) {
  const p = Math.max(0, Number(page) || 0)
  const s = Math.max(1, Number(size) || 10)
  const totalElements = list.length
  const totalPages = Math.ceil(totalElements / s)
  return {
    content: list.slice(p * s, p * s + s),
    number: p,
    size: s,
    totalElements,
    totalPages,
  }
}

function audit(db, user, accion, entidad, entidadId, detalle) {
  db.auditoria.unshift({
    id: nextId(db, 'auditoria'),
    fecha: nowIso(),
    usuarioCorreo: user?.correo ?? null,
    accion,
    entidad,
    entidadId,
    detalle,
  })
}

function userView(u) {
  return {
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    nombreCompleto: `${u.nombre} ${u.apellido}`,
    correo: u.correo,
    rol: u.rol,
    activo: u.activo,
    especialidad: u.especialidad,
  }
}

function socioView(s) {
  return {
    id: s.id,
    usuarioId: s.usuarioId,
    nombre: s.nombre,
    apellido: s.apellido,
    nombreCompleto: `${s.nombre} ${s.apellido}`,
    dni: s.dni,
    correo: s.correo,
    telefono: s.telefono,
    genero: s.genero,
    direccion: s.direccion,
    contactoEmergencia: s.contactoEmergencia,
    activo: s.activo,
    creadoEn: s.creadoEn,
  }
}

function membresiaView(m) {
  const today = todayISO()
  return {
    ...m,
    estado: m.fechaFin > today ? 'VIGENTE' : 'VENCIDA',
  }
}

const pagoView = (p) => ({ ...p })

function claseView(db, c) {
  const entrenador = db.usuarios.find((u) => u.id === c.entrenadorId)
  const reservasActivas = db.reservas.filter(
    (r) => r.claseId === c.id && (r.estado === 'RESERVADA' || r.estado === 'ASISTIO'),
  ).length
  return {
    ...c,
    entrenadorNombre: entrenador ? `${entrenador.nombre} ${entrenador.apellido}` : '—',
    reservasActivas,
    cuposDisponibles: Math.max(0, c.aforo - reservasActivas),
  }
}

function reservaView(db, r) {
  const clase = db.clases.find((c) => c.id === r.claseId)
  const socio = db.socios.find((s) => s.id === r.socioId)
  return {
    ...r,
    disciplina: clase?.disciplina ?? '—',
    inicio: clase?.inicio ?? null,
    aula: clase?.aula ?? null,
    socioNombre: socio ? `${socio.nombre} ${socio.apellido}` : '—',
  }
}

function currentUser(db, token) {
  if (!token) return null
  const id = Number(String(token).replace('mock-', ''))
  return db.usuarios.find((u) => u.id === id && u.activo) ?? null
}

function socioOfUser(db, user) {
  return db.socios.find((s) => s.usuarioId === user.id) ?? null
}

function vigenteMembresia(db, socioId) {
  const today = todayISO()
  return db.membresias
    .filter((m) => m.socioId === socioId && m.fechaInicio <= today && m.fechaFin > today)
    .sort((a, b) => (a.fechaFin < b.fechaFin ? 1 : -1))[0] ?? null
}

function validateDni(dni) {
  return /^\d{8}$/.test(String(dni ?? '').trim())
}

// ---------- autenticación ----------
on('POST', '/auth/login', ({ body, db }) => {
  const correo = norm(body.correo)
  const u = db.usuarios.find((x) => norm(x.correo) === correo && x.password === body.password)
  if (!u) throw new HttpError(401, 'Correo o contraseña incorrectos.')
  if (!u.activo) throw new HttpError(403, 'Tu cuenta está inactiva. Contacta a recepción.')
  return ok({ token: `mock-${u.id}`, usuarioId: u.id, nombre: `${u.nombre} ${u.apellido}`, rol: u.rol })
}, { auth: false })

on('POST', '/auth/recuperar', () => ok({ mensaje: 'Si el correo existe, te enviaremos instrucciones.' }), { auth: false })
on('POST', '/auth/restablecer', () => ok(null), { auth: false })

on('PATCH', '/usuarios/mi-password', ({ body, user, db }) => {
  if (user.password !== body.passwordActual) {
    throw new HttpError(400, 'La contraseña actual no es correcta.', { passwordActual: 'Contraseña incorrecta.' })
  }
  user.password = body.passwordNueva
  audit(db, user, 'CAMBIO_PASSWORD', 'USUARIO', user.id, 'El usuario cambió su contraseña.')
  return ok(null)
})

// ---------- usuarios y entrenadores (administración) ----------
on('GET', '/usuarios', ({ params, db }) => {
  let list = db.usuarios.filter((u) => u.rol !== ROLES.SOCIO)
  if (params.rol) list = list.filter((u) => u.rol === params.rol)
  return ok(paginate(list.map(userView), params))
}, { roles: [ROLES.ADMIN] })

on('POST', '/usuarios', ({ body, db, user }) => {
  if (db.usuarios.some((u) => norm(u.correo) === norm(body.correo))) {
    throw new HttpError(409, 'Ya existe una cuenta con este correo.')
  }
  const nuevo = {
    id: nextId(db, 'usuarios'), nombre: body.nombre, apellido: body.apellido, correo: body.correo,
    password: body.password, rol: body.rol, activo: true, especialidad: null,
  }
  db.usuarios.push(nuevo)
  audit(db, user, 'CREAR', 'USUARIO', nuevo.id, `Cuenta creada con rol ${nuevo.rol}.`)
  return created(userView(nuevo))
}, { roles: [ROLES.ADMIN] })

on('PATCH', '/usuarios/(\\d+)/rol', ({ match, body, db, user }) => {
  const target = db.usuarios.find((u) => u.id === num(match[1]))
  if (!target) throw new HttpError(404, 'No se encontró el usuario.')
  if (target.rol === ROLES.SOCIO) throw new HttpError(400, 'Solo se puede cambiar el rol de administradores y recepcionistas.')
  target.rol = body.rol
  audit(db, user, 'CAMBIAR_ROL', 'USUARIO', target.id, `Nuevo rol: ${body.rol}.`)
  return ok(userView(target))
}, { roles: [ROLES.ADMIN] })

on('PATCH', '/usuarios/(\\d+)/estado', ({ match, params, db, user }) => {
  const target = db.usuarios.find((u) => u.id === num(match[1]))
  if (!target) throw new HttpError(404, 'No se encontró el usuario.')
  target.activo = bool(params.activo)
  audit(db, user, 'CAMBIAR_ESTADO', 'USUARIO', target.id, target.activo ? 'Activado.' : 'Desactivado.')
  return ok(userView(target))
}, { roles: [ROLES.ADMIN] })

on('GET', '/entrenadores', ({ params, db }) => {
  const list = db.usuarios.filter((u) => u.rol === ROLES.ENTRENADOR).map(userView)
  return ok(paginate(list, params))
})

on('POST', '/entrenadores', ({ body, db, user }) => {
  if (db.usuarios.some((u) => norm(u.correo) === norm(body.correo))) {
    throw new HttpError(409, 'Ya existe una cuenta con este correo.')
  }
  const nuevo = {
    id: nextId(db, 'usuarios'), nombre: body.nombre, apellido: body.apellido, correo: body.correo,
    password: body.password, rol: ROLES.ENTRENADOR, activo: true, especialidad: body.especialidad ?? null,
  }
  db.usuarios.push(nuevo)
  audit(db, user, 'CREAR', 'ENTRENADOR', nuevo.id, `Entrenador ${nuevo.nombre} ${nuevo.apellido}.`)
  return created(userView(nuevo))
}, { roles: [ROLES.ADMIN] })

// ---------- socios ----------
// Registro público (sin sesión) o alta del personal (con sesión).
on('POST', '/socios', ({ body, db, user }) => {
  const errores = {}
  if (!body.nombre?.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (!body.apellido?.trim()) errores.apellido = 'El apellido es obligatorio.'
  if (!EMAIL_RE.test(body.correo ?? '')) errores.correo = 'Ingresa un correo válido.'
  if (!body.password || body.password.length < 8) errores.password = 'La contraseña debe tener al menos 8 caracteres.'
  if (!validateDni(body.dni)) errores.dni = 'El DNI debe tener 8 dígitos.'
  if (!GENEROS.includes(body.genero)) errores.genero = 'Selecciona un género válido.'
  if (Object.keys(errores).length) throw new HttpError(400, 'Revisa los campos marcados.', errores)

  if (db.usuarios.some((u) => norm(u.correo) === norm(body.correo))) {
    throw new HttpError(409, 'Ya existe una cuenta con este correo.', { correo: 'Este correo ya está registrado.' })
  }
  if (db.socios.some((s) => s.dni === body.dni.trim())) {
    throw new HttpError(409, 'Ya existe un socio con este DNI.', { dni: 'Este DNI ya está registrado.' })
  }

  const usuario = {
    id: nextId(db, 'usuarios'), nombre: body.nombre.trim(), apellido: body.apellido.trim(),
    correo: body.correo.trim().toLowerCase(), password: body.password, rol: ROLES.SOCIO, activo: true, especialidad: null,
  }
  db.usuarios.push(usuario)
  const socio = {
    id: nextId(db, 'socios'), usuarioId: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido,
    dni: body.dni.trim(), correo: usuario.correo, telefono: body.telefono ?? null, genero: body.genero,
    direccion: body.direccion ?? null, contactoEmergencia: body.contactoEmergencia ?? null,
    activo: true, creadoEn: nowIso(),
  }
  db.socios.push(socio)
  if (user) audit(db, user, 'CREAR', 'SOCIO', socio.id, `Alta de socio ${socio.nombre} ${socio.apellido}.`)
  return created(socioView(socio))
}, { auth: false })

on('GET', '/socios', ({ params, db }) => {
  const q = norm(params.q)
  let list = [...db.socios].sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1))
  if (params.activo === 'true' || params.activo === 'false') {
    list = list.filter((s) => s.activo === (params.activo === 'true'))
  }
  if (q) {
    list = list.filter((s) =>
      norm(`${s.nombre} ${s.apellido}`).includes(q) || norm(s.dni).includes(q) || norm(s.correo).includes(q),
    )
  }
  return ok(paginate(list.map(socioView), params))
}, { roles: [ROLES.ADMIN, ROLES.RECEPCION] })

on('GET', '/socios/mi-perfil', ({ user, db }) => {
  const socio = socioOfUser(db, user)
  if (!socio) throw new HttpError(404, 'Tu usuario no tiene un perfil de socio.')
  return ok(socioView(socio))
})

on('GET', '/socios/(\\d+)', ({ match, user, db }) => {
  const socio = db.socios.find((s) => s.id === num(match[1]))
  if (!socio) throw new HttpError(404, 'No se encontró el socio.')
  if (!isStaff(user.rol) && socio.usuarioId !== user.id) throw new HttpError(403, 'No puedes ver este perfil.')
  return ok(socioView(socio))
})

on('PUT', '/socios/(\\d+)', ({ match, body, user, db }) => {
  const socio = db.socios.find((s) => s.id === num(match[1]))
  if (!socio) throw new HttpError(404, 'No se encontró el socio.')
  const esPropio = socio.usuarioId === user.id
  if (!isStaff(user.rol) && !esPropio) throw new HttpError(403, 'No puedes modificar este perfil.')

  const errores = {}
  const correo = (body.correo ?? socio.correo).trim().toLowerCase()
  if (!EMAIL_RE.test(correo)) errores.correo = 'Ingresa un correo válido.'
  else if (db.usuarios.some((u) => u.id !== socio.usuarioId && norm(u.correo) === correo)) {
    errores.correo = 'Este correo ya pertenece a otra cuenta.'
  }
  let dni = socio.dni
  if (body.dni !== undefined && body.dni !== socio.dni) {
    if (user.rol !== ROLES.ADMIN) throw new HttpError(403, 'Solo el administrador puede corregir el DNI.')
    if (!validateDni(body.dni)) errores.dni = 'El DNI debe tener 8 dígitos.'
    else if (db.socios.some((s) => s.id !== socio.id && s.dni === body.dni)) errores.dni = 'Este DNI ya está registrado.'
    else dni = body.dni
  }
  if (Object.keys(errores).length) throw new HttpError(400, 'Revisa los campos marcados.', errores)

  Object.assign(socio, {
    nombre: body.nombre ?? socio.nombre,
    apellido: body.apellido ?? socio.apellido,
    correo,
    dni,
    telefono: body.telefono ?? null,
    genero: body.genero ?? socio.genero,
    direccion: body.direccion ?? null,
    contactoEmergencia: body.contactoEmergencia ?? null,
  })
  const usuario = db.usuarios.find((u) => u.id === socio.usuarioId)
  if (usuario) Object.assign(usuario, { correo, nombre: socio.nombre, apellido: socio.apellido })
  audit(db, user, 'ACTUALIZAR', 'SOCIO', socio.id, 'Datos del socio actualizados.')
  return ok(socioView(socio))
})

on('DELETE', '/socios/(\\d+)', ({ match, user, db }) => {
  const socio = db.socios.find((s) => s.id === num(match[1]))
  if (!socio) throw new HttpError(404, 'No se encontró el socio.')
  if (!socio.activo) throw new HttpError(409, 'El socio ya se encuentra dado de baja.')
  socio.activo = false
  const usuario = db.usuarios.find((u) => u.id === socio.usuarioId)
  if (usuario) usuario.activo = false
  audit(db, user, 'DESACTIVAR', 'SOCIO', socio.id, 'Baja lógica del socio.')
  return ok(null)
}, { roles: [ROLES.ADMIN] })

// ---------- planes ----------
on('GET', '/planes', ({ db }) => ok(db.planes.filter((p) => p.activo)))
on('GET', '/planes/todos', ({ db }) => ok(db.planes), { roles: [ROLES.ADMIN] })

on('POST', '/planes', ({ body, db, user }) => {
  const plan = {
    id: nextId(db, 'planes'), nombre: body.nombre, precio: num(body.precio),
    duracionDias: num(body.duracionDias), activo: true, descripcion: null,
  }
  db.planes.push(plan)
  audit(db, user, 'CREAR', 'PLAN', plan.id, `Plan ${plan.nombre}.`)
  return created(plan)
}, { roles: [ROLES.ADMIN] })

on('PUT', '/planes/(\\d+)', ({ match, body, db, user }) => {
  const plan = db.planes.find((p) => p.id === num(match[1]))
  if (!plan) throw new HttpError(404, 'No se encontró el plan.')
  Object.assign(plan, { nombre: body.nombre, precio: num(body.precio), duracionDias: num(body.duracionDias) })
  audit(db, user, 'ACTUALIZAR', 'PLAN', plan.id, `Plan ${plan.nombre}.`)
  return ok(plan)
}, { roles: [ROLES.ADMIN] })

on('PATCH', '/planes/(\\d+)/estado', ({ match, params, db, user }) => {
  const plan = db.planes.find((p) => p.id === num(match[1]))
  if (!plan) throw new HttpError(404, 'No se encontró el plan.')
  plan.activo = bool(params.activo)
  audit(db, user, 'CAMBIAR_ESTADO', 'PLAN', plan.id, plan.activo ? 'Activado.' : 'Desactivado.')
  return ok(plan)
}, { roles: [ROLES.ADMIN] })

// ---------- membresías ----------
on('POST', '/membresias', ({ body, db, user }) => {
  const socio = db.socios.find((s) => s.id === num(body.socioId))
  if (!socio) throw new HttpError(404, 'No se encontró el socio.')
  if (!socio.activo) throw new HttpError(403, `El socio está dado de baja (${socio.id}) y no puede recibir una membresía.`)
  const plan = db.planes.find((p) => p.id === num(body.planId))
  if (!plan || !plan.activo) throw new HttpError(400, 'El plan seleccionado no existe o no está activo.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.fechaInicio ?? '')) throw new HttpError(400, 'Selecciona una fecha de inicio válida.')

  const vigente = vigenteMembresia(db, socio.id)
  if (vigente) {
    throw new HttpError(409, `El socio ya tiene una membresía activa (${vigente.planNombre}) hasta el ${vigente.fechaFin}. Debe esperar a que venza.`)
  }
  const membresia = {
    id: nextId(db, 'membresias'), socioId: socio.id, planId: plan.id, planNombre: plan.nombre,
    precioPagado: plan.precio, fechaInicio: body.fechaInicio, fechaFin: addDays(body.fechaInicio, plan.duracionDias),
  }
  db.membresias.push(membresia)
  audit(db, user, 'ASIGNAR_MEMBRESIA', 'MEMBRESIA', membresia.id, `${plan.nombre} para socio ${socio.id}.`)
  return created(membresiaView(membresia))
}, { roles: [ROLES.ADMIN, ROLES.RECEPCION] })

const sortMemb = (list) => [...list].sort((a, b) => (a.fechaInicio < b.fechaInicio ? 1 : -1))

on('GET', '/membresias/socio/(\\d+)/vigente', ({ match, db }) => {
  const m = vigenteMembresia(db, num(match[1]))
  if (!m) throw new HttpError(404, 'El socio no tiene una membresía vigente.')
  return ok(membresiaView(m))
}, { roles: [ROLES.ADMIN, ROLES.RECEPCION] })

on('GET', '/membresias/socio/(\\d+)', ({ match, db }) =>
  ok(sortMemb(db.membresias.filter((m) => m.socioId === num(match[1]))).map(membresiaView)),
{ roles: [ROLES.ADMIN, ROLES.RECEPCION] })

on('GET', '/membresias/mia', ({ user, db }) => {
  const socio = socioOfUser(db, user)
  if (!socio) return ok([])
  return ok(sortMemb(db.membresias.filter((m) => m.socioId === socio.id)).map(membresiaView))
})

on('GET', '/membresias/mia/vigente', ({ user, db }) => {
  const socio = socioOfUser(db, user)
  const m = socio && vigenteMembresia(db, socio.id)
  if (!m) throw new HttpError(404, 'No tienes una membresía vigente.')
  return ok(membresiaView(m))
})

on('GET', '/membresias/alertas', ({ params, db }) => {
  const dias = Number(params.dias ?? 7)
  const today = todayISO()
  const alertas = db.membresias
    .filter((m) => m.fechaFin > today)
    .map((m) => {
      const socio = db.socios.find((s) => s.id === m.socioId)
      const diasRestantes = Math.round((Date.parse(`${m.fechaFin}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000)
      return {
        membresiaId: m.id,
        socioNombre: socio ? `${socio.nombre} ${socio.apellido}` : '—',
        dni: socio?.dni ?? '—',
        correo: socio?.correo ?? '—',
        plan: m.planNombre,
        fechaFin: m.fechaFin,
        diasRestantes,
        estado: 'POR_VENCER',
      }
    })
    .filter((a) => a.diasRestantes <= dias)
    .sort((a, b) => a.diasRestantes - b.diasRestantes)
  return ok(alertas)
}, { roles: [ROLES.ADMIN, ROLES.RECEPCION] })

// ---------- pagos ----------
on('POST', '/pagos', ({ body, db, user }) => {
  const membresia = db.membresias.find((m) => m.id === num(body.membresiaId))
  if (!membresia) throw new HttpError(404, 'No se encontró la membresía.')
  const monto = Number(Number(body.monto).toFixed(2))
  if (!(monto > 0)) throw new HttpError(400, 'El monto debe ser mayor que cero.')
  if (!METODOS.includes(body.metodo)) throw new HttpError(400, 'Selecciona un método de pago válido.')

  const pagado = db.pagos
    .filter((p) => p.membresiaId === membresia.id && p.estado === 'REGISTRADO')
    .reduce((total, p) => total + p.monto, 0)
  const saldo = Math.round((membresia.precioPagado - pagado) * 100) / 100
  if (monto > saldo + 0.00001) throw new HttpError(400, `El monto excede el saldo pendiente (${saldo.toFixed(2)}).`)

  const socio = db.socios.find((s) => s.id === membresia.socioId)
  const pago = {
    id: nextId(db, 'pagos'), socioId: membresia.socioId,
    socioNombre: socio ? `${socio.nombre} ${socio.apellido}` : '—',
    membresiaId: membresia.id, monto, metodo: body.metodo, fechaPago: todayISO(),
    estado: 'REGISTRADO', registradoPor: `${user.nombre} ${user.apellido}`, motivoAnulacion: null,
  }
  db.pagos.push(pago)
  audit(db, user, 'REGISTRAR_PAGO', 'PAGO', pago.id, `Pago de ${monto.toFixed(2)} para membresía ${membresia.id}.`)
  return created(pagoView(pago))
}, { roles: [ROLES.ADMIN, ROLES.RECEPCION] })

on('GET', '/pagos', ({ params, db }) => {
  const q = norm(params.q)
  let list = [...db.pagos].sort((a, b) => (a.fechaPago < b.fechaPago ? 1 : a.fechaPago > b.fechaPago ? -1 : b.id - a.id))
  if (params.socioId) list = list.filter((p) => p.socioId === num(params.socioId))
  if (params.estado) list = list.filter((p) => p.estado === params.estado)
  if (q) list = list.filter((p) => norm(p.socioNombre).includes(q))
  return ok(paginate(list.map(pagoView), params))
}, { roles: [ROLES.ADMIN, ROLES.RECEPCION] })

on('GET', '/pagos/membresia/(\\d+)', ({ match, db }) =>
  ok(db.pagos.filter((p) => p.membresiaId === num(match[1])).map(pagoView)),
{ roles: [ROLES.ADMIN, ROLES.RECEPCION] })

on('PATCH', '/pagos/(\\d+)/anular', ({ match, body, db, user }) => {
  const pago = db.pagos.find((p) => p.id === num(match[1]))
  if (!pago) throw new HttpError(404, 'No se encontró el pago.')
  if (pago.estado === 'ANULADO') throw new HttpError(409, 'El pago ya está anulado.')
  if (!body.motivo?.trim()) throw new HttpError(400, 'Indica el motivo de la anulación.')
  Object.assign(pago, { estado: 'ANULADO', motivoAnulacion: body.motivo.trim() })
  audit(db, user, 'ANULAR_PAGO', 'PAGO', pago.id, body.motivo.trim())
  return ok(pagoView(pago))
}, { roles: [ROLES.ADMIN] })

// ---------- asistencias (ingresos) ----------
on('POST', '/asistencias', ({ body, db }) => {
  const dni = String(body.dni ?? '').trim()
  const socio = db.socios.find((s) => s.dni === dni)
  if (!socio) throw new HttpError(404, 'No existe un socio con ese DNI.')
  if (!socio.activo) throw new HttpError(403, 'El socio está dado de baja y no puede ingresar.')
  const vigente = vigenteMembresia(db, socio.id)
  if (!vigente) throw new HttpError(403, 'El socio no tiene una membresía vigente.')

  const asistencia = {
    id: nextId(db, 'asistencias'), socioId: socio.id, socioNombre: `${socio.nombre} ${socio.apellido}`,
    dni, fecha: todayISO(), horaEntrada: nowIso(), membresiaVigenteHasta: vigente.fechaFin,
  }
  db.asistencias.push(asistencia)
  return created(asistencia)
}, { roles: [ROLES.ADMIN, ROLES.RECEPCION] })

on('GET', '/asistencias', ({ params, db }) => {
  const q = norm(params.q)
  let list = [...db.asistencias].sort((a, b) => (a.horaEntrada < b.horaEntrada ? 1 : -1))
  if (params.fecha) list = list.filter((a) => a.fecha === params.fecha)
  if (q) list = list.filter((a) => norm(a.socioNombre).includes(q) || norm(a.dni).includes(q))
  return ok(paginate(list, params))
}, { roles: [ROLES.ADMIN, ROLES.RECEPCION] })

on('GET', '/asistencias/socio/(\\d+)', ({ match, params, db }) => {
  const list = db.asistencias.filter((a) => a.socioId === num(match[1])).sort((a, b) => (a.horaEntrada < b.horaEntrada ? 1 : -1))
  return ok(paginate(list, params))
})

// ---------- clases y reservas ----------
on('GET', '/clases', ({ db }) =>
  ok([...db.clases].sort((a, b) => (a.inicio < b.inicio ? -1 : 1)).map((c) => claseView(db, c))),
)

on('POST', '/clases', ({ body, db, user }) => {
  const inicio = new Date(body.inicio)
  const fin = new Date(body.fin)
  if (!(inicio < fin)) throw new HttpError(400, 'La hora de fin debe ser posterior a la de inicio.')
  const entrenador = db.usuarios.find((u) => u.id === num(body.entrenadorId) && u.rol === ROLES.ENTRENADOR)
  if (!entrenador) throw new HttpError(400, 'Selecciona un entrenador válido.')
  if (!(num(body.aforo) > 0)) throw new HttpError(400, 'El aforo debe ser mayor que cero.')

  const clase = {
    id: nextId(db, 'clases'), disciplina: body.disciplina, entrenadorId: entrenador.id, aula: body.aula,
    inicio: body.inicio, fin: body.fin, aforo: num(body.aforo), estado: 'ACTIVA',
  }
  db.clases.push(clase)
  audit(db, user, 'CREAR', 'CLASE', clase.id, `${clase.disciplina} en ${clase.aula}.`)
  return created(claseView(db, clase))
}, { roles: [ROLES.ADMIN, ROLES.RECEPCION] })

on('PATCH', '/clases/(\\d+)/cancelar', ({ match, db, user }) => {
  const clase = db.clases.find((c) => c.id === num(match[1]))
  if (!clase) throw new HttpError(404, 'No se encontró la clase.')
  if (clase.estado === 'CANCELADA') throw new HttpError(409, 'La clase ya está cancelada.')
  clase.estado = 'CANCELADA'
  audit(db, user, 'CANCELAR', 'CLASE', clase.id, `${clase.disciplina} cancelada.`)
  return ok(claseView(db, clase))
}, { roles: [ROLES.ADMIN, ROLES.RECEPCION] })

on('POST', '/reservas', ({ body, user, db }) => {
  const socio = socioOfUser(db, user)
  if (!socio) throw new HttpError(403, 'Solo los socios pueden reservar clases.')
  const clase = db.clases.find((c) => c.id === num(body.claseId))
  if (!clase) throw new HttpError(404, 'No se encontró la clase.')
  if (clase.estado !== 'ACTIVA') throw new HttpError(409, 'La clase no está disponible.')
  if (db.reservas.some((r) => r.claseId === clase.id && r.socioId === socio.id && (r.estado === 'RESERVADA' || r.estado === 'ASISTIO'))) {
    throw new HttpError(409, 'Ya tienes una reserva para esta clase.')
  }
  if (claseView(db, clase).cuposDisponibles <= 0) throw new HttpError(409, 'No quedan cupos para esta clase.')

  const reserva = {
    id: nextId(db, 'reservas'), claseId: clase.id, socioId: socio.id, estado: 'RESERVADA',
    creadaEn: nowIso(), asistioEn: null,
  }
  db.reservas.push(reserva)
  return created(reservaView(db, reserva))
})

on('GET', '/reservas/mias', ({ user, db }) => {
  const socio = socioOfUser(db, user)
  if (!socio) return ok([])
  return ok(db.reservas.filter((r) => r.socioId === socio.id).map((r) => reservaView(db, r)))
})

on('GET', '/reservas/clase/(\\d+)', ({ match, db }) =>
  ok(db.reservas.filter((r) => r.claseId === num(match[1])).map((r) => reservaView(db, r))),
{ roles: [ROLES.ADMIN, ROLES.RECEPCION, ROLES.ENTRENADOR] })

on('PATCH', '/reservas/(\\d+)/cancelar', ({ match, user, db }) => {
  const reserva = db.reservas.find((r) => r.id === num(match[1]))
  if (!reserva) throw new HttpError(404, 'No se encontró la reserva.')
  const socio = socioOfUser(db, user)
  if (!isStaff(user.rol) && socio?.id !== reserva.socioId) throw new HttpError(403, 'No puedes cancelar esta reserva.')
  if (reserva.estado !== 'RESERVADA') throw new HttpError(409, 'Solo se pueden cancelar reservas activas.')
  reserva.estado = 'CANCELADA'
  return ok(reservaView(db, reserva))
})

on('PATCH', '/reservas/(\\d+)/asistencia', ({ match, db }) => {
  const reserva = db.reservas.find((r) => r.id === num(match[1]))
  if (!reserva) throw new HttpError(404, 'No se encontró la reserva.')
  if (reserva.estado !== 'RESERVADA') throw new HttpError(409, 'Solo se puede marcar asistencia a reservas activas.')
  reserva.estado = 'ASISTIO'
  reserva.asistioEn = nowIso()
  return ok(reservaView(db, reserva))
}, { roles: [ROLES.ADMIN, ROLES.RECEPCION, ROLES.ENTRENADOR] })

// ---------- reportes y auditoría ----------
on('GET', '/reportes/resumen', ({ params, db }) => {
  const today = todayISO()
  const desde = params.desde || today
  const hasta = params.hasta || today
  const enRango = (fecha) => fecha >= desde && fecha <= hasta
  const pagosRango = db.pagos.filter((p) => p.estado === 'REGISTRADO' && enRango(p.fechaPago))
  return ok({
    desde,
    hasta,
    asistencias: db.asistencias.filter((a) => enRango(a.fecha)).length,
    pagosRegistrados: pagosRango.length,
    ingresosRegistrados: Math.round(pagosRango.reduce((t, p) => t + p.monto, 0) * 100) / 100,
    sociosNuevos: db.socios.filter((s) => enRango(s.creadoEn.slice(0, 10))).length,
    membresiasVigentes: db.membresias.filter((m) => m.fechaInicio <= hasta && m.fechaFin > hasta).length,
    membresiasVencidas: db.membresias.filter((m) => m.fechaFin <= hasta && enRango(m.fechaFin)).length,
  })
}, { roles: [ROLES.ADMIN, ROLES.RECEPCION] })

on('GET', '/auditoria', ({ params, db }) => ok(paginate(db.auditoria, params)), { roles: [ROLES.ADMIN] })

// ---------- punto de entrada ----------
export async function mockRequest({ method, path, params, body, token }) {
  await new Promise((resolve) => setTimeout(resolve, 200))

  const db = getDb()
  const route = routes.find((r) => r.method === method && r.re.test(path))
  if (!route) throw new HttpError(404, 'Acción no disponible en el modo sin backend.')

  const match = path.match(route.re)
  const user = currentUser(db, token)
  if (route.auth && !user) throw new HttpError(401, 'Tu sesión no es válida. Inicia sesión de nuevo.')
  if (route.roles && !route.roles.includes(user.rol)) {
    throw new HttpError(403, 'No tienes permisos para realizar esta acción.')
  }

  const result = route.handler({ match, params: params ?? {}, body: body ?? {}, user, db })
  saveDb()
  return result
}
