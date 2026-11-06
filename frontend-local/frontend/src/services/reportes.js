import { get } from './api.js'

export const getResumen = ({ desde, hasta } = {}) =>
  get('/reportes/resumen', { params: { desde, hasta } })

export const listAuditoria = ({ page = 0, size = 20 } = {}) =>
  get('/auditoria', { params: { page, size } })
