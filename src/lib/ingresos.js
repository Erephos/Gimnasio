import {
  MEMBER_STATUS,
  createInitialMembers,
  formatDate,
  getMembershipInfo,
} from './memberships.js'

// Perú usa UTC-5 todo el año (no tiene horario de verano).
export const LIMA_TIME_ZONE = 'America/Lima'
export const LIMA_UTC_OFFSET = '-05:00'
export const DNI_LENGTH = 8

const DNI_PATTERN = /^\d{8}$/
const DAY_IN_MS = 24 * 60 * 60 * 1000

const peruDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: LIMA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

const peruDateFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/**
 * Devuelve la fecha y hora actuales en la zona horaria de Perú.
 * `dateKey` es el día de Perú (YYYY-MM-DD) y `time` la hora exacta (HH:mm:ss).
 */
export function getPeruNow(date = new Date()) {
  const values = peruDateTimeFormatter
    .formatToParts(date)
    .filter((part) => part.type !== 'literal')
    .reduce((result, part) => ({ ...result, [part.type]: part.value }), {})

  const dateKey = `${values.year}-${values.month}-${values.day}`
  const time = `${values.hour}:${values.minute}:${values.second}`

  return {
    dateKey,
    time,
    shortTime: `${values.hour}:${values.minute}`,
    iso: `${dateKey}T${time}${LIMA_UTC_OFFSET}`,
  }
}

export function formatPeruDate(dateKey) {
  if (!dateKey) return '—'

  const formatted = peruDateFormatter.format(
    new Date(`${dateKey}T12:00:00Z`),
  )

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function normalizeDni(value) {
  return String(value ?? '').trim()
}

export function validateDni(rawValue) {
  const dni = normalizeDni(rawValue)

  if (!dni) {
    return 'El DNI es obligatorio. Ingresa los 8 dígitos del socio.'
  }

  if (!DNI_PATTERN.test(dni)) {
    return `El DNI debe tener exactamente ${DNI_LENGTH} dígitos numéricos (sin letras ni espacios).`
  }

  return ''
}

export function findMemberByDni(members, dni) {
  const normalizedDni = normalizeDni(dni)

  if (!normalizedDni) return null

  return (
    members.find(
      (member) => normalizeDni(member.dni) === normalizedDni,
    ) ?? null
  )
}

export function getCheckInsForDay(checkIns, dateKey) {
  return checkIns
    .filter((entry) => entry.dateKey === dateKey)
    .sort((a, b) => b.time.localeCompare(a.time))
}

function buildCheckIn(member, dateKey, time, planName) {
  return {
    id: `${dateKey}-${member.id}-${time}`,
    memberId: member.id,
    memberName: member.name,
    dni: member.dni,
    planName: planName ?? null,
    dateKey,
    time,
    iso: `${dateKey}T${time}${LIMA_UTC_OFFSET}`,
  }
}

/**
 * Registra el ingreso de un socio validando, en este orden:
 * formato de DNI (400), existencia (404), baja (403), membresía
 * inexistente o vencida (403) y duplicado del día (409).
 */
export function registerCheckIn({ members, checkIns, dni, now = new Date() }) {
  const normalizedDni = normalizeDni(dni)
  const dniError = validateDni(normalizedDni)

  if (dniError) {
    return {
      ok: false,
      reason: 'invalid-dni',
      code: 400,
      message: dniError,
    }
  }

  const member = findMemberByDni(members, normalizedDni)

  if (!member) {
    return {
      ok: false,
      reason: 'not-found',
      code: 404,
      message: `No existe ningún socio con el DNI "${normalizedDni}". Verifica el número e inténtalo de nuevo.`,
    }
  }

  if (member.status === MEMBER_STATUS.INACTIVE) {
    return {
      ok: false,
      reason: 'inactive',
      code: 403,
      member,
      message: `${member.name} está dado de baja, por lo que no puede ingresar al gimnasio. Contacta a administración si crees que es un error.`,
    }
  }

  const peruNow = getPeruNow(now)
  const membership = getMembershipInfo(member, peruNow.dateKey)

  if (membership.status === 'none') {
    return {
      ok: false,
      reason: 'no-membership',
      code: 403,
      member,
      membership,
      message: `${member.name} no tiene ninguna membresía registrada. Debe adquirir una membresía antes de ingresar.`,
    }
  }

  if (membership.status === 'expired') {
    return {
      ok: false,
      reason: 'expired',
      code: 403,
      member,
      membership,
      message: `La membresía de ${member.name} venció el ${formatDate(membership.endDate)}. No puede ingresar hasta que la renueve.`,
    }
  }

  const existingCheckIn = checkIns.find(
    (entry) =>
      entry.memberId === member.id && entry.dateKey === peruNow.dateKey,
  )

  if (existingCheckIn) {
    return {
      ok: false,
      reason: 'duplicate',
      code: 409,
      member,
      membership,
      message: `${member.name} ya registró su ingreso hoy a las ${existingCheckIn.time.slice(0, 5)}. Solo se permite un ingreso por socio al día.`,
    }
  }

  const record = buildCheckIn(
    member,
    peruNow.dateKey,
    peruNow.time,
    membership.plan?.name,
  )

  return {
    ok: true,
    reason: 'registered',
    code: 201,
    member,
    membership,
    record,
    message: `Ingreso registrado para ${member.name} a las ${peruNow.time} (hora de Perú). Membresía ${membership.plan?.name ?? 'vigente'} válida hasta el ${formatDate(membership.endDate)}.`,
  }
}

/**
 * Historial de demostración: dos ingresos de ayer. Sirven para comprobar
 * que la lista de hoy solo muestra los ingresos del día actual.
 */
export function createInitialCheckIns(now = new Date()) {
  const members = createInitialMembers()
  const yesterday = getPeruNow(new Date(now.getTime() - DAY_IN_MS))

  return [
    { memberId: 'H3', time: '07:12:00' },
    { memberId: 'H5', time: '19:05:00' },
  ]
    .map((seed) => {
      const member = members.find((item) => item.id === seed.memberId)

      if (!member) return null

      const membership = getMembershipInfo(member, yesterday.dateKey)

      return buildCheckIn(
        member,
        yesterday.dateKey,
        seed.time,
        membership.plan?.name,
      )
    })
    .filter(Boolean)
}
