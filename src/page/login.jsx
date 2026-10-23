import { useEffect, useState } from 'react'
import {
  ACCOUNT_ROLE,
  ACCOUNT_STATUS,
  DEMO_ACCOUNT,
  DEMO_STAFF,
  GENDERS,
  MEMBERSHIP_STATUS,
  MIN_PASSWORD_LENGTH,
  ROLE_LABELS,
  STATUS_LABELS,
  authenticateAccount,
  canListMembers,
  deactivateMemberAccount,
  endSession,
  getCurrentSession,
  getMemberProfile,
  getMembershipState,
  registerAccount,
  searchMembers,
  startSession,
  updateMemberAccount,
} from '../lib/accounts.js'
import { validateEmail } from '../lib/email.js'
import {
  formatCurrency,
  formatDate,
  todayISO,
} from '../lib/memberships.js'
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  getMemberMembershipOptions,
  getMemberPayments,
  getPaymentSummary,
  registerPayment,
} from '../lib/payments.js'

const inputBaseClasses =
  'w-full rounded-lg border bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60'

const EMPTY_REGISTRATION = {
  firstName: '',
  lastName: '',
  dni: '',
  email: '',
  password: '',
  gender: '',
  phone: '',
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
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
  await delay(700)
  return authenticateAccount(email, password)
}

