import { useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Field from '../../components/ui/Field.jsx'
import Input from '../../components/ui/Input.jsx'
import SectionHeader from '../../components/ui/SectionHeader.jsx'
import { errorMessage } from '../../services/api.js'
import { changeOwnPassword } from '../../services/auth.js'
import { validatePassword } from '../../utils/validators.js'

const EMPTY = { actual: '', nueva: '', repetir: '' }

function CambiarPassword() {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
    setNotice('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!form.actual) nextErrors.actual = 'Ingresa tu contraseña actual.'
    const newError = validatePassword(form.nueva)
    if (newError) nextErrors.nueva = newError
    if (form.repetir !== form.nueva) nextErrors.repetir = 'Las contraseñas no coinciden.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    setFormError('')
    try {
      await changeOwnPassword({ passwordActual: form.actual, passwordNueva: form.nueva })
      setForm(EMPTY)
      setNotice('Tu contraseña se actualizó correctamente.')
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const field = (name, label) => (
    <Field id={`pw-${name}`} label={label} error={errors[name]}>
      <Input id={`pw-${name}`} name={name} type="password" autoComplete={name === 'actual' ? 'current-password' : 'new-password'} value={form[name]} onChange={handleChange} invalid={Boolean(errors[name])} />
    </Field>
  )

  return (
    <Card as="section" padding="none">
      <SectionHeader divided title="Cambiar contraseña" description="Usa al menos 8 caracteres." />
      <form noValidate onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
        {formError && <Alert tone="error" message={formError} />}
        {notice && <Alert tone="success" message={notice} />}
        <div className="grid gap-4 sm:grid-cols-3">
          {field('actual', 'Contraseña actual')}
          {field('nueva', 'Contraseña nueva')}
          {field('repetir', 'Repite la nueva')}
        </div>
        <Button type="submit" size="sm" loading={isSaving} disabled={isSaving}>
          Guardar contraseña
        </Button>
      </form>
    </Card>
  )
}

export default CambiarPassword
