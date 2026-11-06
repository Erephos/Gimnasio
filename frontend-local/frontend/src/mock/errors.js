// Error HTTP simulado. api.js lo convierte en ApiError para que la UI lo trate igual que una respuesta real.
export class HttpError extends Error {
  constructor(status, mensaje, errores = {}) {
    super(mensaje)
    this.status = status
    this.mensaje = mensaje
    this.errores = errores
  }
}

export const ok = (data) => ({ status: 200, data })
export const created = (data) => ({ status: 201, data })
