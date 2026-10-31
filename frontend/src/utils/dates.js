import { LIMA_TIME_ZONE } from '../config/constants.js'

// Marca de tiempo actual (en milisegundos).
export const nowMs = () => Date.now()

// Fecha de hoy en Lima como AAAA-MM-DD.
export function todayLima(now = new Date()) {
  return now.toLocaleDateString('en-CA', { timeZone: LIMA_TIME_ZONE })
}

// La API puede devolver una fecha pura o un timestamp ISO; se normaliza a AAAA-MM-DD.
export function toDateKey(value) {
  const text = String(value ?? '')
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : ''
}

export function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function formatDate(value) {
  const key = toDateKey(value)
  if (!key) return '—'
  const [year, month, day] = key.split('-')
  return `${day}/${month}/${year}`
}

export function formatDateLong(value) {
  const key = toDateKey(value)
  if (!key) return '—'
  return new Date(`${key}T12:00:00.000Z`).toLocaleDateString('es-PE', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTime(iso, withSeconds = false) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: false,
  })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Lima no usa horario de verano: siempre es UTC-5.
export function limaLocalToIso(localValue) {
  return localValue ? `${localValue}:00-05:00` : ''
}

// Una membresía cubre [fechaInicio, fechaFin): la fecha de fin es exclusiva.
export function isMembershipCurrent(membership, today = todayLima()) {
  if (!membership) return false
  const start = toDateKey(membership.fechaInicio)
  const end = toDateKey(membership.fechaFin)
  return Boolean(start && end && start <= today && today < end)
}

export function pickCurrentMembership(list, today = todayLima()) {
  return list.find((item) => isMembershipCurrent(item, today)) ?? null
}
