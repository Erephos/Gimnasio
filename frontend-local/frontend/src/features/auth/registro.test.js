import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../../services/api.js'
import { login } from '../../services/auth.js'
import { registerSocio } from '../../services/socios.js'
import { resetDb } from '../../mock/db.js'
import { validateDni, validateEmail } from '../../utils/validators.js'

const createRegistration = (overrides = {}) => ({
  nombre: 'Valeria',
  apellido: 'Prueba',
  dni: '87654321',
  correo: 'valeria.prueba@example.com',
  password: 'ClaveDemo2026!',
  genero: 'FEMENINO',
  telefono: '987654321',
  ...overrides,
})

describe('US-x: registro de socios', () => {
  beforeEach(() => {
    resetDb()
  })

  it('1. crea un socio válido con rol SOCIO y estado activo', async () => {
    const socio = await registerSocio(createRegistration())

    expect(socio).toMatchObject({
      nombre: 'Valeria',
      apellido: 'Prueba',
      dni: '87654321',
      correo: 'valeria.prueba@example.com',
      genero: 'FEMENINO',
      telefono: '987654321',
      activo: true,
    })

    const session = await login({
      correo: 'valeria.prueba@example.com',
      password: 'ClaveDemo2026!',
    })
    expect(session.rol).toBe('SOCIO')
  })

  it.each(['1234567', '123456789', '12A45678', '12-45678'])(
    '2. rechaza un DNI que no contiene exactamente 8 dígitos: %s',
    (dni) => {
      expect(validateDni(dni)).toBe('El DNI debe tener exactamente 8 dígitos.')
    },
  )

  it('3. permite iniciar sesión después de un registro correcto', async () => {
    await registerSocio(createRegistration())

    await expect(login({
      correo: 'valeria.prueba@example.com',
      password: 'ClaveDemo2026!',
    })).resolves.toMatchObject({ rol: 'SOCIO' })
  })

  it('4. devuelve el mensaje REGISTRO EXITOSO para que el frontend lo muestre en un modal', async () => {
    const result = await registerSocio(createRegistration())

    expect(result.mensaje).toBe('REGISTRO EXITOSO')
  })

  it.each(['correo-invalido', 'usuario@', '@dominio.com'])(
    '5. rechaza un correo con formato inválido: %s',
    (correo) => {
      expect(validateEmail(correo)).toBeTruthy()
    },
  )

  it('6. rechaza un DNI duplicado con código 409 y un mensaje claro', async () => {
    await registerSocio(createRegistration())

    const error = await registerSocio(createRegistration({ correo: 'otro@example.com' }))
      .catch((reason) => reason)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(409)
    expect(error.errores.dni).toBe('Este DNI ya está registrado.')
  })

  it('7. rechaza un correo duplicado con código 409 y un mensaje claro', async () => {
    await registerSocio(createRegistration())

    const error = await registerSocio(createRegistration({ dni: '76543210' }))
      .catch((reason) => reason)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(409)
    expect(error.errores.correo).toBe('Este correo ya está registrado.')
  })

  it('8. rechaza los campos obligatorios vacíos e indica cuáles faltan', async () => {
    const error = await registerSocio({
      nombre: '',
      apellido: '',
      dni: '',
      correo: '',
      password: '',
      genero: '',
    }).catch((reason) => reason)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.errores).toMatchObject({
      nombre: expect.any(String),
      apellido: expect.any(String),
      dni: expect.any(String),
      correo: expect.any(String),
      password: expect.any(String),
      genero: expect.any(String),
    })
  })

  it('9. permite registrarse sin una sesión iniciada', async () => {
    await expect(registerSocio(createRegistration())).resolves.toMatchObject({
      dni: '87654321',
      activo: true,
    })
  })
})
