export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  RECEPCION: 'RECEPCIONISTA',
  ENTRENADOR: 'ENTRENADOR',
  SOCIO: 'SOCIO',
}

export const ROLE_LABELS = {
<<<<<<< HEAD
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.RECEPCION]: 'Recepcionista',
=======
  [ROLES.ADMIN]: 'Administración',
  [ROLES.RECEPCION]: 'Recepción',
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
  [ROLES.ENTRENADOR]: 'Entrenador',
  [ROLES.SOCIO]: 'Socio',
}

<<<<<<< HEAD
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
=======
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
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
]
