import { describe, expect, it } from 'vitest'
import * as registro from './validaciones.01.js'

const {
  MENSAJE_REGISTRO_EXITOSO,
  camposObligatoriosFaltantes,
  iniciarSesion,
  registrarSocio,
  validarCorreo,
  validarDni,
} = registro

function datosValidos(cambios = {}) {
  return {
    nombre: 'Ana',
    apellido: 'Demo',
    dni: '12345678',
    correo: 'ana.demo@example.com',
    password: 'Clave2026!',
    genero: 'FEMENINO',
    telefono: '987654321',
    ...cambios,
  }
}

function crearRepositorioFalso({ usuarios = [], socios = [] } = {}) {
  const db = {
    usuarios: usuarios.map((usuario, indice) => ({ id: indice + 1, activo: true, ...usuario })),
    socios: socios.map((socio, indice) => ({ id: indice + 1, ...socio })),
  }

  return {
    db,
    buscarSocioPorDni(dni) {
      return db.socios.find((socio) => socio.dni === dni) ?? null
    },
    buscarUsuarioPorCorreo(correo) {
      const normalizado = String(correo).trim().toLowerCase()
      return db.usuarios.find((usuario) => usuario.correo.toLowerCase() === normalizado) ?? null
    },
    crearSocio({ usuario, socio }) {
      const usuarioCreado = { id: db.usuarios.length + 1, ...usuario }
      const socioCreado = { id: db.socios.length + 1, usuarioId: usuarioCreado.id, ...socio }
      db.usuarios.push(usuarioCreado)
      db.socios.push(socioCreado)
      return { usuario: usuarioCreado, socio: socioCreado }
    },
  }
}

