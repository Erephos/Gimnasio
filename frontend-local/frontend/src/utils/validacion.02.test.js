import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../services/api.js'
import { login } from '../services/auth.js'
import { listMembresiasBySocio } from '../services/membresias.js'
import { clearSession, setSession } from '../services/session.js'
import { getMyProfile, getSocio, listSocios } from '../services/socios.js'
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

describe('US-x: consulta de socios', () => {
  beforeEach(() => {
    clearSession()
    resetDb()
  })

  it('1. busca socios por nombre, DNI o correo y devuelve solo coincidencias', async () => {
    await loginAs('admin')

    const búsquedas = [
      ['Lucía', 'nombreCompleto', 'Lucía Fernández'],
      ['23456789', 'dni', '23456789'],
      ['carlos.ruiz@ximedgar.com', 'correo', 'carlos.ruiz@ximedgar.com'],
    ]

    for (const [q, property, expected] of búsquedas) {
      const result = await listSocios({ q })

      expect(result.content).toHaveLength(1)
      expect(result.content[0]).toMatchObject({ [property]: expected })
    }
  })

  it('2. cada socio incluye nombre, correo, teléfono, estado de membresía y fecha de registro', async () => {
    await loginAs('admin')

    const result = await listSocios({ q: 'Lucía' })

    expect(result.content[0]).toEqual(expect.objectContaining({
      nombreCompleto: 'Lucía Fernández',
      correo: 'lucia.fernandez@ximedgar.com',
      telefono: expect.any(String),
      estadoMembresia: expect.any(String),
      fechaRegistro: expect.any(String),
    }))
  })

  it('3. consulta un socio por ID y obtiene su perfil e historial de membresías', async () => {
    await loginAs('admin')

    const [perfil, historial] = await Promise.all([
      getSocio(1),
      listMembresiasBySocio(1),
    ])

    expect(perfil).toEqual(expect.objectContaining({
      id: 1,
      nombreCompleto: expect.any(String),
      dni: expect.any(String),
      correo: expect.any(String),
    }))
    expect(historial).toEqual(expect.any(Array))
    expect(historial.every((membresia) => membresia.socioId === 1)).toBe(true)
  })

  it('4. devuelve resultados paginados y en un orden estable', async () => {
    await loginAs('admin')

    const primeraPágina = await listSocios({ page: 0, size: 2 })
    const segundaPágina = await listSocios({ page: 1, size: 2 })
    const mismaPágina = await listSocios({ page: 0, size: 2 })

    expect(primeraPágina.content).toHaveLength(2)
    expect(segundaPágina.content).toHaveLength(2)
    expect(primeraPágina.number).toBe(0)
    expect(primeraPágina.size).toBe(2)
    expect(primeraPágina.totalElements).toBeGreaterThanOrEqual(4)
    expect(primeraPágina.content.map(({ id }) => id))
      .toEqual(mismaPágina.content.map(({ id }) => id))
    expect(primeraPágina.content.map(({ id }) => id))
      .not.toEqual(segundaPágina.content.map(({ id }) => id))
  })

  it('5. una búsqueda sin resultados devuelve una lista vacía y no un error', async () => {
    await loginAs('admin')

    await expect(listSocios({ q: 'socio-inexistente@example.test' }))
      .resolves.toMatchObject({ content: [] })
  })

  it('6. consultar un socio inexistente devuelve 404 con un mensaje claro', async () => {
    await loginAs('admin')

    const error = await getSocio(999999).catch((reason) => reason)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(404)
    expect(error.message).toMatch(/no se encontr[oó] el socio|socio no encontrado/i)
  })

  it('7. solo administrador y recepcionista listan; un socio solo consulta su perfil', async () => {
    for (const role of ['admin', 'recepcionista']) {
      await loginAs(role)
      await expect(listSocios()).resolves.toMatchObject({ content: expect.any(Array) })
    }

    await loginAs('socio')

    await expect(listSocios()).rejects.toMatchObject({ status: 403 })
    await expect(getMyProfile()).resolves.toMatchObject({
      correo: credentials.socio.correo,
    })
  })
})