import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../services/api.js'
import { login } from '../services/auth.js'
import { clearSession, setSession } from '../services/session.js'
import { getSocio, updateSocio } from '../services/socios.js'
import { resetDb } from '../mock/db.js'

const credentials = {
  admin: { correo: 'admin@ximedgar.com', password: 'AdminGym2026!' },
  recepcionista: { correo: 'recepcion@ximedgar.com', password: 'Recepcion2026!' },
  socio: { correo: 'socio@ximedgar.com', password: 'Gimnasio2026!' },
}

async function loginAs(role) {
  const session = await login(credentials[role])
  setSession(session)
}

describe('US-x: actualización de datos del socio', () => {
  beforeEach(() => {
    clearSession()
    resetDb()
  })

  it('1. obtiene y muestra los datos actuales antes de modificarlos', async () => {
    await loginAs('admin')

    const socio = await getSocio(1)

    expect(socio).toEqual(expect.objectContaining({
      id: 1,
      nombreCompleto: 'Sofía Demo',
      dni: '12345678',
      correo: 'socio@ximedgar.com',
      telefono: expect.any(String),
    }))
  })

  it('2. rechaza un correo inválido o un teléfono incorrecto al actualizar', async () => {
    await loginAs('admin')

    const correoError = await updateSocio(1, { correo: 'correo-invalido' })
      .catch((reason) => reason)
    const telefonoError = await updateSocio(1, { telefono: '1234' })
      .catch((reason) => reason)

    expect(correoError).toBeInstanceOf(ApiError)
    expect(correoError.status).toBe(400)
    expect(correoError.errores.correo).toBeTruthy()
    expect(telefonoError).toBeInstanceOf(ApiError)
    expect(telefonoError.status).toBe(400)
    expect(telefonoError.errores.telefono).toBeTruthy()
  })

  it('3. mantiene inmutables el ID y el DNI, salvo corrección explícita del administrador', async () => {
    await loginAs('recepcionista')

    const intento = await updateSocio(1, { id: 99, dni: '87654321' })
      .catch((reason) => reason)

    expect(intento).toBeInstanceOf(ApiError)
    expect(intento.status).toBe(403)

    await loginAs('admin')
    const actualizado = await updateSocio(1, { id: 99, dni: '87654321' })

    expect(actualizado.id).toBe(1)
    expect(actualizado.dni).toBe('87654321')
  })

  it('4. devuelve un mensaje de éxito al guardar los cambios', async () => {
    await loginAs('admin')

    const result = await updateSocio(1, { telefono: '999888777' })

    expect(result.mensaje).toBe('DATOS ACTUALIZADOS')
  })

  it('5. conserva los cambios y los devuelve al consultar nuevamente el socio', async () => {
    await loginAs('admin')

    await updateSocio(1, {
      correo: 'sofia.actualizada@example.test',
      telefono: '999888777',
      direccion: 'Av. Demostración 123',
    })

    const recargado = await getSocio(1)

    expect(recargado).toEqual(expect.objectContaining({
      id: 1,
      correo: 'sofia.actualizada@example.test',
      telefono: '999888777',
      direccion: 'Av. Demostración 123',
    }))
  })
})