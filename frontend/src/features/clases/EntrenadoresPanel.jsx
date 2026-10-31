import { useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import DataState from '../../components/ui/DataState.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Field from '../../components/ui/Field.jsx'
import Input from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
import SectionHeader from '../../components/ui/SectionHeader.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { errorMessage } from '../../services/api.js'
import { createEntrenador, listEntrenadores } from '../../services/usuarios.js'
import {
  compactErrors,
  normalizeEmail,
  validateDni,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from '../../utils/validators.js'

const EMPTY = { nombre: '', apellido: '', correo: '', password: '', dni: '', telefono: '', especialidad: '' }

function EntrenadorForm({ onClose, onSaved }) {
  const [draft, setDraft] = useState(EMPTY)
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
      nombre: validateName(draft.nombre),
      apellido: validateName(draft.apellido, 'El apellido'),
      correo: validateEmail(draft.correo),
      password: validatePassword(draft.password),
      dni: validateDni(draft.dni),
      telefono: validatePhone(draft.telefono),
      especialidad: draft.especialidad.trim() ? (draft.especialidad.trim().length > 50 ? 'Máximo 50 caracteres.' : '') : 'La especialidad es obligatoria.',
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    setFormError('')
    try {
      await createEntrenador({
        nombre: draft.nombre.trim(),
        apellido: draft.apellido.trim(),
        correo: normalizeEmail(draft.correo),
        password: draft.password,
        dni: draft.dni.trim(),
        telefono: draft.telefono.trim() || null,
        especialidad: draft.especialidad.trim(),
      })
      onSaved()
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const field = (name, label, props = {}) => (
    <Field id={`ent-${name}`} label={label} error={errors[name]}>
      <Input id={`ent-${name}`} name={name} value={draft[name]} onChange={handleChange} invalid={Boolean(errors[name])} {...props} />
    </Field>
  )

  return (
    <Modal size="lg" title="Registrar entrenador" onClose={onClose}>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        {formError && <Alert tone="error" message={formError} />}
        <div className="grid gap-4 sm:grid-cols-2">
          {field('nombre', 'Nombre')}
          {field('apellido', 'Apellido')}
          {field('dni', 'DNI', { inputMode: 'numeric', maxLength: 8 })}
          {field('telefono', 'Teléfono (opcional)', { inputMode: 'numeric', maxLength: 9 })}
          {field('correo', 'Correo electrónico', { type: 'email' })}
          {field('password', 'Contraseña inicial', { type: 'password', autoComplete: 'new-password' })}
          <div className="sm:col-span-2">{field('especialidad', 'Especialidad', { placeholder: 'Ej. Funcional, Yoga' })}</div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" loading={isSaving} disabled={isSaving}>
            Registrar entrenador
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function EntrenadoresPanel({ canCreate }) {
  const { data, error, loading, reload } = useAsync(() => listEntrenadores({ size: 50 }), [])
  const [showForm, setShowForm] = useState(false)
  const entrenadores = data?.content ?? []

  return (
    <Card as="section" padding="none">
      <SectionHeader
        divided
        title="Entrenadores"
        description="Personal que puede dictar clases."
        action={canCreate && <Button size="sm" onClick={() => setShowForm(true)}>Registrar entrenador</Button>}
      />

      <DataState loading={loading} error={error} hasData={Boolean(data)} onRetry={reload}>
        {entrenadores.length === 0 ? (
          <EmptyState title="Aún no hay entrenadores registrados" />
        ) : (
          <ul className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            {entrenadores.map((item) => (
              <li key={item.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-white">{item.nombreCompleto}</p>
                  <Badge tone={item.activo ? 'emerald' : 'neutral'}>{item.activo ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-300">{item.especialidad}</p>
                <p className="mt-1 text-xs text-slate-500">{item.correo}</p>
              </li>
            ))}
          </ul>
        )}
      </DataState>

      {showForm && (
        <EntrenadorForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            reload()
          }}
        />
      )}
    </Card>
  )
}

export default EntrenadoresPanel
