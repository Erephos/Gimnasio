import { useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import Field from '../../components/ui/Field.jsx'
import InfoBox from '../../components/ui/InfoBox.jsx'
import Input from '../../components/ui/Input.jsx'
import { errorMessage } from '../../services/api.js'
import { updateSocio } from '../../services/socios.js'
import { compactErrors, normalizeEmail, validateDni, validateEmail, validatePhone } from '../../utils/validators.js'

function SocioEditForm({ socio, canEditDni = false, onCancel, onSaved }) {
  const [draft, setDraft] = useState({
    correo: socio.correo ?? '',
    telefono: socio.telefono ?? '',
    direccion: socio.direccion ?? '',
    contactoEmergencia: socio.contactoEmergencia ?? '',
    dni: socio.dni ?? '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setDraft((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = compactErrors({
      correo: validateEmail(draft.correo),
      telefono: validatePhone(draft.telefono),
      dni: canEditDni ? validateDni(draft.dni) : '',
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const body = {
      correo: normalizeEmail(draft.correo),
      telefono: draft.telefono.trim() || null,
      direccion: draft.direccion.trim() || null,
      contactoEmergencia: draft.contactoEmergencia.trim() || null,
    }
    if (canEditDni && draft.dni.trim() !== socio.dni) body.dni = draft.dni.trim()

    setIsSaving(true)
    setFormError('')
    try {
      onSaved(await updateSocio(socio.id, body))
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const input = (name, label, props = {}) => (
    <Field id={`edit-${name}`} label={label} error={errors[name]}>
      <Input
        id={`edit-${name}`}
        name={name}
        value={draft[name]}
        onChange={handleChange}
        invalid={Boolean(errors[name])}
        {...props}
      />
    </Field>
  )

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      {formError && <Alert tone="error" message={formError} />}
      <div className="grid gap-4 sm:grid-cols-2">
        {input('correo', 'Correo electrónico', { type: 'email' })}
        {input('telefono', 'Teléfono', { inputMode: 'numeric', maxLength: 9 })}
        {input('direccion', 'Dirección')}
        {input('contactoEmergencia', 'Contacto de emergencia')}
        {canEditDni && input('dni', 'DNI', { inputMode: 'numeric', maxLength: 8 })}
      </div>
      {!canEditDni && <InfoBox>El DNI solo puede corregirlo un administrador.</InfoBox>}
      <div className="flex gap-2">
        <Button type="submit" loading={isSaving} disabled={isSaving}>
          Guardar cambios
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export default SocioEditForm
