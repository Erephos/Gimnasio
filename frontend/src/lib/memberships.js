import { normalizeEmail, validateEmail } from './email.js'

const DNI_PATTERN = /^\d{8}$/

export const MEMBER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

export const PLANS = [
  {
    id: 'monthly',
    name: 'Mensual',
    price: 39.9,
    durationDays: 30,
    description: 'Acceso completo durante 30 días.',
  },
  {
    id: 'quarterly',
    name: 'Trimestral',
    price: 109.9,
    durationDays: 90,
    description: 'Acceso completo durante 90 días.',
  },
  {
    id: 'annual',
    name: 'Anual',
    price: 379.9,
    durationDays: 365,
    description: 'Acceso completo durante 365 días.',
  },
]

const DAY_IN_MS = 24 * 60 * 60 * 1000

function parseISODate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

function toISO(date) {
  return date.toISOString().slice(0, 10)
}

export function todayISO() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(dateISO, days) {
  const date = new Date(parseISODate(dateISO))
  date.setUTCDate(date.getUTCDate() + days)
  return toISO(date)
}

export function daysBetween(fromISO, toISOValue) {
  return Math.round(
    (parseISODate(toISOValue) - parseISODate(fromISO)) / DAY_IN_MS,
  )
}

export function isValidISODate(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(parseISODate(value)) &&
    toISO(new Date(parseISODate(value))) === value
  )
}

export function formatDate(dateISO) {
  if (!dateISO) return '—'

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateISO}T00:00:00Z`))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
  }).format(amount)
}

export function getPlan(planId) {
  return PLANS.find((plan) => plan.id === planId)
}

export function findMemberById(members, memberId) {
  const normalizedId = String(memberId ?? '')
    .trim()
    .toLowerCase()

  if (!normalizedId) return null

  return (
    members.find((member) => member.id.toLowerCase() === normalizedId) ?? null
  )
}

export function getMembershipInfo(member, today = todayISO()) {
  if (!member?.membership) {
    return {
      status: 'none',
      label: 'Sin membresía',
      plan: null,
      daysRemaining: null,
    }
  }

  const { planId, startDate, endDate } = member.membership
  const plan = getPlan(planId) ?? null
  const expired = endDate < today

  return {
    status: expired ? 'expired' : 'active',
    label: expired ? 'Vencida' : 'Activa',
    plan,
    startDate,
    endDate,
    daysRemaining: daysBetween(today, endDate),
  }
}

export function nextMemberId(members) {
  const highestId = members.reduce((highest, member) => {
    const numericId = Number(member.id.replace(/\D/g, '')) || 0
    return Math.max(highest, numericId)
  }, 0)

  return `H${highestId + 1}`
}

export function validateMemberInput(draft, members, ignoreMemberId = null) {
  const errors = {}
  const name = draft.name.trim()
  const email = normalizeEmail(draft.email)
  const dni = String(draft.dni ?? '').trim()

  if (!dni) {
    errors.dni = 'El DNI del socio es obligatorio.'
  } else if (!DNI_PATTERN.test(dni)) {
    errors.dni = 'El DNI debe tener exactamente 8 dígitos numéricos.'
  } else if (
    members.some(
      (member) => member.id !== ignoreMemberId && member.dni === dni,
    )
  ) {
    errors.dni = 'Ya existe un socio registrado con este DNI.'
  }

  if (!name) {
    errors.name = 'El nombre del socio es obligatorio.'
  } else if (name.length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres.'
  } else if (name.length > 80) {
    errors.name = 'El nombre no puede superar los 80 caracteres.'
  }

  const emailError = validateEmail(draft.email)

  if (emailError) {
    errors.email = emailError
  } else if (
    members.some(
      (member) =>
        member.id !== ignoreMemberId && normalizeEmail(member.email) === email,
    )
  ) {
    errors.email = 'Ya existe un socio registrado con este correo electrónico.'
  }

  return errors
}

function buildMembership(planId, startDate) {
  const plan = getPlan(planId)

  return {
    planId,
    startDate,
    endDate: addDays(startDate, plan.durationDays),
  }
}

export function createInitialMembers() {
  const today = todayISO()

  return [
    {
      id: 'H1',
      name: 'Laura Gómez',
      dni: '70123456',
      email: 'laura.gomez@ximedgar.com',
      status: MEMBER_STATUS.ACTIVE,
      joinedAt: addDays(today, -140),
      membership: null,
    },
    {
      id: 'H2',
      name: 'Carlos Ruiz',
      dni: '12345678',
      email: 'carlos.ruiz@ximedgar.com',
      status: MEMBER_STATUS.INACTIVE,
      joinedAt: addDays(today, -260),
      membership: null,
    },
    {
      id: 'H3',
      name: 'Marta Díaz',
      dni: '45678901',
      email: 'marta.diaz@ximedgar.com',
      status: MEMBER_STATUS.ACTIVE,
      joinedAt: addDays(today, -70),
      membership: buildMembership('monthly', addDays(today, -12)),
    },
    {
      id: 'H4',
      name: 'Javier Moreno',
      dni: '87654321',
      email: 'javier.moreno@ximedgar.com',
      status: MEMBER_STATUS.ACTIVE,
      joinedAt: addDays(today, -180),
      membership: buildMembership('quarterly', addDays(today, -150)),
    },
    {
      id: 'H5',
      name: 'Ana Torres',
      dni: '23456789',
      email: 'ana.torres@ximedgar.com',
      status: MEMBER_STATUS.ACTIVE,
      joinedAt: addDays(today, -60),
      membership: buildMembership('annual', addDays(today, -40)),
    },
  ]
}

export function assignMembership({
  members,
  memberId,
  planId,
  startDate,
  today = todayISO(),
}) {
  const member = findMemberById(members, memberId)

  if (!member) {
    return {
      ok: false,
      code: 404,
      message: `No se encontró ningún socio con el ID "${String(memberId).trim() || '—'}".`,
    }
  }

  const plan = getPlan(planId)

  if (!plan) {
    return {
      ok: false,
      code: 400,
      message:
        'El plan seleccionado no existe o no es válido. Elige uno de los planes disponibles.',
    }
  }

  if (member.status === MEMBER_STATUS.INACTIVE) {
    return {
      ok: false,
      code: 403,
      message:
        'El socio está dado de baja (H2) y no puede recibir una membresía.',
    }
  }

  if (!isValidISODate(startDate)) {
    return {
      ok: false,
      code: 400,
      message: 'Selecciona una fecha de inicio válida.',
    }
  }

  const currentMembership = getMembershipInfo(member, today)

  if (currentMembership.status === 'active') {
    return {
      ok: false,
      code: 409,
      message: `El socio ya tiene una membresía activa (${currentMembership.plan?.name ?? 'plan actual'}) hasta el ${formatDate(currentMembership.endDate)}. Debe esperar a que venza o cancelarla antes de asignar otra.`,
    }
  }

  const membership = buildMembership(plan.id, startDate)

  return {
    ok: true,
    code: 201,
    member,
    plan,
    membership,
    message: `Membresía ${plan.name} activada para ${member.name}. Vence el ${formatDate(membership.endDate)}.`,
  }
}
