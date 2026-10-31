export const API_URL = import.meta.env.VITE_API_URL ?? '/api'
// Por defecto la app funciona sin backend (datos simulados en el navegador).
// Para usar el backend real: VITE_USE_MOCK=false en .env.local
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
export const LIMA_TIME_ZONE = 'America/Lima'
export const PAGE_SIZE = 10
export const MIN_PASSWORD_LENGTH = 8

export const GENEROS = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
]

export const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'TARJETA', label: 'Tarjeta' },
]

export const AULAS = ['Aula 1', 'Aula 2', 'Aula 3', 'Sala de pesas']
