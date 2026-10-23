const EMAIL_PATTERN =
  /^[^\s@]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/

const DISPOSABLE_DOMAINS = [
  '10minutemail.com',
  'dispostable.com',
  'fakeinbox.com',
  'getnada.com',
  'guerrillamail.com',
  'maildrop.cc',
  'mailinator.com',
  'mailnesia.com',
  'mintemail.com',
  'sharklasers.com',
  'spam4.me',
  'temp-mail.org',
  'tempmail.com',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
]

const BLOCKED_DOMAINS = [
  'example.com',
  'example.net',
  'example.org',
  'fake.com',
  'test.com',
  'test.org',
]

export function normalizeEmail(value) {
  return value.trim().toLowerCase()
}

export function validateEmail(rawValue) {
  const email = rawValue.trim()

  if (!email) {
    return 'El correo electrónico es obligatorio.'
  }

  if (!EMAIL_PATTERN.test(email)) {
    return 'Ingresa un correo válido, por ejemplo: nombre@dominio.com.'
  }

  const [localPart, domain] = email.toLowerCase().split('@')

  if (
    localPart.length > 64 ||
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..')
  ) {
    return 'El correo electrónico no tiene un formato válido.'
  }

  if (BLOCKED_DOMAINS.includes(domain)) {
    return 'No se permiten correos de ejemplo o dominios no verificables.'
  }

  const isDisposable = DISPOSABLE_DOMAINS.some(
    (disposableDomain) =>
      domain === disposableDomain || domain.endsWith(`.${disposableDomain}`),
  )

  if (isDisposable) {
    return 'No se permiten correos temporales o desechables.'
  }

  const domainLabels = domain.split('.')

  if (
    domainLabels.some(
      (label) =>
        label.length === 0 ||
        label.startsWith('-') ||
        label.endsWith('-') ||
        label.length > 63,
    )
  ) {
    return 'El dominio del correo no es válido.'
  }

  return ''
}
