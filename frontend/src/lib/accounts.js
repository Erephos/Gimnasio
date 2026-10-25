import { normalizeEmail, validateEmail } from './email.js'
import { addDays, todayISO } from './memberships.js'

export const ACCOUNT_ROLE = {
  MEMBER: 'socio',
  ADMIN: 'administrador',
  RECEPTIONIST: 'recepcionista',
}

export const ACCOUNT_STATUS = {
  ACTIVE: 'activo',
  INACTIVE: 'inactivo',
}

export const MEMBERSHIP_STATUS = {
  ACTIVE: 'activa',
  EXPIRED: 'vencida',
  NONE: 'sin-membresia',
}

export const ROLE_LABELS = {
  [ACCOUNT_ROLE.MEMBER]: 'Socio',
  [ACCOUNT_ROLE.ADMIN]: 'Administrador',
  [ACCOUNT_ROLE.RECEPTIONIST]: 'Recepcionista',
}

export const STATUS_LABELS = {
  [ACCOUNT_STATUS.ACTIVE]: 'Activo',
  [ACCOUNT_STATUS.INACTIVE]: 'Inactivo',
}

export const GENDERS = [
  { value: 'femenino', label: 'Femenino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'otro', label: 'Otro' },
  { value: 'prefiero-no-decir', label: 'Prefiero no decirlo' },
]

export const MIN_PASSWORD_LENGTH = 12
export const MEMBER_PAGE_SIZE = 5

const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 60
const DNI_PATTERN = /^\d{8}$/
const PHONE_PATTERN = /^\+?[\d\s-]+$/
const MIN_PHONE_DIGITS = 7
const MAX_PHONE_DIGITS = 15

const REQUIRED_FIELDS = [
  {
    key: 'firstName',
    label: 'nombre',
    message: 'El nombre es obligatorio.',
  },
  {
    key: 'lastName',
    label: 'apellido',
    message: 'El apellido es obligatorio.',
  },
  {
    key: 'dni',
    label: 'DNI',
    message: 'El DNI es obligatorio.',
  },
  {
    key: 'email',
    label: 'correo',
    message: 'El correo electrónico es obligatorio.',
  },
  {
    key: 'password',
    label: 'contraseña',
    message: 'La contraseña es obligatoria.',
  },
  {
    key: 'gender',
    label: 'género',
    message: 'El género es obligatorio.',
  },
]

// Cuentas de demostración. En producción las contraseñas NUNCA deben guardarse
// en texto plano ni validarse en el frontend: esto solo simula la API.
export const DEMO_ACCOUNT = {
  firstName: 'Sofía',
  lastName: 'Demo',
  dni: '12345678',
  email: 'socio@ximedgar.com',
  password: 'Gimnasio2026!',
  gender: 'femenino',
}

export const DEMO_STAFF = {
  admin: { email: 'admin@ximedgar.com', password: 'AdminGym2026!' },
  receptionist: {
    email: 'recepcion@ximedgar.com',
    password: 'Recepcion2026!',
  },
}

function createSeedAccounts() {
  const today = todayISO()

  function membership(plan, startOffsetDays, durationDays) {
    const startDate = addDays(today, startOffsetDays)

    return {
      plan,
      startDate,
      endDate: addDays(startDate, durationDays),
    }
  }

  function member({
    id,
    firstName,
    lastName,
    dni,
    email,
    password = 'SocioGym2026!',
    gender,
    phone,
    address = '',
    emergencyContact = '',
    daysAgo,
    currentMembership = null,
    history = [],
  }) {
    return {
      id,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      dni,
      email,
      password,
      gender,
      phone,
      address,
      emergencyContact,
      role: ACCOUNT_ROLE.MEMBER,
      status: ACCOUNT_STATUS.ACTIVE,
      createdAt: `${addDays(today, -daysAgo)}T10:00:00.000Z`,
      membership: currentMembership,
      membershipHistory: history,
    }
  }

  return [
    {
      id: 'A1',
      firstName: 'Andrea',
      lastName: 'Salazar',
      fullName: 'Andrea Salazar',
      dni: '00000001',
      email: DEMO_STAFF.admin.email,
      password: DEMO_STAFF.admin.password,
      gender: 'femenino',
      phone: '+51 900 000 001',
      role: ACCOUNT_ROLE.ADMIN,
      status: ACCOUNT_STATUS.ACTIVE,
      createdAt: `${addDays(today, -400)}T08:00:00.000Z`,
      membership: null,
      membershipHistory: [],
    },
    {
      id: 'R1',
      firstName: 'Rocío',
      lastName: 'Paredes',
      fullName: 'Rocío Paredes',
      dni: '00000002',
      email: DEMO_STAFF.receptionist.email,
      password: DEMO_STAFF.receptionist.password,
      gender: 'femenino',
      phone: '+51 900 000 002',
      role: ACCOUNT_ROLE.RECEPTIONIST,
      status: ACCOUNT_STATUS.ACTIVE,
      createdAt: `${addDays(today, -300)}T09:00:00.000Z`,
      membership: null,
      membershipHistory: [],
    },
    member({
      id: 'S1',
      firstName: DEMO_ACCOUNT.firstName,
      lastName: DEMO_ACCOUNT.lastName,
      dni: DEMO_ACCOUNT.dni,
      email: DEMO_ACCOUNT.email,
      password: DEMO_ACCOUNT.password,
      gender: DEMO_ACCOUNT.gender,
      phone: '+51 987 123 456',
      address: 'Av. Los Jardines 245, Lima',
      emergencyContact: 'Pedro Demo · +51 987 000 111',
      daysAgo: 150,
      currentMembership: membership('Mensual', -12, 30),
      history: [
        membership('Trimestral', -150, 90),
        membership('Mensual', -55, 30),
        membership('Mensual', -12, 30),
      ],
    }),
    member({
      id: 'S2',
      firstName: 'Lucía',
      lastName: 'Fernández',
      dni: '23456789',
      email: 'lucia.fernandez@ximedgar.com',
      gender: 'femenino',
      phone: '+51 987 654 321',
      address: 'Calle Las Begonias 118, Miraflores',
      emergencyContact: 'Rosa Fernández · +51 987 111 222',
      daysAgo: 95,
      currentMembership: membership('Trimestral', -10, 90),
      history: [
        membership('Mensual', -95, 30),
        membership('Trimestral', -10, 90),
      ],
    }),
    member({
      id: 'S3',
      firstName: 'Carlos',
      lastName: 'Ruiz',
      dni: '34567890',
      email: 'carlos.ruiz@ximedgar.com',
      gender: 'masculino',
      phone: '+51 986 111 222',
      address: 'Jr. Ancash 540, Cercado de Lima',
      emergencyContact: 'Lucía Ruiz · +51 986 333 444',
      daysAgo: 60,
      currentMembership: membership('Mensual', -45, 30),
      history: [membership('Mensual', -45, 30)],
    }),
    member({
      id: 'S4',
      firstName: 'Marta',
      lastName: 'Díaz',
      dni: '45678901',
      email: 'marta.diaz@ximedgar.com',
      gender: 'femenino',
      phone: '+51 985 333 444',
      address: 'Av. Arequipa 1820, Lince',
      emergencyContact: 'Jorge Díaz · +51 985 555 666',
      daysAgo: 30,
      currentMembership: membership('Anual', -20, 365),
      history: [membership('Anual', -20, 365)],
    }),
    member({
      id: 'S5',
      firstName: 'Javier',
      lastName: 'Moreno',
      dni: '56789012',
      email: 'javier.moreno@ximedgar.com',
      gender: 'masculino',
      phone: '+51 984 555 666',
      address: 'Calle Cantuarias 310, Miraflores',
      emergencyContact: 'Elena Moreno · +51 984 777 888',
      daysAgo: 250,
      currentMembership: null,
      history: [
        membership('Mensual', -250, 30),
        membership('Mensual', -210, 30),
      ],
    }),
    member({
      id: 'S6',
      firstName: 'Ana',
      lastName: 'Torres',
      dni: '67890123',
      email: 'ana.torres@ximedgar.com',
      gender: 'femenino',
      phone: '+51 983 777 888',
      address: 'Av. Universitaria 1250, San Miguel',
      emergencyContact: 'Luis Torres · +51 983 999 000',
      daysAgo: 10,
      currentMembership: membership('Mensual', -5, 30),
      history: [membership('Mensual', -5, 30)],
    }),
    member({
      id: 'S7',
      firstName: 'Diego',
      lastName: 'Salas',
      dni: '78901234',
      email: 'diego.salas@ximedgar.com',
      gender: 'masculino',
      phone: '+51 982 999 000',
      address: 'Calle Schell 275, Miraflores',
      emergencyContact: 'María Salas · +51 982 222 333',
      daysAgo: 200,
      currentMembership: membership('Trimestral', -100, 90),
      history: [
        membership('Mensual', -200, 30),
        membership('Trimestral', -100, 90),
      ],
    }),
  ]
}

const ACCOUNTS_STORAGE_KEY = 'ximedgar.gym.accounts'
const SESSION_STORAGE_KEY = 'ximedgar.gym.session'

function getStorage() {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readStoredAccounts() {
  const storage = getStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(ACCOUNTS_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null

    return parsed.map((account) => ({
      address: '',
      emergencyContact: '',
      membershipHistory: [],
      ...account,
    }))
  } catch {
    return null
  }
}

function persistAccounts() {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts))
  } catch {
    return
  }
}

