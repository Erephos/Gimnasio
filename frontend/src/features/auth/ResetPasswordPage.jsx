import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import Field from '../../components/ui/Field.jsx'
import Input from '../../components/ui/Input.jsx'
import { CheckIcon, WarningIcon } from '../../components/ui/icons.jsx'
import { errorMessage } from '../../services/api.js'
import { resetPassword } from '../../services/auth.js'
import { validatePassword } from '../../utils/validators.js'
import AuthShell from './AuthShell.jsx'

// El backend arma el enlace como /?token=...#/restablecer, así que el token
// puede venir en la URL real o dentro del hash.
function readToken(searchParams) {
  return searchParams.get('token') ?? new URLSearchParams(window.location.search).get('token') ?? ''
}

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = readToken(searchParams)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [done, setDone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    const passwordError = validatePassword(password)
    if (passwordError) nextErrors.password = passwordError
    if (confirm !== password) nextErrors.confirm = 'Las contraseñas no coinciden.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    setFormError('')
    try {
      await resetPassword({ token, nuevaPassword: password })
      setDone(true)
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell title="Nueva contraseña" subtitle="Elige una contraseña nueva para tu cuenta.">
      <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
        {done ? (
          <div className="space-y-5">
            <Alert tone="success" icon={<CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />}>
              Tu contraseña se actualizó correctamente.
            </Alert>
            <Link
              to="/login"
              className="block rounded-lg bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        ) : !token ? (
          <Alert tone="error" icon={<WarningIcon className="mt-0.5 h-5 w-5 shrink-0" />}>
            El enlace no es válido. Solicita uno nuevo desde la pantalla de inicio de sesión.
          </Alert>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <Alert tone="error" icon={<WarningIcon className="mt-0.5 h-5 w-5 shrink-0" />}>
                {formError}
              </Alert>
            )}
            <Field id="new-password" label="Nueva contraseña" density="comfortable" error={errors.password} hint="Mínimo 8 caracteres.">
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                size="md"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                invalid={Boolean(errors.password)}
              />
            </Field>
            <Field id="confirm-password" label="Repite la contraseña" density="comfortable" error={errors.confirm}>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                size="md"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                invalid={Boolean(errors.confirm)}
              />
            </Field>
            <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={isSubmitting}>
              Guardar contraseña
            </Button>
          </form>
        )}
      </section>
    </AuthShell>
  )
}

export default ResetPasswordPage
