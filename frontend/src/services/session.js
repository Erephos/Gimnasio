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
    return null
  }
}

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
}
