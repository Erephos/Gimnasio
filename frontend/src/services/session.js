<<<<<<< HEAD
const SESSION_KEY = 'ximedgar.gym.session'

let listeners = new Set()
let cached = null
let cachedRaw = null

function read() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw === cachedRaw) return cached
    cachedRaw = raw
    cached = raw ? JSON.parse(raw) : null
    return cached
  } catch {
    cachedRaw = null
    cached = null
=======
// Sesión del usuario: el token JWT vive solo mientras la pestaña esté abierta.
const STORAGE_KEY = 'gimnasio.sesion'
const listeners = new Set()

function read() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
    return null
  }
}

<<<<<<< HEAD
export function getSession() {
  return read()
}

export function setSession(session) {
  const raw = JSON.stringify(session)
  localStorage.setItem(SESSION_KEY, raw)
  cachedRaw = raw
  cached = session
  listeners.forEach((fn) => fn())
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  cachedRaw = null
  cached = null
  listeners.forEach((fn) => fn())
}

export function subscribeSession(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
=======
let current = read()

export const getSession = () => current

export function setSession(session) {
  current = session
  try {
    if (session) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Si el navegador bloquea el almacenamiento, la sesión dura hasta recargar.
  }
  listeners.forEach((listener) => listener(current))
}

export const clearSession = () => setSession(null)

export function subscribeSession(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
}
