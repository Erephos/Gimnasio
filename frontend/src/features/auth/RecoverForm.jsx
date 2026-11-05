import { useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import Field from '../../components/ui/Field.jsx'
import Input from '../../components/ui/Input.jsx'
import { CheckIcon, WarningIcon } from '../../components/ui/icons.jsx'
import { errorMessage } from '../../services/api.js'
import { requestPasswordReset } from '../../services/auth.js'
import { normalizeEmail, validateEmail } from '../../utils/validators.js'

function RecoverForm({ onBack }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const emailError = validateEmail(email)
    setError(emailError)
    if (emailError) return

    setIsSubmitting(true)
    setFormError('')
    try {
      const response = await requestPasswordReset(normalizeEmail(email))
      setMessage(response?.mensaje ?? 'Si el correo está registrado, recibirás las instrucciones.')
    } catch (requestError) {
      setFormError(errorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-slate-400">
        Escribe el correo de tu cuenta. Si existe, te enviaremos un enlace temporal para crear una nueva contraseña.
      </p>

      {formError && (
        <Alert tone="error" icon={<WarningIcon className="mt-0.5 h-5 w-5 shrink-0" />}>
          {formError}
        </Alert>
      )}
      {message && (
        <Alert tone="success" icon={<CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />}>
          {message}
        </Alert>
      )}

      <Field id="recover-email" label="Correo electrónico" density="comfortable" error={error} errorId="recover-email-error">
        <Input
          id="recover-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          size="md"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setError('')
          }}
          invalid={Boolean(error)}
        />
      </Field>

      <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={isSubmitting}>
        Enviar enlace
      </Button>
      <Button type="button" variant="ghostMuted" size="md" fullWidth onClick={onBack}>
        Volver a iniciar sesión
      </Button>
    </form>
  )
}

export default RecoverForm
