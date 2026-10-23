import { canListMembers, getMemberProfile } from './accounts.js'
import {
  formatCurrency,
  formatDate,
  isValidISODate,
  todayISO,
} from './memberships.js'

export const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
]

export const PAYMENT_METHOD_LABELS = PAYMENT_METHODS.reduce(
  (labels, method) => ({ ...labels, [method.value]: method.label }),
  {},
)

const PAYMENTS_STORAGE_KEY = 'ximedgar.gym.payments'

function getStorage() {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readStoredPayments() {
  const storage = getStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(PAYMENTS_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function persistPayments() {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments))
  } catch {
    return
  }
}

function seedMembership(plan, startOffsetDays, durationDays) {
  const startDate = addDaysLocal(todayISO(), startOffsetDays)

  return {
    plan,
    startDate,
    endDate: addDaysLocal(startDate, durationDays),
  }
}

function addDaysLocal(dateISO, days) {
  const [year, month, day] = dateISO.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function createSeedPayments() {
  const today = todayISO()

  function payment(id, memberId, membership, amount, date, method) {
    return {
      id,
      memberId,
      membershipKey: getMembershipKey(membership),
      membership,
      amount,
      date,
      method,
      createdAt: `${date}T00:00:00.000Z`,
      createdBy: 'R1',
    }
  }

  return [
    payment(
      'P1',
      'S1',
      seedMembership('Mensual', -12, 30),
      39.9,
      today,
      'efectivo',
    ),
    payment(
      'P2',
      'S2',
      seedMembership('Trimestral', -10, 90),
      109.9,
      today,
      'transferencia',
    ),
    payment(
      'P3',
      'S3',
      seedMembership('Mensual', -45, 30),
      39.9,
      addDaysLocal(today, -1),
      'tarjeta',
    ),
    payment(
      'P4',
      'S4',
      seedMembership('Anual', -20, 365),
      379.9,
      addDaysLocal(today, -10),
      'transferencia',
    ),
  ]
}

let payments = readStoredPayments() ?? createSeedPayments()

function nextPaymentId() {
  const highestId = payments.reduce((highest, payment) => {
    const numericId = Number(payment.id.replace(/\D/g, '')) || 0
    return Math.max(highest, numericId)
  }, 0)

  return `P${highestId + 1}`
}

export function getMembershipKey(membership) {
  if (!membership) return ''

  return `${membership.plan}|${membership.startDate}|${membership.endDate}`
}

export function getMemberMembershipOptions(member) {
  if (!member) return []

  const seen = new Set()
  const entries = [
    member.membership,
    ...(member.membershipHistory ?? []),
  ].filter(Boolean)

  return entries.reduce((options, membership) => {
    const key = getMembershipKey(membership)

    if (seen.has(key)) return options

    seen.add(key)
    options.push({
      key,
      membership,
      label: `${membership.plan} · ${formatDate(membership.startDate)} → ${formatDate(membership.endDate)}`,
    })

    return options
  }, [])
}

function roundCurrency(amount) {
  return Math.round(amount * 100) / 100
}

export function registerPayment({
  viewer,
  memberId,
  membershipKey,
  amount,
  date,
  method,
} = {}) {
  if (!viewer) {
    return {
      ok: false,
      code: 401,
      message: 'Inicia sesión para registrar un pago.',
    }
  }

  if (!canListMembers(viewer)) {
    return {
      ok: false,
      code: 403,
      message:
        'Solo un administrador o recepcionista puede registrar pagos.',
    }
  }

  const profile = getMemberProfile({ viewer, memberId })

  if (!profile.ok) {
    return {
      ok: false,
      code: profile.code,
      message: profile.message,
    }
  }

  const member = profile.member
  const options = getMemberMembershipOptions(member)
  const selectedMembership = options.find(
    (option) => option.key === membershipKey,
  )

  if (!membershipKey || !selectedMembership) {
    return {
      ok: false,
      code: 404,
      message: `No se encontró la membresía indicada para el socio ${member.fullName}.`,
    }
  }

  const errors = {}
  const normalizedAmount =
    amount === '' || amount === null || amount === undefined
      ? Number.NaN
      : Number(amount)

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    errors.amount = 'El monto debe ser mayor que cero.'
  }

  const paymentDate = String(date ?? '').trim()

  if (!paymentDate) {
    errors.date = 'La fecha del pago es obligatoria.'
  } else if (!isValidISODate(paymentDate)) {
    errors.date = 'Ingresa una fecha válida.'
  } else if (paymentDate > todayISO()) {
    errors.date = 'La fecha del pago no puede ser futura.'
  }

  if (!PAYMENT_METHODS.some((paymentMethod) => paymentMethod.value === method)) {
    errors.method =
      'Selecciona un método válido: efectivo, transferencia o tarjeta.'
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      code: 400,
      message: 'Revisa los datos del pago e inténtalo de nuevo.',
      errors,
    }
  }

  const payment = {
    id: nextPaymentId(),
    memberId: member.id,
    membershipKey: selectedMembership.key,
    membership: selectedMembership.membership,
    amount: roundCurrency(normalizedAmount),
    date: paymentDate,
    method,
    createdAt: new Date().toISOString(),
    createdBy: viewer.id,
  }

  payments = [...payments, payment]
  persistPayments()

  return {
    ok: true,
    code: 201,
    message: `Pago de ${formatCurrency(payment.amount)} registrado correctamente para ${member.fullName}.`,
    payment,
  }
}

export function getMemberPayments({ viewer, memberId } = {}) {
  const profile = getMemberProfile({ viewer, memberId })

  if (!profile.ok) {
    return profile
  }

  const memberPayments = payments
    .filter((payment) => payment.memberId === profile.member.id)
    .sort((first, second) => {
      if (first.date !== second.date) {
        return first.date > second.date ? -1 : 1
      }

      if (first.createdAt !== second.createdAt) {
        return first.createdAt > second.createdAt ? -1 : 1
      }

      return second.id.localeCompare(first.id, 'es', { numeric: true })
    })

  return {
    ok: true,
    code: 200,
    member: profile.member,
    payments: memberPayments,
  }
}

export function getPaymentSummary({ viewer, date = todayISO() } = {}) {
  if (!canListMembers(viewer)) {
    return {
      ok: false,
      code: 403,
      message:
        'Solo un administrador o recepcionista puede consultar los ingresos.',
    }
  }

  const month = date.slice(0, 7)
  const dayPayments = payments.filter((payment) => payment.date === date)
  const monthPayments = payments.filter(
    (payment) => payment.date.slice(0, 7) === month,
  )

  const sum = (items) =>
    roundCurrency(items.reduce((total, payment) => total + payment.amount, 0))

  return {
    ok: true,
    code: 200,
    date,
    month,
    dayTotal: sum(dayPayments),
    dayCount: dayPayments.length,
    monthTotal: sum(monthPayments),
    monthCount: monthPayments.length,
  }
}
