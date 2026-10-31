// Sesión del usuario: el token JWT vive solo mientras la pestaña esté abierta.
const STORAGE_KEY = 'gimnasio.sesion'
const listeners = new Set()

function read() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

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
}
