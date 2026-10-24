import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { validateEmail } from '../lib/email.js'
import Alert from '../components/Alert.jsx'
import BrandMark from '../components/BrandMark.jsx'
import Button from '../components/Button.jsx'
import Field from '../components/Field.jsx'
import Input from '../components/Input.jsx'
import InputAction from '../components/InputAction.jsx'
import { CheckIcon, WarningIcon } from '../components/icons.jsx'

const MIN_PASSWORD_LENGTH = 12

const ROLES = {
  MEMBER: 'member',
  STAFF: 'staff',
}

// Credenciales de demostración. En producción la validación SIEMPRE debe
// hacerse en el backend; estas credenciales existen solo para probar la UI.
const DEMO_USERS = {
  [ROLES.MEMBER]: {
    label: 'Socio',
    email: 'socio@ximedgar.com',
    password: 'Gimnasio2026!',
    destination: null,
    heading: 'Acceso de socios',
    subtitle: 'Consulta tu membresía y tus rutinas de entrenamiento.',
  },
  [ROLES.STAFF]: {
    label: 'Recepción / Administración',
    email: 'recepcion@ximedgar.com',
    password: 'Recepcion2026!',
    destination: '/memberships',
    heading: 'Acceso de recepción',
    subtitle: 'Registra socios y controla la vigencia de sus membresías.',
  },
}

function validatePassword(value) {
  if (!value) {
    return 'La contraseña es obligatoria.'
  }

  if (value.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }

  return ''
}

// Simula la llamada al backend. Sustituir por el endpoint real de autenticación.
async function verifyCredentials(email, password, role) {
  await new Promise((resolve) => {
    setTimeout(resolve, 700)
  })

  const demoUser = DEMO_USERS[role]

  return Boolean(
    demoUser &&
      email.trim().toLowerCase() === demoUser.email &&
      password === demoUser.password,
  )
}

function Login() {
  const [role, setRole] = useState(ROLES.MEMBER)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [redirectTarget, setRedirectTarget] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const demoUser = DEMO_USERS[role]

  useEffect(() => {
    if (!redirectTarget) return undefined

    const timer = setTimeout(() => {
      navigate(redirectTarget, { replace: true })
    }, 700)

    return () => clearTimeout(timer)
  }, [navigate, redirectTarget])

  function handleRoleChange(nextRole) {
    if (nextRole === role || isRedirecting) return

    setRole(nextRole)
    setForm({ email: '', password: '' })
    setErrors({})
    setFormError('')
    setSuccess(false)
    setRedirectTarget(null)
  }

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
    setFormError('')
    setSuccess(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    const emailError = validateEmail(form.email)
    const passwordError = validatePassword(form.password)

    if (emailError) nextErrors.email = emailError
    if (passwordError) nextErrors.password = passwordError

    setErrors(nextErrors)
    setFormError('')
    setSuccess(false)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const isValid = await verifyCredentials(form.email, form.password, role)

      if (!isValid) {
        setFormError(
          role === ROLES.STAFF
            ? 'Correo o contraseña de recepción incorrectos. Verifica tus datos e inténtalo de nuevo.'
            : 'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.',
        )
        return
      }

      setSuccess(true)

      if (demoUser.destination) {
        setIsRedirecting(true)
        setRedirectTarget(demoUser.destination)
      }
    } catch {
      setFormError(
        'No pudimos validar tus credenciales en este momento. Inténtalo más tarde.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <header className="mb-8 text-center">
          <BrandMark size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {demoUser.heading}
          </h1>
          <p className="mt-2 text-sm text-slate-400">{demoUser.subtitle}</p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
          <div
            role="group"
            aria-label="Tipo de acceso"
            className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-slate-950/60 p-1"
          >
            {[ROLES.MEMBER, ROLES.STAFF].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleRoleChange(option)}
                aria-pressed={role === option}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 ${
                  role === option
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {DEMO_USERS[option].label}
              </button>
            ))}
          </div>

          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <Alert
                tone="error"
                icon={<WarningIcon className="mt-0.5 h-5 w-5 shrink-0" />}
              >
                {formError}
              </Alert>
            )}

            {success && (
              <Alert
                tone="success"
                icon={<CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />}
              >
                {role === ROLES.STAFF
                  ? 'Credenciales de recepción verificadas. Abriendo el panel de socios…'
                  : 'Credenciales verificadas correctamente. ¡Bienvenido de nuevo!'}
              </Alert>
            )}

            <Field
              id="email"
              label="Correo electrónico"
              density="comfortable"
              error={errors.email}
              errorId="email-error"
            >
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                size="md"
                placeholder="nombre@dominio.com"
                value={form.email}
                onChange={handleChange}
                invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </Field>

            <Field
              id="password"
              label="Contraseña"
              density="comfortable"
              error={errors.password}
              errorId="password-error"
              hint={
                <>
                  Mínimo {MIN_PASSWORD_LENGTH} caracteres · has escrito{' '}
                  {form.password.length}
                </>
              }
              hintId="password-help"
            >
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  size="md"
                  className="pr-20"
                  placeholder="Mínimo 12 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? 'password-error' : 'password-help'
                  }
                />
                <InputAction
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </InputAction>
              </div>
            </Field>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isSubmitting || isRedirecting}
              disabled={isSubmitting || isRedirecting}
              className="flex items-center justify-center gap-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              {isRedirecting
                ? 'Abriendo panel…'
                : isSubmitting
                  ? 'Validando…'
                  : 'Iniciar sesión'}
            </Button>
          </form>

          <p className="mt-6 rounded-lg border border-dashed border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-300">
              Demo {demoUser.label}:
            </span>{' '}
            {demoUser.email} · {demoUser.password}
            {demoUser.destination && (
              <span className="mt-1 block text-slate-500">
                Al iniciar sesión se abre el panel de socios y membresías.
              </span>
            )}
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          ¿Problemas para acceder? Contacta a la recepción del gimnasio.
        </p>
        {role === ROLES.MEMBER && (
          <p className="mt-3 text-center text-xs text-slate-500">
            ¿Trabajas en recepción?{' '}
            <Link
              to="/memberships"
              className="font-medium text-emerald-400 transition hover:text-emerald-300"
            >
              Ir al panel de socios
            </Link>
          </p>
        )}
      </div>
    </main>
  )
}

export default Login