function readStoredSessionId() {
  const storage = getStorage()
  if (!storage) return null

  try {
    return storage.getItem(SESSION_STORAGE_KEY)
  } catch {
    return null
  }
}

function persistSession(accountId) {
  const storage = getStorage()
  if (!storage) return

  try {
    if (accountId) {
      storage.setItem(SESSION_STORAGE_KEY, accountId)
    } else {
      storage.removeItem(SESSION_STORAGE_KEY)
    }
  } catch {
    return
  }
}

// La demo persiste cuentas y sesión en localStorage para sobrevivir recargas.
// En producción esto debe sustituirse por la API y sesiones seguras.
let accounts = readStoredAccounts() ?? createSeedAccounts()
let currentSession = (() => {
  const storedId = readStoredSessionId()
  if (!storedId) return null

  const storedAccount =
    accounts.find(
      (account) =>
        account.id === storedId &&
        account.status === ACCOUNT_STATUS.ACTIVE,
    ) ?? null

  if (!storedAccount) {
    persistSession(null)
  }

  return storedAccount
})()

export function getAccounts() {
  return accounts
}

export function startSession(account) {
  currentSession = account
  persistSession(account.id)
  return account
}

export function getCurrentSession() {
  return currentSession
}

export function endSession() {
  currentSession = null
  persistSession(null)
}

