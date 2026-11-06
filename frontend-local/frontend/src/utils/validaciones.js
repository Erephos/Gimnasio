import { validateDni, validateEmail } from './validators.js'

export const esDniValido = (value) => !validateDni(value)

export const esCorreoValido = (value) => !validateEmail(value)

export const esClaveValida = (value) => typeof value === 'string' && value.length >= 12

export function validarCamposObligatorios(datos) {
  const campos = ['nombre', 'apellido', 'dni', 'correo', 'clave']
  const camposFaltantes = campos.filter((campo) => !String(datos?.[campo] ?? '').trim())

  return {
    valido: camposFaltantes.length === 0,
    camposFaltantes,
  }
}
