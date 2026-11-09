export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  RECEPCION: 'RECEPCIONISTA',
  ENTRENADOR: 'ENTRENADOR',
  SOCIO: 'SOCIO',
}

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.RECEPCION]: 'Recepcionista',
  [ROLES.ENTRENADOR]: 'Entrenador',
  [ROLES.SOCIO]: 'Socio',
}

export const STAFF = [ROLES.ADMIN, ROLES.RECEPCION]

export function homePathFor(rol) {
  if (rol === ROLES.SOCIO) return '/mi-cuenta'
  if (rol === ROLES.ENTRENADOR) return '/clases'
  return '/dashboard'
}

// Items del menú lateral según rol
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio / Resumen', icon: 'grid', roles: STAFF },
  { to: '/socios', label: 'Clientes / Socios', icon: 'users', roles: STAFF },
  { to: '/planes', label: 'Membresías y planes', icon: 'card', roles: STAFF },
  { to: '/caja', label: 'Caja y pagos', icon: 'cash', roles: STAFF },
  { to: '/asistencia', label: 'Control de asistencia', icon: 'scan', roles: STAFF },
  { to: '/clases', label: 'Entrenadores y clases', icon: 'calendar', roles: [...STAFF, ROLES.ENTRENADOR] },
  { to: '/alertas', label: 'Alertas y vencimientos', icon: 'bell', roles: STAFF },
  { to: '/reportes', label: 'Reportes y auditoría', icon: 'chart', roles: [ROLES.ADMIN, ROLES.RECEPCION] },
  { to: '/admin', label: 'Roles y seguridad', icon: 'shield', roles: [ROLES.ADMIN] },
  { to: '/mi-cuenta', label: 'Mi cuenta', icon: 'user', roles: Object.values(ROLES) },
]