describe('Registro público de socio (US-x)', () => {
  it('1. registra un socio válido con rol SOCIO, estado activo y teléfono opcional', async () => {
    const repositorio = crearRepositorioFalso()

    const resultado = await registrarSocio(datosValidos(), repositorio)

    expect(resultado).toMatchObject({ ok: true, status: 201 })
    expect(repositorio.db.usuarios).toHaveLength(1)
    expect(repositorio.db.usuarios[0]).toMatchObject({
      nombre: 'Ana',
      apellido: 'Demo',
      correo: 'ana.demo@example.com',
      rol: 'SOCIO',
      activo: true,
    })
    expect(repositorio.db.socios[0]).toMatchObject({
      dni: '12345678',
      telefono: '987654321',
      genero: 'FEMENINO',
    })

    const sinTelefono = crearRepositorioFalso()
    const resultadoSinTelefono = await registrarSocio(datosValidos({ telefono: undefined }), sinTelefono)

    expect(resultadoSinTelefono.ok).toBe(true)
    expect(sinTelefono.db.socios[0].telefono).toBeNull()

    const conGeneroInvalido = crearRepositorioFalso()
    const resultadoGeneroInvalido = await registrarSocio(datosValidos({ genero: 'OTRO' }), conGeneroInvalido)

    expect(resultadoGeneroInvalido).toMatchObject({ ok: false, status: 400 })
    expect(conGeneroInvalido.db.usuarios).toHaveLength(0)

    const conTelefonoInvalido = crearRepositorioFalso()
    const resultadoTelefonoInvalido = await registrarSocio(datosValidos({ telefono: '12345' }), conTelefonoInvalido)

    expect(resultadoTelefonoInvalido).toMatchObject({ ok: false, status: 400 })
    expect(conTelefonoInvalido.db.usuarios).toHaveLength(0)
  })

  it('2. acepta únicamente DNIs de 8 dígitos numéricos', async () => {
    expect(validarDni('12345678')).toBe(true)

    for (const dni of ['1234567', '123456789', '1234567a', '1234-678', '1234 678', 'ABCDEFGH', '']) {
      expect(validarDni(dni)).toBe(false)
    }

    const repositorio = crearRepositorioFalso()
    const resultado = await registrarSocio(datosValidos({ dni: '1234-678' }), repositorio)

    expect(resultado).toMatchObject({ ok: false, status: 400 })
    expect(resultado.errores).toHaveProperty('dni')
    expect(repositorio.db.usuarios).toHaveLength(0)
  })

  it('3. permite iniciar sesión con el correo y la contraseña usados en el registro', async () => {
    const repositorio = crearRepositorioFalso()
    const datos = datosValidos()

    await registrarSocio(datos, repositorio)
    const sesion = await iniciarSesion({ correo: datos.correo, password: datos.password }, repositorio)

    expect(sesion.ok).toBe(true)
    expect(sesion.usuario).toMatchObject({
      correo: datos.correo,
      rol: 'SOCIO',
      activo: true,
    })
  })

  it('4. devuelve el mensaje REGISTRO EXITOSO que el frontend muestra en un modal', async () => {
    expect(MENSAJE_REGISTRO_EXITOSO).toBe('REGISTRO EXITOSO')

    const resultado = await registrarSocio(datosValidos(), crearRepositorioFalso())

    expect(resultado.mensaje).toBe('REGISTRO EXITOSO')
  })

  it('5. rechaza correos con formato inválido', async () => {
    for (const correo of ['ana.demo@example.com', 'ana+etiqueta@sub.example.com']) {
      expect(validarCorreo(correo)).toBe(true)
    }

    for (const correo of [
      'ana.demo',
      'ana@',
      '@example.com',
      'ana@example',
      'ana @example.com',
      'ana@@example.com',
      '',
    ]) {
      expect(validarCorreo(correo)).toBe(false)
    }

    const repositorio = crearRepositorioFalso()
    const resultado = await registrarSocio(datosValidos({ correo: 'ana.demo@example' }), repositorio)

    expect(resultado).toMatchObject({ ok: false, status: 400 })
    expect(resultado.errores).toHaveProperty('correo')
    expect(repositorio.db.usuarios).toHaveLength(0)
  })

  it('6. rechaza con código 409 un DNI que ya está registrado', async () => {
    const repositorio = crearRepositorioFalso({
      socios: [{ dni: '12345678', genero: 'MASCULINO', telefono: null }],
    })

    const resultado = await registrarSocio(datosValidos({ dni: '12345678' }), repositorio)

    expect(resultado).toMatchObject({ ok: false, status: 409 })
    expect(resultado.mensaje).toMatch(/DNI/i)
    expect(resultado.mensaje).toMatch(/registrad/i)
    expect(repositorio.db.usuarios).toHaveLength(0)
  })

  it('7. rechaza con código 409 un correo que ya está registrado', async () => {
    const repositorio = crearRepositorioFalso({
      usuarios: [{ correo: 'ana.demo@example.com', password: 'OtraClave2026!', rol: 'SOCIO', activo: true }],
    })

    const resultado = await registrarSocio(datosValidos({ correo: 'ana.demo@example.com' }), repositorio)

    expect(resultado).toMatchObject({ ok: false, status: 409 })
    expect(resultado.mensaje).toMatch(/correo/i)
    expect(resultado.mensaje).toMatch(/registrad/i)
    expect(repositorio.db.usuarios).toHaveLength(1)
  })

  it('8. rechaza campos obligatorios vacíos e indica cuáles faltan', async () => {
    const faltantes = camposObligatoriosFaltantes({
      nombre: '   ',
      apellido: '',
      dni: '',
      correo: '',
      password: '',
      genero: '',
    })

    expect(faltantes).toEqual(
      expect.arrayContaining(['nombre', 'apellido', 'dni', 'correo', 'password', 'genero']),
    )
    expect(faltantes).not.toContain('telefono')

    const repositorio = crearRepositorioFalso()
    const resultado = await registrarSocio({ telefono: '987654321' }, repositorio)

    expect(resultado).toMatchObject({ ok: false, status: 400 })
    for (const campo of ['nombre', 'apellido', 'dni', 'correo', 'password', 'genero']) {
      expect(resultado.errores).toHaveProperty(campo)
    }
    expect(repositorio.db.usuarios).toHaveLength(0)

    const soloEspacios = crearRepositorioFalso()
    const resultadoSoloEspacios = await registrarSocio(datosValidos({ nombre: '   ' }), soloEspacios)

    expect(resultadoSoloEspacios).toMatchObject({ ok: false, status: 400 })
    expect(resultadoSoloEspacios.errores).toHaveProperty('nombre')
  })

  it('9. registra a un socio sin sesión iniciada (ruta pública)', async () => {
    const repositorio = crearRepositorioFalso()

    // No se crea sesión ni se pasa token: el caso de uso debe funcionar igual.
    const resultado = await registrarSocio(datosValidos(), repositorio)

    expect(resultado).toMatchObject({ ok: true, status: 201 })
    expect(repositorio.db.usuarios).toHaveLength(1)
    expect(repositorio.db.socios).toHaveLength(1)
  })
})
