import test from 'node:test'
import assert from 'node:assert/strict'
import { mapMembresia, mapSocio, pageResult, paging, validIsoDate } from '../src/lib/http.js'

test('pageResult conserva las propiedades de paginacion del contrato', () => {
  const result = pageResult([{ id: 1 }], 21, 1, 10)
  assert.equal(result.number, 1)
  assert.equal(result.size, 10)
  assert.equal(result.totalElements, 21)
  assert.equal(result.totalPages, 3)
  assert.equal(result.first, false)
  assert.equal(result.last, false)
  assert.equal(result.numberOfElements, 1)
})

test('paging pone limites seguros a los parametros', () => {
  const result = paging({ query: { page: '-4', size: '500' } }, 10, 50)
  assert.deepEqual(result, { page: 0, size: 50, offset: 0 })
})

test('mapSocio devuelve el formato camelCase de la API', () => {
  const mapped = mapSocio({ id: '3', nombre: 'Ana', apellido: 'Demo', correo: 'ana@example.test', dni: '12345678',
    telefono: null, genero: 'FEMENINO', direccion: null, contacto_emergencia: null, activo: true, creado_en: '2026-01-01T00:00:00Z' })
  assert.equal(mapped.id, 3)
  assert.equal(mapped.nombreCompleto, 'Ana Demo')
  assert.equal(mapped.contactoEmergencia, null)
})

test('mapMembresia usa fecha fin exclusiva', () => {
  const row = { id: '1', socio_id: '2', socio_nombre: 'Demo Socio', plan_id: '3', plan_nombre: 'Mensual',
    fecha_inicio: '2026-10-01', fecha_fin: '2026-11-01', precio_pagado: '120.00', creada_en: '2026-10-01T12:00:00Z' }
  assert.equal(mapMembresia(row, '2026-10-31').vigente, true)
  assert.equal(mapMembresia(row, '2026-11-01').vigente, false)
})

test('validIsoDate acepta fechas reales y rechaza fechas imposibles', () => {
  assert.equal(validIsoDate('2026-10-30'), true)
  assert.equal(validIsoDate('2026-02-29'), false)
  assert.equal(validIsoDate('2026-13-01'), false)
  assert.equal(validIsoDate('30-10-2026'), false)
})
