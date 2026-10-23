import { useState } from 'react'
import { validateEmail } from '../lib/email.js'

const MIN_PASSWORD_LENGTH = 12

// Credenciales de demostración. En producción la validación SIEMPRE debe
// hacerse en el backend; estas credenciales existen solo para probar la UI.
const DEMO_USER = {
  email: 'socio@ximedgar.com',
  password: 'Gimnasio2026!',
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
async function verifyCredentials(email, password) {
  await new Promise((resolve) => {
    setTimeout(resolve, 700)
  })

  return (
    email.trim().toLowerCase() === DEMO_USER.email &&
    password === DEMO_USER.password
  )
}

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
      const isValid = await verifyCredentials(form.email, form.password)

      if (!isValid) {
        setFormError(
          'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.',
        )
        return
      }

      setSuccess(true)
    } catch {
      setFormError(
        'No pudimos validar tus credenciales en este momento. Inténtalo más tarde.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputBaseClasses =
    'w-full rounded-lg border bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2'

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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <svg
              className="h-7 w-7 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 6.75h10.5M6.75 17.25h10.5M4.5 9v6M19.5 9v6M9 9v6M15 9v6"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Acceso de socios
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Consulta tu membresía y tus rutinas de entrenamiento.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m0 3h.008v.008H12v-.008ZM10.34 3.94 2.7 17.06A1.5 1.5 0 0 0 4 19.5h16a1.5 1.5 0 0 0 1.3-2.44L13.66 3.94a1.5 1.5 0 0 0-2.6 0Z"
                  />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
              >
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
                <span>
                  Credenciales verificadas correctamente. ¡Bienvenido de nuevo!
                </span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="nombre@dominio.com"
                value={form.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`${inputBaseClasses} ${
                  errors.email
                    ? 'border-red-500/60 focus:ring-red-500/30'
                    : 'border-white/10 focus:border-emerald-400/60 focus:ring-emerald-400/30'
                }`}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="mt-2 text-sm text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Mínimo 12 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? 'password-error' : 'password-help'
                  }
                  className={`${inputBaseClasses} pr-20 ${
                    errors.password
                      ? 'border-red-500/60 focus:ring-red-500/30'
                      : 'border-white/10 focus:border-emerald-400/60 focus:ring-emerald-400/30'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-slate-400 transition hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {errors.password ? (
                <p
                  id="password-error"
                  role="alert"
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.password}
                </p>
              ) : (
                <p id="password-help" className="mt-2 text-xs text-slate-500">
                  Mínimo {MIN_PASSWORD_LENGTH} caracteres · has escrito{' '}
                  {form.password.length}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
                  />
                </svg>
              )}
              {isSubmitting ? 'Validando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-6 rounded-lg border border-dashed border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-300">Demo:</span>{' '}
            {DEMO_USER.email} · {DEMO_USER.password}
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          ¿Problemas para acceder? Contacta a la recepción del gimnasio.
        </p>
        <p className="mt-3 text-center text-xs text-slate-500">
          ¿Trabajas en recepción?{' '}
          <a
            href="#/memberships"
            className="font-medium text-emerald-400 transition hover:text-emerald-300"
          >
            Ir al panel de socios
          </a>
        </p>
      </div>
    </main>
  )
}

export default Login