function nextAccountId() {
  const highestId = accounts
    .filter((account) => account.role === ACCOUNT_ROLE.MEMBER)
    .reduce((highest, account) => {
      const numericId = Number(account.id.replace(/\D/g, '')) || 0
      return Math.max(highest, numericId)
    }, 0)

  return `S${highestId + 1}`
}

function validateName(value, label, errors, key) {
  if (value.length < MIN_NAME_LENGTH) {
    errors[key] = `El ${label} debe tener al menos ${MIN_NAME_LENGTH} caracteres.`
  } else if (value.length > MAX_NAME_LENGTH) {
    errors[key] = `El ${label} no puede superar los ${MAX_NAME_LENGTH} caracteres.`
  }
}

function validatePhoneNumber(value) {
  if (!value) return ''

  const phoneDigits = value.replace(/\D/g, '')

  if (
    !PHONE_PATTERN.test(value) ||
    phoneDigits.length < MIN_PHONE_DIGITS ||
    phoneDigits.length > MAX_PHONE_DIGITS
  ) {
    return 'Ingresa un teléfono válido (entre 7 y 15 dígitos, opcionalmente con +, espacios o guiones).'
  }

  return ''
}

export function validateRegistration(draft, list = getAccounts()) {
  const errors = {}
  const missing = []
  const duplicates = []

  const values = {
    firstName: String(draft.firstName ?? '').trim(),
    lastName: String(draft.lastName ?? '').trim(),
    dni: String(draft.dni ?? '').trim(),
    email: String(draft.email ?? '').trim(),
    password: String(draft.password ?? ''),
    gender: String(draft.gender ?? '').trim(),
    phone: String(draft.phone ?? '').trim(),
  }

  REQUIRED_FIELDS.forEach(({ key, label, message }) => {
    if (!values[key]) {
      missing.push(label)
      errors[key] = message
    }
  })

  if (values.firstName) {
    validateName(values.firstName, 'nombre', errors, 'firstName')
  }

  if (values.lastName) {
    validateName(values.lastName, 'apellido', errors, 'lastName')
  }

  if (values.dni && !DNI_PATTERN.test(values.dni)) {
    errors.dni =
      'El DNI debe tener exactamente 8 dígitos numéricos, sin letras ni símbolos.'
  }

  if (values.email) {
    const emailError = validateEmail(values.email)

    if (emailError) {
      errors.email = emailError
    }
  }

  if (values.password && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }

  if (
    values.gender &&
    !GENDERS.some((gender) => gender.value === values.gender)
  ) {
    errors.gender = 'Selecciona un género válido.'
  }

  if (values.phone) {
    const phoneError = validatePhoneNumber(values.phone)

    if (phoneError) {
      errors.phone = phoneError
    }
  }

  const normalizedEmail = normalizeEmail(values.email)

  if (
    values.dni &&
    !errors.dni &&
    list.some((account) => account.dni === values.dni)
  ) {
    errors.dni =
      'El DNI ya está registrado. Inicia sesión o utiliza otro documento.'
    duplicates.push('dni')
  }

  if (
    normalizedEmail &&
    !errors.email &&
    list.some(
      (account) => normalizeEmail(account.email) === normalizedEmail,
    )
  ) {
    errors.email =
      'El correo electrónico ya está registrado. Inicia sesión o utiliza otro correo.'
    duplicates.push('email')
  }

  return { errors, missing, duplicates, values }
}

