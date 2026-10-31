import { API_URL, USE_MOCK } from '../config/constants.js'
import { mockRequest } from '../mock/handler.js'
import { HttpError } from '../mock/errors.js'
import { clearSession, getSession } from './session.js'

export class ApiError extends Error {
  constructor(status, message, errores = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errores = errores
  }
}

function buildUrl(path, params) {
  const url = `${API_URL}${path}`
  if (!params) return url
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  })
  const text = query.toString()
  return text ? `${url}?${text}` : url
}

async function parseBody(response) {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// Modo sin backend: responde desde la API simulada (src/mock) con el mismo formato.
async function requestMock(path, { method, body, params, auth }) {
  const token = auth ? getSession()?.token : null
  try {
    const { data } = await mockRequest({ method, path, params, body, token })
    return data
  } catch (error) {
    if (!(error instanceof HttpError)) throw error
    if (error.status === 401 && token) clearSession()
    throw new ApiError(error.status, error.mensaje, error.errores)
  }
}

// Cliente único para toda la API: agrega el token y normaliza los errores.
export async function request(path, { method = 'GET', body, params, auth = true, signal } = {}) {
  if (USE_MOCK) return requestMock(path, { method, body, params, auth })

  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = auth ? getSession()?.token : null
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.')
  }

  const data = await parseBody(response)
  if (response.ok) return data

  // Un 401 con token significa sesión vencida o cuenta modificada.
  if (response.status === 401 && token) clearSession()
  throw new ApiError(
    response.status,
    data?.mensaje ?? 'Ocurrió un error inesperado. Inténtalo más tarde.',
    data?.errores ?? {},
  )
}

export const get = (path, options) => request(path, { ...options, method: 'GET' })
export const post = (path, body, options) => request(path, { ...options, method: 'POST', body })
export const put = (path, body, options) => request(path, { ...options, method: 'PUT', body })
export const patch = (path, body, options) => request(path, { ...options, method: 'PATCH', body })
export const del = (path, options) => request(path, { ...options, method: 'DELETE' })

// Mensaje listo para mostrar al usuario a partir de cualquier error.
export function errorMessage(error) {
  if (error instanceof ApiError) {
    const details = Object.entries(error.errores ?? {})
      .filter(([key]) => key !== 'codigo')
      .map(([, message]) => message)
    return details.length > 0 ? `${error.message} ${details.join(' ')}` : error.message
  }
  return 'Ocurrió un error inesperado. Inténtalo más tarde.'
}
