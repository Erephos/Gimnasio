export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  RECEPCION: 'RECEPCIONISTA',
  ENTRENADOR: 'ENTRENADOR',
  SOCIO: 'SOCIO',
}

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administración',
  [ROLES.RECEPCION]: 'Recepción',
  [ROLES.ENTRENADOR]: 'Entrenador',
  [ROLES.SOCIO]: 'Socio',
}

export const STAFF_ROLES = [ROLES.ADMIN, ROLES.RECEPCION]

export const isStaff = (rol) => STAFF_ROLES.includes(rol)

// Pantalla de inicio de cada rol después de iniciar sesión.
export function homePathFor(rol) {
  if (isStaff(rol)) return '/socios'
  if (rol === ROLES.ENTRENADOR) return '/horarios'
  return '/mi-cuenta'
}

// Menú principal: cada ruta indica qué roles la pueden ver.
export const NAV_ITEMS = [
  { to: '/socios', label: 'Socios', roles: STAFF_ROLES },
  { to: '/membresias', label: 'Planes y membresías', roles: STAFF_ROLES },
  { to: '/pagos', label: 'Pagos', roles: STAFF_ROLES },
  { to: '/ingresos', label: 'Ingresos', roles: STAFF_ROLES },
  {
    to: '/horarios',
    label: 'Horarios y clases',
    roles: [...STAFF_ROLES, ROLES.ENTRENADOR],
  },
  { to: '/reportes', label: 'Reportes', roles: STAFF_ROLES },
  { to: '/administracion', label: 'Administración', roles: [ROLES.ADMIN] },
  { to: '/mi-cuenta', label: 'Mi cuenta', roles: Object.values(ROLES) },
]