export function registerAccount(draft) {
  const { errors, missing, duplicates, values } = validateRegistration(draft)

  if (Object.keys(errors).length > 0) {
    const code = duplicates.length > 0 ? 409 : 400

    let message = 'Revisa los campos marcados e inténtalo de nuevo.'

    if (duplicates.length > 0) {
      message = duplicates.map((key) => errors[key]).join(' ')
    } else if (missing.length > 0) {
      message = `Faltan campos obligatorios: ${missing.join(', ')}.`
    }

    return { ok: false, code, message, errors }
  }

  const account = {
    id: nextAccountId(),
    firstName: values.firstName,
    lastName: values.lastName,
    fullName: `${values.firstName} ${values.lastName}`,
    dni: values.dni,
    email: normalizeEmail(values.email),
    password: values.password,
    gender: values.gender,
    phone: values.phone,
    address: '',
    emergencyContact: '',
    role: ACCOUNT_ROLE.MEMBER,
    status: ACCOUNT_STATUS.ACTIVE,
    createdAt: new Date().toISOString(),
    membership: null,
    membershipHistory: [],
  }

  accounts = [...accounts, account]
  persistAccounts()

  return {
    ok: true,
    code: 201,
    message: 'REGISTRO EXITOSO',
    account,
  }
}

export function authenticateAccount(email, password) {
  const normalizedEmail = normalizeEmail(email)

  return (
    accounts.find(
      (account) =>
        normalizeEmail(account.email) === normalizedEmail &&
        account.password === password &&
        account.status === ACCOUNT_STATUS.ACTIVE,
    ) ?? null
  )
}

export function canListMembers(viewer) {
  return (
    viewer?.role === ACCOUNT_ROLE.ADMIN ||
    viewer?.role === ACCOUNT_ROLE.RECEPTIONIST
  )
}

