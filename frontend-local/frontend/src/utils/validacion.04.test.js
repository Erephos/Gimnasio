import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../services/api.js'
import { login } from '../services/auth.js'
import { createReserva } from '../services/clases.js'
import { clearSession, setSession } from '../services/session.js'
import { deactivateSocio, getSocio } from '../services/socios.js'
import { resetDb } from '../mock/db.js'
import { requestDeactivate } from './deactivation.js'

const credentials = {
  admin: { correo: 'admin@ximedgar.com', password: 'AdminGym2026!' },
  recepcionista: { correo: 'recepcion@ximedgar.com', password: 'Recepcion2026!' },
  socio: { correo: 'socio@ximedgar.com', password: 'Gimnasio2026!' },
}

async function loginAs(role) {
  const session = await login(credentials[role])
  setSession(session)
}

describe('US-x: desactivación de socios', () => {
  beforeEach(() => {
    clearSession()
    resetDb()
  })

  it('1. solicita confirmación antes de desactivar al socio', async () => {
    const confirm = vi.fn(() => false)
    const deactivate = vi.fn()

    await requestDeactivate(1, { confirm, deactivate })

    expect(confirm).toHaveBeenCalledOnce()
    expect(deactivate).not.toHaveBeenCalled()
  })

  it('2. desactiva lógicamente al socio y conserva su perfil e historial', async () => {
    await loginAs('admin')

    const result = await deactivateSocio(1)
    const socio = await getSocio(1)

    expect(result).toEqual(expect.objectContaining({
      mensaje: expect.stringMatching(/desactivado correctamente/i),
    }))
    expect(socio).toEqual(expect.objectContaining({
      id: 1,
      activo: false,
      dni: '12345678',
    }))
  })

  it('3. solo un administrador puede desactivar socios', async () => {
    await loginAs('recepcionista')

    const error = await deactivateSocio(1).catch((reason) => reason)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(403)
  })

  it('4. un socio inactivo no puede iniciar sesión ni reservar entrenamientos', async () => {
    const socioSession = await login(credentials.socio)
    await loginAs('admin')
    await deactivateSocio(1)
    clearSession()

    await expect(login(credentials.socio)).rejects.toMatchObject({ status: 403 })

    setSession(socioSession)
    const error = await createReserva({ claseId: 1 }).catch((reason) => reason)
    expect(error).toBeInstanceOf(ApiError)
    expect([401, 403]).toContain(error.status)
  })

  it('5. devuelve un mensaje que confirma la desactivación correcta', async () => {
    await loginAs('admin')

    const result = await deactivateSocio(1)

    expect(result.mensaje).toMatch(/socio.*(eliminado|desactivado|baja).*(correctamente|éxito)/i)
  })
})