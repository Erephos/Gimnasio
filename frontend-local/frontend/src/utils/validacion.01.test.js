import { it, expect, describe } from 'vitest'
import { esCorreoValido, esClaveValida, esDniValido, validarCamposObligatorios } from './validaciones'

describe('Validaciones de Registro de Socio', () => {

  // Criterio 2: El DNI acepta únicamente 8 dígitos numéricos; se rechaza si contiene letras, símbolos o longitud distinta.
  it('rechaza DNI con menos o más de 8 dígitos', () => {
    expect(esDniValido('1234567')).toBe(false)
    expect(esDniValido('123456789')).toBe(false)
  })

  it('rechaza DNI que contiene letras o símbolos', () => {
    expect(esDniValido('1234567a')).toBe(false)
    expect(esDniValido('1234567-')).toBe(false)
  })

  it('acepta DNI válido de 8 dígitos numéricos', () => {
    expect(esDniValido('71234567')).toBe(true)
  })

  // Criterio 5: El correo debe tener formato válido (con “@” y un dominio correcto)
  it('rechaza correo sin dominio', () => {
    expect(esCorreoValido('ana@correo')).toBe(false) //
  })

  it('rechaza correo sin el símbolo @', () => {
    expect(esCorreoValido('anacorreo.com')).toBe(false)
  })

  it('acepta correo con formato válido', () => {
    expect(esCorreoValido('ana@correo.com')).toBe(true)
  })

  // Validación de clave (basada en el ejemplo de la imagen)[cite: 1]
  it('rechaza clave de 11 caracteres', () => {
    expect(esClaveValida('a'.repeat(11))).toBe(false) //[cite: 1]
  })

  // Criterio 8: Los campos obligatorios vacíos son rechazados, indicando cuáles faltan.
  it('rechaza campos obligatorios vacíos e indica cuáles faltan', () => {
    const datosIncompletos = {
      nombre: '',
      apellido: 'Pérez',
      dni: '',
      correo: '',
      clave: '123456',
      genero: 'F'
    }

    const resultado = validarCamposObligatorios(datosIncompletos)
    
    expect(resultado.valido).toBe(false)
    expect(resultado.camposFaltantes).toContain('nombre')
    expect(resultado.camposFaltantes).toContain('dni')
    expect(resultado.camposFaltantes).toContain('correo')
  })

})