export function isMemberAccount(account) {
  return account?.role === ACCOUNT_ROLE.MEMBER
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function sortMembersForDirectory(members) {
  return [...members].sort((first, second) => {
    if (first.createdAt !== second.createdAt) {
      return first.createdAt > second.createdAt ? -1 : 1
    }

    return first.id.localeCompare(second.id, 'es', { numeric: true })
  })
}

export function searchMembers({
  viewer,
  query = '',
  page = 1,
  pageSize = MEMBER_PAGE_SIZE,
} = {}) {
  if (!canListMembers(viewer)) {
    return {
      ok: false,
      code: 403,
      message:
        'Solo un administrador o recepcionista puede consultar la lista de socios.',
    }
  }

  const term = normalizeText(query)
  const matches = sortMembersForDirectory(
    accounts.filter(isMemberAccount),
  ).filter((account) => {
    if (!term) return true

    return (
      normalizeText(account.fullName).includes(term) ||
      normalizeText(account.dni).includes(term) ||
      normalizeText(account.email).includes(term)
    )
  })

  const safePageSize = Math.max(1, Number(pageSize) || MEMBER_PAGE_SIZE)
  const totalItems = matches.length
  const totalPages = Math.ceil(totalItems / safePageSize)
  const safePage = Math.min(
    Math.max(1, Number(page) || 1),
    Math.max(1, totalPages),
  )
  const start = (safePage - 1) * safePageSize

  return {
    ok: true,
    code: 200,
    items: matches.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  }
}

export function getMemberProfile({ viewer, memberId } = {}) {
  if (!viewer) {
    return {
      ok: false,
      code: 401,
      message: 'Inicia sesión para consultar un perfil de socio.',
    }
  }

  const normalizedId = String(memberId ?? '').trim()

  if (!normalizedId) {
    return {
      ok: false,
      code: 400,
      message: 'Ingresa el ID del socio que quieres consultar.',
    }
  }

  const isStaff = canListMembers(viewer)
  const isOwnProfile = normalizeText(viewer.id) === normalizeText(normalizedId)

  if (!isStaff && !isOwnProfile) {
    return {
      ok: false,
      code: 403,
      message: 'Un socio solo puede consultar su propio perfil.',
    }
  }

  const member = accounts.find(
    (account) =>
      isMemberAccount(account) &&
      normalizeText(account.id) === normalizeText(normalizedId),
  )

  if (!member) {
    return {
      ok: false,
      code: 404,
      message: `No se encontró ningún socio con el ID "${normalizedId}". Verifica el identificador e inténtalo de nuevo.`,
    }
  }

  return { ok: true, code: 200, member }
}

export function updateMemberAccount({
  viewer,
  memberId,
  changes = {},
} = {}) {
  if (!viewer) {
    return {
      ok: false,
      code: 401,
      message: 'Inicia sesión para actualizar los datos de un socio.',
    }
  }

  const normalizedId = String(memberId ?? '').trim()

  if (!normalizedId) {
    return {
      ok: false,
      code: 400,
      message: 'Ingresa el ID del socio cuyos datos quieres actualizar.',
    }
  }

  const member = accounts.find(
    (account) =>
      isMemberAccount(account) &&
      normalizeText(account.id) === normalizeText(normalizedId),
  )

  if (!member) {
    return {
      ok: false,
      code: 404,
      message: `No se encontró ningún socio con el ID "${normalizedId}".`,
    }
  }

  const isStaff = canListMembers(viewer)
  const isOwnProfile = normalizeText(viewer.id) === normalizeText(member.id)

  if (!isStaff && !isOwnProfile) {
    return {
      ok: false,
      code: 403,
      message: 'Un socio solo puede actualizar su propio perfil.',
    }
  }

  if (changes.id !== undefined && String(changes.id).trim() !== member.id) {
    return {
      ok: false,
      code: 400,
      message: 'El ID del socio no se puede modificar.',
    }
  }

  const errors = {}
  let duplicate = false

  const email = normalizeEmail(changes.email ?? member.email)

  if (!email) {
    errors.email = 'El correo electrónico es obligatorio.'
  } else {
    const emailError = validateEmail(email)

    if (emailError) {
      errors.email = emailError
    } else if (
      accounts.some(
        (account) =>
          account.id !== member.id &&
          normalizeEmail(account.email) === email,
      )
    ) {
      errors.email = 'El correo electrónico ya está registrado por otro socio.'
      duplicate = true
    }
  }

  const phone = String(changes.phone ?? member.phone ?? '').trim()

  if (phone) {
    const phoneError = validatePhoneNumber(phone)

    if (phoneError) {
      errors.phone = phoneError
    }
  }

  const address = String(changes.address ?? member.address ?? '').trim()
  const emergencyContact = String(
    changes.emergencyContact ?? member.emergencyContact ?? '',
  ).trim()

  let dni = member.dni
  const requestedDni =
    changes.dni === undefined ? member.dni : String(changes.dni).trim()

  if (requestedDni !== member.dni) {
    if (viewer.role !== ACCOUNT_ROLE.ADMIN) {
      return {
        ok: false,
        code: 403,
        message: 'Solo el administrador puede corregir el DNI del socio.',
      }
    }

    if (!DNI_PATTERN.test(requestedDni)) {
      errors.dni =
        'El DNI debe tener exactamente 8 dígitos numéricos, sin letras ni símbolos.'
    } else if (
      accounts.some(
        (account) =>
          account.id !== member.id && account.dni === requestedDni,
      )
    ) {
      errors.dni = 'El DNI ya está registrado por otro socio.'
      duplicate = true
    } else {
      dni = requestedDni
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      code: duplicate ? 409 : 400,
      message: duplicate
        ? 'El correo o el DNI ya pertenecen a otro socio.'
        : 'Revisa los campos marcados e inténtalo de nuevo.',
      errors,
    }
  }

  const updatedMember = {
    ...member,
    email,
    phone,
    address,
    emergencyContact,
    dni,
  }

  accounts = accounts.map((account) =>
    account.id === updatedMember.id ? updatedMember : account,
  )

  if (currentSession?.id === updatedMember.id) {
    currentSession = updatedMember
  }

  persistAccounts()

  return {
    ok: true,
    code: 200,
    message: 'Datos del socio actualizados correctamente.',
    member: updatedMember,
  }
}

export function deactivateMemberAccount({ viewer, memberId } = {}) {
  if (!viewer) {
    return {
      ok: false,
      code: 401,
      message: 'Inicia sesión como administrador para desactivar un socio.',
    }
  }

  if (viewer.role !== ACCOUNT_ROLE.ADMIN) {
    return {
      ok: false,
      code: 403,
      message: 'Solo un administrador puede desactivar o eliminar socios.',
    }
  }

  const normalizedId = String(memberId ?? '').trim()

  if (!normalizedId) {
    return {
      ok: false,
      code: 400,
      message: 'Ingresa el ID del socio que quieres desactivar.',
    }
  }

  const member = accounts.find(
    (account) =>
      isMemberAccount(account) &&
      normalizeText(account.id) === normalizeText(normalizedId),
  )

  if (!member) {
    return {
      ok: false,
      code: 404,
      message: `No se encontró ningún socio con el ID "${normalizedId}".`,
    }
  }

  if (member.status === ACCOUNT_STATUS.INACTIVE) {
    return {
      ok: false,
      code: 409,
      message: 'El socio ya se encuentra inactivo.',
    }
  }

  const updatedMember = {
    ...member,
    status: ACCOUNT_STATUS.INACTIVE,
    deactivatedAt: new Date().toISOString(),
    deactivatedBy: viewer.id,
  }

  accounts = accounts.map((account) =>
    account.id === updatedMember.id ? updatedMember : account,
  )
  persistAccounts()

  return {
    ok: true,
    code: 200,
    message:
      'Socio desactivado correctamente. Su historial de pagos y asistencia se conserva.',
    member: updatedMember,
  }
}

export function getMembershipState(account, today = todayISO()) {
  if (!account?.membership) {
    return {
      status: MEMBERSHIP_STATUS.NONE,
      label: 'Sin membresía',
      membership: null,
    }
  }

  const expired = account.membership.endDate < today

  return {
    status: expired ? MEMBERSHIP_STATUS.EXPIRED : MEMBERSHIP_STATUS.ACTIVE,
    label: expired ? 'Vencida' : 'Activa',
    membership: account.membership,
  }
}
