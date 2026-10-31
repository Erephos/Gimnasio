import { MIN_PASSWORD_LENGTH } from '../config/constants.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase()

export function validateEmail(value) {
  const email = normalizeEmail(value)
  if (!email) return 'El correo es obligatorio.'
  if (email.length > 100) return 'El correo no puede superar 100 caracteres.'
  if (!EMAIL_PATTERN.test(email)) return 'Ingresa un correo válido.'
  return ''
}

export function validatePassword(value) {
  if (!value) return 'La contraseña es obligatoria.'
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }
  if (value.length > 100) return 'La contraseña no puede superar 100 caracteres.'
  return ''
}

export function validateDni(value) {
  const dni = String(value ?? '').trim()
  if (!dni) return 'El DNI es obligatorio.'
  if (!/^\d{8}$/.test(dni)) return 'El DNI debe tener exactamente 8 dígitos.'
  return ''
}

export function validatePhone(value, { required = false } = {}) {
  const phone = String(value ?? '').trim()
  if (!phone) return required ? 'El teléfono es obligatorio.' : ''
  if (!/^\d{9}$/.test(phone)) return 'El teléfono debe tener exactamente 9 dígitos.'
  return ''
}

export function validateName(value, label = 'El nombre') {
  const name = String(value ?? '').trim()
  if (!name) return `${label} es obligatorio.`
  if (name.length > 60) return `${label} no puede superar 60 caracteres.`
  return ''
}

// Quita los mensajes vacíos para saber rápido si el formulario es válido.
export function compactErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}