function Alert({ tone = 'error', code, message }) {
  const isError = tone === 'error'
  const isSuccess = tone === 'success'

  const containerClasses = isError
    ? 'border-red-500/30 bg-red-500/10 text-red-200'
    : isSuccess
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      : 'border-sky-500/30 bg-sky-500/10 text-sky-100'

  const badgeClasses = isError
    ? 'bg-red-500/20 text-red-200'
    : isSuccess
      ? 'bg-emerald-500/20 text-emerald-200'
      : 'bg-sky-500/20 text-sky-200'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${containerClasses}`}
    >
      <span
        className={`mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${badgeClasses}`}
        aria-hidden="true"
      >
        {code ?? (isError ? '!' : isSuccess ? '✓' : 'i')}
      </span>
      <p className="leading-relaxed">{message}</p>
    </div>
  )
}

function TextField({ id, label, error, hint, ...inputProps }) {
  const describedBy = error
    ? `${id}-error`
    : hint
      ? `${id}-hint`
      : undefined

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-200"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`${inputBaseClasses} ${
          error
            ? 'border-red-500/60 focus:ring-red-500/30'
            : 'border-white/10 focus:border-emerald-400/60 focus:ring-emerald-400/30'
        }`}
        {...inputProps}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function SuccessModal({ email, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-success-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-2xl border border-emerald-400/30 bg-slate-900 p-6 text-center shadow-2xl shadow-black/60">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/40">
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
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        </div>

        <h2
          id="register-success-title"
          className="mt-4 text-xl font-bold tracking-tight text-emerald-300"
        >
          REGISTRO EXITOSO
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Tu cuenta quedó creada con rol{' '}
          <span className="font-semibold text-white">Socio</span> y estado{' '}
          <span className="font-semibold text-emerald-300">Activo</span>.
        </p>
        <p className="mt-3 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
          {email}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Ya puedes iniciar sesión con tu correo y contraseña.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  )
}

function RegisterForm({ onRegistered }) {
  const [form, setForm] = useState(EMPTY_REGISTRATION)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
    setFeedback(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setFeedback(null)
    setIsSubmitting(true)

    try {
      await delay(600)

      const result = registerAccount(form)

      if (!result.ok) {
        setErrors(result.errors)
        setFeedback({ code: result.code, message: result.message })
        return
      }

      setForm(EMPTY_REGISTRATION)
      setErrors({})
      onRegistered(result.account)
    } catch {
      setFeedback({
        code: 500,
        message:
          'No pudimos crear tu cuenta en este momento. Inténtalo más tarde.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      {feedback && (
        <Alert tone="error" code={feedback.code} message={feedback.message} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="firstName"
          name="firstName"
          label="Nombre"
          placeholder="Ej. Lucía"
          autoComplete="given-name"
          value={form.firstName}
          onChange={handleChange}
          error={errors.firstName}
        />
        <TextField
          id="lastName"
          name="lastName"
          label="Apellido"
          placeholder="Ej. Fernández"
          autoComplete="family-name"
          value={form.lastName}
          onChange={handleChange}
          error={errors.lastName}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="dni"
          name="dni"
          label="DNI"
          inputMode="numeric"
          placeholder="8 dígitos · Ej. 12345678"
          hint="Debe contener exactamente 8 dígitos numéricos."
          value={form.dni}
          onChange={handleChange}
          error={errors.dni}
        />
        <TextField
          id="phone"
          name="phone"
          type="tel"
          label="Teléfono (opcional)"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Ej. +51 999 999 999"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
        />
      </div>

      <TextField
        id="register-email"
        name="email"
        type="email"
        label="Correo electrónico"
        inputMode="email"
        autoComplete="email"
        placeholder="nombre@dominio.com"
        value={form.email}
        onChange={handleChange}
        error={errors.email}
      />

      <div>
        <label
          htmlFor="register-password"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Contraseña
        </label>
        <div className="relative">
          <input
            id="register-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
            value={form.password}
            onChange={handleChange}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? 'register-password-error' : 'register-password-help'
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
            id="register-password-error"
            role="alert"
            className="mt-2 text-sm text-red-400"
          >
            {errors.password}
          </p>
        ) : (
          <p id="register-password-help" className="mt-2 text-xs text-slate-500">
            Mínimo {MIN_PASSWORD_LENGTH} caracteres · has escrito{' '}
            {form.password.length}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="gender"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Género
        </label>
        <select
          id="gender"
          name="gender"
          value={form.gender}
          onChange={handleChange}
          aria-invalid={Boolean(errors.gender)}
          aria-describedby={errors.gender ? 'gender-error' : undefined}
          className={`${inputBaseClasses} ${
            errors.gender
              ? 'border-red-500/60 focus:ring-red-500/30'
              : 'border-white/10 focus:border-emerald-400/60 focus:ring-emerald-400/30'
          }`}
        >
          <option value="">Selecciona un género</option>
          {GENDERS.map((gender) => (
            <option key={gender.value} value={gender.value}>
              {gender.label}
            </option>
          ))}
        </select>
        {errors.gender && (
          <p id="gender-error" role="alert" className="mt-2 text-sm text-red-400">
            {errors.gender}
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
        {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>

      <p className="rounded-lg border border-dashed border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-slate-400">
        Tu cuenta se crea con rol{' '}
        <span className="font-semibold text-slate-300">Socio</span> y estado{' '}
        <span className="font-semibold text-slate-300">Activo</span>. Los campos
        marcados son obligatorios; el teléfono es opcional.
      </p>
    </form>
  )
}

function membershipBadgeClasses(status) {
  if (status === MEMBERSHIP_STATUS.ACTIVE) {
    return 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
  }

  if (status === MEMBERSHIP_STATUS.EXPIRED) {
    return 'bg-red-500/10 text-red-300 ring-red-500/30'
  }

  return 'bg-slate-500/10 text-slate-400 ring-slate-500/30'
}

function getGenderLabel(value) {
  return GENDERS.find((gender) => gender.value === value)?.label ?? '—'
}

function ConfirmDeactivateModal({
  member,
  onCancel,
  onConfirm,
  isSubmitting,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, onCancel])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivate-member-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-red-400/30 bg-slate-900 p-6 shadow-2xl shadow-black/60">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-400/40">
          <svg
            className="h-7 w-7 text-red-400"
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
        </div>

        <h2
          id="deactivate-member-title"
          className="mt-4 text-center text-lg font-bold tracking-tight text-white"
        >
          ¿Eliminar socio?
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-300">
          Vas a desactivar la cuenta de{' '}
          <span className="font-semibold text-white">{member.fullName}</span> (
          {member.id}).
        </p>
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-100">
          Se aplicará un borrado lógico: la cuenta pasará a estado{' '}
          <span className="font-semibold">Inactivo</span> y se conservará su
          historial de pagos y asistencia. No se eliminará permanentemente.
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Desactivando…' : 'Sí, desactivar socio'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MemberProfile({ member, viewer, onClose, onMemberUpdated }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const membershipState = getMembershipState(member)
  const history = member.membershipHistory ?? []
  const currentMembership = membershipState.membership
  const isAdmin = viewer?.role === ACCOUNT_ROLE.ADMIN
  const canEditDni = isAdmin
  const isActive = member.status === ACCOUNT_STATUS.ACTIVE

  const profileFields = [
    { label: 'Nombre completo', value: member.fullName },
    { label: 'ID de socio', value: member.id },
    { label: 'DNI', value: member.dni || '—' },
    { label: 'Correo electrónico', value: member.email },
    { label: 'Teléfono', value: member.phone || '—' },
    { label: 'Dirección', value: member.address || '—' },
    {
      label: 'Contacto de emergencia',
      value: member.emergencyContact || '—',
    },
    { label: 'Género', value: getGenderLabel(member.gender) },
    { label: 'Rol', value: ROLE_LABELS[member.role] ?? member.role },
    {
      label: 'Estado de la cuenta',
      value: STATUS_LABELS[member.status] ?? member.status,
    },
    {
      label: 'Fecha de registro',
      value: formatDate(member.createdAt.slice(0, 10)),
    },
  ]

  function startEditing() {
    setDraft({
      email: member.email,
      phone: member.phone ?? '',
      address: member.address ?? '',
      emergencyContact: member.emergencyContact ?? '',
      dni: member.dni ?? '',
    })
    setErrors({})
    setFeedback(null)
    setIsEditing(true)
  }

  function handleDraftChange(event) {
    const { name, value } = event.target

    setDraft((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
    setFeedback(null)
  }

  async function handleSave(event) {
    event.preventDefault()

    setFeedback(null)
    setIsSaving(true)

    try {
      await delay(500)

      const result = updateMemberAccount({
        viewer,
        memberId: member.id,
        changes: draft,
      })

      if (!result.ok) {
        setErrors(result.errors ?? {})
        setFeedback({
          tone: 'error',
          code: result.code,
          message: result.message,
        })
        return
      }

      setErrors({})
      setIsEditing(false)
      setFeedback({
        tone: 'success',
        code: result.code,
        message: result.message,
      })
      onMemberUpdated?.(result.member)
    } catch {
      setFeedback({
        tone: 'error',
        code: 500,
        message:
          'No pudimos guardar los cambios en este momento. Inténtalo más tarde.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeactivate() {
    setIsDeactivating(true)

    try {
      await delay(500)

      const result = deactivateMemberAccount({
        viewer,
        memberId: member.id,
      })

      setShowDeactivateModal(false)

      if (!result.ok) {
        setFeedback({
          tone: 'error',
          code: result.code,
          message: result.message,
        })
        return
      }

      setFeedback({
        tone: 'success',
        code: result.code,
        message: result.message,
      })
      onMemberUpdated?.(result.member)
    } catch {
      setShowDeactivateModal(false)
      setFeedback({
        tone: 'error',
        code: 500,
        message:
          'No pudimos desactivar al socio en este momento. Inténtalo más tarde.',
      })
    } finally {
      setIsDeactivating(false)
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? 'Editar datos del socio' : 'Perfil del socio'}
          </h2>
          <p className="text-xs text-slate-500">
            {member.id} · {member.fullName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              type="button"
              onClick={startEditing}
              className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              Editar datos
            </button>
          )}
          {isAdmin && isActive && !isEditing && (
            <button
              type="button"
              onClick={() => setShowDeactivateModal(true)}
              className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
            >
              Eliminar socio
            </button>
          )}
          {onClose && !isEditing && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:text-white"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="mt-4">
          <Alert
            tone={feedback.tone}
            code={feedback.code}
            message={feedback.message}
          />
        </div>
      )}

      {isEditing ? (
        <form noValidate onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`profile-id-${member.id}`}
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                ID de socio
              </label>
              <input
                id={`profile-id-${member.id}`}
                value={member.id}
                readOnly
                disabled
                className={`${inputBaseClasses} border-white/10`}
              />
              <p className="mt-2 text-xs text-slate-500">
                El ID del socio no se puede modificar.
              </p>
            </div>

            <TextField
              id={`profile-dni-${member.id}`}
              name="dni"
              label="DNI"
              inputMode="numeric"
              value={draft.dni}
              onChange={handleDraftChange}
              disabled={!canEditDni}
              error={errors.dni}
              hint={
                canEditDni
                  ? 'Como administrador puedes corregir el DNI (8 dígitos).'
                  : 'Solo el administrador puede corregir el DNI.'
              }
            />
          </div>

          <TextField
            id={`profile-email-${member.id}`}
            name="email"
            type="email"
            label="Correo electrónico"
            inputMode="email"
            autoComplete="email"
            value={draft.email}
            onChange={handleDraftChange}
            error={errors.email}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id={`profile-phone-${member.id}`}
              name="phone"
              type="tel"
              label="Teléfono (opcional)"
              inputMode="tel"
              autoComplete="tel"
              value={draft.phone}
              onChange={handleDraftChange}
              error={errors.phone}
            />
            <TextField
              id={`profile-address-${member.id}`}
              name="address"
              label="Dirección (opcional)"
              autoComplete="street-address"
              value={draft.address}
              onChange={handleDraftChange}
              error={errors.address}
            />
          </div>

          <TextField
            id={`profile-emergency-${member.id}`}
            name="emergencyContact"
            label="Contacto de emergencia (opcional)"
            placeholder="Nombre · teléfono"
            value={draft.emergencyContact}
            onChange={handleDraftChange}
            error={errors.emergencyContact}
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setErrors({})
                setFeedback(null)
              }}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profileFields.map((field) => (
              <div
                key={field.label}
                className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
              >
                <dt className="text-xs text-slate-500">{field.label}</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">
                Membresía actual
              </h3>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${membershipBadgeClasses(membershipState.status)}`}
              >
                {membershipState.label}
              </span>
            </div>

            {currentMembership ? (
              <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-slate-500">Plan</dt>
                  <dd className="font-medium text-slate-200">
                    {currentMembership.plan}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Inicio</dt>
                  <dd className="font-medium text-slate-200">
                    {formatDate(currentMembership.startDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Vencimiento</dt>
                  <dd className="font-medium text-slate-200">
                    {formatDate(currentMembership.endDate)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                Este socio todavía no tiene una membresía asignada.
              </p>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-white">
              Historial de membresías
            </h3>

            {history.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-white/10 bg-slate-950/40 px-3 py-4 text-sm text-slate-500">
                Este socio todavía no tiene membresías registradas.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-2 py-2 font-medium">Plan</th>
                      <th className="px-2 py-2 font-medium">Inicio</th>
                      <th className="px-2 py-2 font-medium">Vencimiento</th>
                      <th className="px-2 py-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map((entry, index) => {
                      const entryState = getMembershipState({
                        membership: entry,
                      })

                      return (
                        <tr key={`${entry.plan}-${entry.startDate}-${index}`}>
                          <td className="px-2 py-2 text-slate-200">
                            {entry.plan}
                          </td>
                          <td className="px-2 py-2 text-xs text-slate-400">
                            {formatDate(entry.startDate)}
                          </td>
                          <td className="px-2 py-2 text-xs text-slate-400">
                            {formatDate(entry.endDate)}
                          </td>
                          <td className="px-2 py-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${membershipBadgeClasses(entryState.status)}`}
                            >
                              {entryState.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {showDeactivateModal && (
        <ConfirmDeactivateModal
          member={member}
          onCancel={() => setShowDeactivateModal(false)}
          onConfirm={handleDeactivate}
          isSubmitting={isDeactivating}
        />
      )}
    </section>
  )
}

function MemberDirectory({ viewer }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [consultId, setConsultId] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)

  const result = searchMembers({ viewer, query, page })

  function handleSearchChange(event) {
    setQuery(event.target.value)
    setPage(1)
  }

  function handleConsult(event) {
    event.preventDefault()

    const response = getMemberProfile({ viewer, memberId: consultId })

    if (!response.ok) {
      setFeedback({
        tone: 'error',
        code: response.code,
        message: response.message,
      })
      setSelectedMember(null)
      return
    }

    setFeedback(null)
    setSelectedMember(response.member)
    setConsultId(response.member.id)
  }

  function openProfile(member) {
    setSelectedMember(member)
    setConsultId(member.id)
    setFeedback(null)
  }

  if (!result.ok) {
    return <Alert tone="error" code={result.code} message={result.message} />
  }

  return (
    <section className="space-y-6" aria-labelledby="consultar-socios-title">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
        <h1
          id="consultar-socios-title"
          className="text-2xl font-bold tracking-tight text-white"
        >
          Consulta de socios
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Busca por nombre, DNI o correo electrónico. También puedes consultar
          el perfil completo de un socio por su ID.
        </p>

        <form
          onSubmit={handleConsult}
          noValidate
          className="mt-5 flex flex-col gap-2 sm:flex-row"
        >
          <div className="flex-1">
            <label htmlFor="consult-member-id" className="sr-only">
              ID del socio
            </label>
            <input
              id="consult-member-id"
              value={consultId}
              onChange={(event) => {
                setConsultId(event.target.value)
                setFeedback(null)
              }}
              className={inputBaseClasses}
              placeholder="Consultar por ID · Ej. S3"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:text-white"
          >
            Consultar perfil
          </button>
        </form>

        {feedback && (
          <div className="mt-4">
            <Alert
              tone="error"
              code={feedback.code}
              message={feedback.message}
            />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/70">
        <div className="border-b border-white/10 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label
                htmlFor="member-search"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Buscar socios
              </label>
              <input
                id="member-search"
                type="search"
                placeholder="Nombre, DNI o correo…"
                value={query}
                onChange={handleSearchChange}
                className={inputBaseClasses}
              />
            </div>
            <p className="text-xs leading-relaxed text-slate-500 sm:text-right">
              {result.totalItems}{' '}
              {result.totalItems === 1 ? 'socio encontrado' : 'socios encontrados'}
              <br />
              Orden: registro más reciente · 5 por página
            </p>
          </div>
        </div>

        {result.items.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-6">
            <p className="text-sm font-medium text-slate-300">
              {query.trim()
                ? `No se encontraron socios que coincidan con “${query.trim()}”.`
                : 'No hay socios registrados todavía.'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Prueba con otro nombre, DNI o correo electrónico.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Socio</th>
                  <th className="px-4 py-3 font-medium">Correo</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Membresía</th>
                  <th className="px-4 py-3 font-medium">Registro</th>
                  <th className="px-4 py-3 text-right font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {result.items.map((member) => {
                  const membershipState = getMembershipState(member)

                  return (
                    <tr
                      key={member.id}
                      className="transition hover:bg-white/5"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">
                          <span className="mr-2 font-mono text-xs text-slate-500">
                            {member.id}
                          </span>
                          {member.fullName}
                          {member.status === ACCOUNT_STATUS.INACTIVE && (
                            <span className="ml-2 inline-flex rounded-full bg-red-500/10 px-2 py-0.5 align-middle text-[10px] font-semibold text-red-300 ring-1 ring-red-500/30">
                              Inactivo
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          DNI {member.dni}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">
                        {member.email}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">
                        {member.phone || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${membershipBadgeClasses(membershipState.status)}`}
                        >
                          {membershipState.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {formatDate(member.createdAt.slice(0, 10))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openProfile(member)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10"
                        >
                          Ver perfil
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-slate-500">
            {result.totalItems === 0
              ? 'Sin resultados'
              : `Página ${result.page} de ${result.totalPages}`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              disabled={!result.hasPrev}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((previous) => previous + 1)}
              disabled={!result.hasNext}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {selectedMember && (
        <MemberProfile
          member={selectedMember}
          viewer={viewer}
          onMemberUpdated={setSelectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </section>
  )
}

function OwnProfile({ session, onSessionChange }) {
  const [profile, setProfile] = useState(() =>
    getMemberProfile({
      viewer: session,
      memberId: session.id,
    }),
  )

  if (!profile.ok) {
    return (
      <Alert tone="error" code={profile.code} message={profile.message} />
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Mi perfil
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Como socio, solo puedes consultar y actualizar tu propia información.
        </p>
      </div>
      <MemberProfile
        member={profile.member}
        viewer={session}
        onMemberUpdated={(updated) => {
          setProfile({ ok: true, code: 200, member: updated })
          onSessionChange?.(updated)
        }}
      />
    </section>
  )
}

function PaymentsPanel({ viewer }) {
  const [memberId, setMemberId] = useState('')
  const [membershipKey, setMembershipKey] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO)
  const [method, setMethod] = useState(PAYMENT_METHODS[0].value)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)

  const today = todayISO()
  const directory = searchMembers({ viewer, pageSize: 100 })
  const memberResult = memberId.trim()
    ? getMemberProfile({ viewer, memberId: memberId.trim() })
    : null
  const membershipOptions = memberResult?.ok
    ? getMemberMembershipOptions(memberResult.member)
    : []
  const history = memberResult?.ok
    ? getMemberPayments({ viewer, memberId: memberResult.member.id })
    : null
  const summary = getPaymentSummary({ viewer })

  function handleMemberChange(event) {
    const value = event.target.value
    setMemberId(value)
    setErrors((previous) => ({ ...previous, memberId: undefined }))
    setFeedback(null)

    const response = value.trim()
      ? getMemberProfile({ viewer, memberId: value.trim() })
      : null

    if (response?.ok) {
      const options = getMemberMembershipOptions(response.member)
      setMembershipKey(options[0]?.key ?? '')
    } else {
      setMembershipKey('')
    }
  }

  function handleSubmit(event) {
    event.preventDefault()

    const response = registerPayment({
      viewer,
      memberId: memberId.trim(),
      membershipKey,
      amount,
      date,
      method,
    })

    setErrors(response.errors ?? {})

    if (!response.ok) {
      setFeedback({
        tone: 'error',
        code: response.code,
        message: response.message,
      })
      return
    }

    setFeedback({
      tone: 'success',
      code: response.code,
      message: response.message,
    })
    setAmount('')
  }

  return (
    <section className="space-y-6" aria-labelledby="pagos-title">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
        <h1
          id="pagos-title"
          className="text-2xl font-bold tracking-tight text-white"
        >
          Pagos e ingresos
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Registra los pagos de membresías y servicios, consulta el historial
          por socio y controla los ingresos del día y del mes.
        </p>

        {summary.ok && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-300/80">
                Ingresos de hoy
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-400">
                {formatCurrency(summary.dayTotal)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {summary.dayCount}{' '}
                {summary.dayCount === 1 ? 'pago registrado' : 'pagos registrados'}{' '}
                · {formatDate(today)}
              </p>
            </div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-sky-300/80">
                Ingresos del mes
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-sky-300">
                {formatCurrency(summary.monthTotal)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {summary.monthCount}{' '}
                {summary.monthCount === 1
                  ? 'pago registrado'
                  : 'pagos registrados'}{' '}
                · {summary.month}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">Registrar pago</h2>
        <p className="mt-1 text-sm text-slate-400">
          El pago se asocia al socio y a una de sus membresías registradas.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <TextField
              id="payment-member-id"
              label="Socio (ID)"
              list="payment-member-options"
              value={memberId}
              onChange={handleMemberChange}
              placeholder="Ej. S1"
              hint="Escribe el ID del socio o selecciónalo de la lista."
              autoComplete="off"
            />
            <datalist id="payment-member-options">
              {directory.ok &&
                directory.items.map((member) => (
                  <option key={member.id} value={member.id}>
                    {`${member.id} · ${member.fullName}`}
                  </option>
                ))}
            </datalist>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="payment-membership"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Membresía
            </label>
            <select
              id="payment-membership"
              value={membershipKey}
              onChange={(event) => {
                setMembershipKey(event.target.value)
                setFeedback(null)
              }}
              disabled={!memberResult?.ok}
              className={`${inputBaseClasses} border-white/10 focus:border-emerald-400/60 focus:ring-emerald-400/30`}
            >
              {membershipOptions.length === 0 ? (
                <option value="">
                  {memberResult?.ok
                    ? 'Este socio no tiene membresías registradas'
                    : 'Selecciona un socio válido'}
                </option>
              ) : (
                membershipOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))
              )}
            </select>
          </div>

          <TextField
            id="payment-amount"
            label="Monto (USD)"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value)
              setErrors((previous) => ({ ...previous, amount: undefined }))
              setFeedback(null)
            }}
            error={errors.amount}
            placeholder="39.90"
          />

          <TextField
            id="payment-date"
            label="Fecha del pago"
            type="date"
            max={today}
            value={date}
            onChange={(event) => {
              setDate(event.target.value)
              setErrors((previous) => ({ ...previous, date: undefined }))
              setFeedback(null)
            }}
            error={errors.date}
          />

          <div className="sm:col-span-2">
            <label
              htmlFor="payment-method"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Método de pago
            </label>
            <select
              id="payment-method"
              value={method}
              onChange={(event) => {
                setMethod(event.target.value)
                setErrors((previous) => ({ ...previous, method: undefined }))
                setFeedback(null)
              }}
              className={`${inputBaseClasses} border-white/10 focus:border-emerald-400/60 focus:ring-emerald-400/30`}
            >
              {PAYMENT_METHODS.map((paymentMethod) => (
                <option key={paymentMethod.value} value={paymentMethod.value}>
                  {paymentMethod.label}
                </option>
              ))}
            </select>
            {errors.method && (
              <p role="alert" className="mt-2 text-sm text-red-400">
                {errors.method}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            >
              Registrar pago
            </button>
            <p className="text-xs text-slate-500">
              Los pagos registrados no se pueden eliminar.
            </p>
          </div>
        </form>

        {feedback && (
          <div className="mt-4">
            <Alert
              tone={feedback.tone}
              code={feedback.code}
              message={feedback.message}
            />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/70">
        <div className="border-b border-white/10 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white">
            Historial de pagos
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {memberResult?.ok
              ? `Pagos de ${memberResult.member.fullName} (${memberResult.member.id}), del más reciente al más antiguo.`
              : 'Selecciona un socio para consultar su historial de pagos.'}
          </p>
        </div>

        {!memberResult?.ok ? (
          <div className="px-4 py-10 text-center sm:px-6">
            <p className="text-sm font-medium text-slate-300">
              Ingresa un ID de socio válido para ver sus pagos.
            </p>
          </div>
        ) : history?.ok && history.payments.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-6">
            <p className="text-sm font-medium text-slate-300">
              Este socio no tiene pagos registrados.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              El historial está vacío, no es un error.
            </p>
          </div>
        ) : history?.ok ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Pago</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Membresía</th>
                  <th className="px-4 py-3 font-medium">Método</th>
                  <th className="px-4 py-3 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.payments.map((payment) => (
                  <tr key={payment.id} className="transition hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {payment.id}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {formatDate(payment.date)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {payment.membership.plan} ·{' '}
                      {formatDate(payment.membership.startDate)} →{' '}
                      {formatDate(payment.membership.endDate)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            <Alert
              tone="error"
              code={history?.code}
              message={history?.message}
            />
          </div>
        )}
      </div>
    </section>
  )
}

function Workspace({ session, onLogout, onSessionChange }) {
  const isStaff = canListMembers(session)
  const [staffView, setStaffView] = useState('members')

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
              <svg
                className="h-5 w-5 text-emerald-400"
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
            <div>
              <p className="text-sm font-semibold text-white">
                {session.fullName}
              </p>
              <p className="text-xs text-slate-400">
                {ROLE_LABELS[session.role] ?? 'Socio'} · {session.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            Cerrar sesión
          </button>
        </header>

        {isStaff ? (
          <div className="space-y-4">
            <div
              role="tablist"
              aria-label="Secciones de gestión"
              className="flex gap-1 rounded-xl border border-white/10 bg-slate-900/70 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={staffView === 'members'}
                onClick={() => setStaffView('members')}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  staffView === 'members'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                Socios
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={staffView === 'payments'}
                onClick={() => setStaffView('payments')}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  staffView === 'payments'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                Pagos e ingresos
              </button>
            </div>

            {staffView === 'members' ? (
              <MemberDirectory viewer={session} />
            ) : (
              <PaymentsPanel viewer={session} />
            )}
          </div>
        ) : (
          <OwnProfile
            session={session}
            onSessionChange={onSessionChange}
          />
        )}
      </div>
    </main>
  )
}

function Login() {
  const [mode, setMode] = useState('login')
  const [session, setSession] = useState(getCurrentSession)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [registeredAccount, setRegisteredAccount] = useState(null)
  const [registrationNotice, setRegistrationNotice] = useState(false)

  function switchMode(nextMode) {
    setMode(nextMode)
    setFormError('')

    if (nextMode === 'register') {
      setRegistrationNotice(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
    setFormError('')
  }

  function handleRegistered(account) {
    setRegisteredAccount({ email: account.email })
    setForm({ email: account.email, password: '' })
    setErrors({})
    setFormError('')
    setRegistrationNotice(true)
    setMode('login')
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

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const account = await verifyCredentials(form.email, form.password)

      if (!account) {
        setFormError(
          'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.',
        )
        return
      }

      setRegistrationNotice(false)
      setSession(startSession(account))
    } catch {
      setFormError(
        'No pudimos validar tus credenciales en este momento. Inténtalo más tarde.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (session) {
    return (
      <Workspace
        session={session}
        onSessionChange={(updated) => setSession(startSession(updated))}
        onLogout={() => {
          endSession()
          setSession(null)
          setMode('login')
          setRegistrationNotice(false)
          setForm((previous) => ({ ...previous, password: '' }))
        }}
      />
    )
  }

  const isRegistering = mode === 'register'

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

      <div
        className={`relative w-full ${isRegistering ? 'max-w-2xl' : 'max-w-md'}`}
      >
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
            {isRegistering ? 'Crea tu cuenta de socio' : 'Acceso de socios'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isRegistering
              ? 'Regístrate para gestionar tu membresía y reservar entrenamientos.'
              : 'Consulta tu membresía y tus rutinas de entrenamiento.'}
          </p>
        </header>

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-slate-900/60 p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            aria-pressed={!isRegistering}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              !isRegistering
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            aria-pressed={isRegistering}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              isRegistering
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Crear cuenta
          </button>
        </div>

        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
          {isRegistering ? (
            <RegisterForm onRegistered={handleRegistered} />
          ) : (
            <form noValidate onSubmit={handleSubmit} className="space-y-5">
              {registrationNotice && !registeredAccount && (
                <Alert
                  tone="success"
                  message="Cuenta creada correctamente. Inicia sesión con tu correo y contraseña."
                />
              )}

              {formError && <Alert code={401} message={formError} />}

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
                  <p
                    id="email-error"
                    role="alert"
                    className="mt-2 text-sm text-red-400"
                  >
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
          )}

          {!isRegistering && (
            <div className="mt-6 space-y-1 rounded-lg border border-dashed border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-slate-400">
              <p className="font-semibold text-slate-300">Cuentas demo</p>
              <p>
                Socio: {DEMO_ACCOUNT.email} · {DEMO_ACCOUNT.password}
              </p>
              <p>
                Recepción: {DEMO_STAFF.receptionist.email} ·{' '}
                {DEMO_STAFF.receptionist.password}
              </p>
              <p>
                Admin: {DEMO_STAFF.admin.email} · {DEMO_STAFF.admin.password}
              </p>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          ¿Problemas para acceder? Contacta a la recepción del gimnasio.
        </p>
        <p className="mt-3 text-center text-xs text-slate-500">
          El panel de recepción requiere una cuenta de administrador o
          recepcionista.
        </p>
      </div>

      {registeredAccount && (
        <SuccessModal
          email={registeredAccount.email}
          onClose={() => setRegisteredAccount(null)}
        />
      )}
    </main>
  )
}

export default Login
