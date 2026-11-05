import { useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import Field from '../../components/ui/Field.jsx'
import Input from '../../components/ui/Input.jsx'
import InputAction from '../../components/ui/InputAction.jsx'
import { WarningIcon } from '../../components/ui/icons.jsx'
import { errorMessage } from '../../services/api.js'
import { normalizeEmail, validateEmail } from '../../utils/validators.js'
import { useAuth } from './useAuth.js'

function LoginForm({ initialEmail = '', onLoggedIn, onForgot }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: initialEmail, password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    const emailError = validateEmail(form.email)
    if (emailError) nextErrors.email = emailError
    if (!form.password) nextErrors.password = 'La contraseña es obligatoria.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      const session = await login({ correo: normalizeEmail(form.email), password: form.password })
      onLoggedIn(session)
    } catch (error) {
      setFormError(errorMessage(error))
      setIsSubmitting(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <Alert tone="error" icon={<WarningIcon className="mt-0.5 h-5 w-5 shrink-0" />}>
          {formError}
        </Alert>
      )}

      <Field id="email" label="Correo electrónico" density="comfortable" error={errors.email} errorId="email-error">
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

      <Field id="password" label="Contraseña" density="comfortable" error={errors.password} errorId="password-error">
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            size="md"
            className="pr-20"
            placeholder="Tu contraseña"
            value={form.password}
            onChange={handleChange}
            invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <InputAction
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </InputAction>
        </div>
      </Field>

      <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={isSubmitting}>
        {isSubmitting ? 'Validando…' : 'Iniciar sesión'}
      </Button>

      <p className="text-center text-xs text-slate-500">
        <button
          type="button"
          onClick={onForgot}
          className="font-medium text-emerald-400 transition hover:text-emerald-300"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </p>
    </form>
  )
}

export default LoginForm
