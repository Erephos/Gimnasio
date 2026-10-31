import { get, patch, post, put } from './api.js'

export const listPlanes = () => get('/planes')
export const listAllPlanes = () => get('/planes/todos')
export const createPlan = (data) => post('/planes', data)
export const updatePlan = (id, data) => put(`/planes/${id}`, data)
export const setPlanActivo = (id, activo) =>
  patch(`/planes/${id}/estado`, undefined, { params: { activo } })
