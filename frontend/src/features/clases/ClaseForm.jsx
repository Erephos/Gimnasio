import { useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import Field from '../../components/ui/Field.jsx'
import Input from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Select from '../../components/ui/Select.jsx'
import { AULAS } from '../../config/constants.js'
import { useAsync } from '../../hooks/useAsync.js'
import { errorMessage } from '../../services/api.js'
import { createClase } from '../../services/clases.js'
import { listEntrenadores } from '../../services/usuarios.js'
import { limaLocalToIso } from '../../utils/dates.js'

function ClaseForm({ onClose, onSaved }) {
  const entrenadores = useAsync(() => listEntrenadores({ size: 50 }), [])
  const [draft, setDraft] = useState({ disciplina: '', entrenadorId: '', aula: AULAS[0], inicio: '', fin: '', aforo: '' })
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
    const nextErrors = {}
    if (!draft.disciplina.trim()) nextErrors.disciplina = 'La disciplina es obligatoria.'
    else if (draft.disciplina.trim().length > 30) nextErrors.disciplina = 'Máximo 30 caracteres.'
    if (!draft.entrenadorId) nextErrors.entrenadorId = 'Selecciona un entrenador.'
    if (!draft.aula.trim()) nextErrors.aula = 'El aula es obligatoria.'
    if (!draft.inicio) nextErrors.inicio = 'Indica cuándo empieza.'
    if (!draft.fin) nextErrors.fin = 'Indica cuándo termina.'
    if (draft.inicio && draft.fin && draft.fin <= draft.inicio) nextErrors.fin = 'El fin debe ser posterior al inicio.'
    if (!Number.isInteger(Number(draft.aforo)) || Number(draft.aforo) <= 0) nextErrors.aforo = 'Ingresa un aforo entero mayor a 0.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    setFormError('')
    try {
      await createClase({
        disciplina: draft.disciplina.trim(),
        entrenadorId: Number(draft.entrenadorId),
        aula: draft.aula.trim(),
        inicio: limaLocalToIso(draft.inicio),
        fin: limaLocalToIso(draft.fin),
        aforo: Number(draft.aforo),
      })
      onSaved()
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const activos = (entrenadores.data?.content ?? []).filter((item) => item.activo)

  return (
    <Modal size="lg" title="Programar clase" description="Los horarios se guardan en hora de Perú." onClose={onClose}>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        {formError && <Alert tone="error" message={formError} />}
        {entrenadores.error && <Alert tone="error" message={entrenadores.error} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="clase-disciplina" label="Disciplina" error={errors.disciplina}>
            <Input id="clase-disciplina" name="disciplina" value={draft.disciplina} onChange={handleChange} invalid={Boolean(errors.disciplina)} placeholder="Ej. Spinning" />
          </Field>
          <Field id="clase-entrenador" label="Entrenador" error={errors.entrenadorId} hint={!entrenadores.loading && activos.length === 0 ? 'Primero registra un entrenador.' : undefined}>
            <Select id="clase-entrenador" name="entrenadorId" value={draft.entrenadorId} onChange={handleChange} invalid={Boolean(errors.entrenadorId)}>
              <option value="">Selecciona un entrenador</option>
              {activos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombreCompleto} · {item.especialidad}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="clase-aula" label="Aula" error={errors.aula}>
            <Input id="clase-aula" name="aula" list="aulas" value={draft.aula} onChange={handleChange} invalid={Boolean(errors.aula)} />
            <datalist id="aulas">
              {AULAS.map((aula) => (
                <option key={aula} value={aula} />
              ))}
            </datalist>
          </Field>
          <Field id="clase-aforo" label="Aforo" error={errors.aforo}>
            <Input id="clase-aforo" name="aforo" type="number" min="1" step="1" value={draft.aforo} onChange={handleChange} invalid={Boolean(errors.aforo)} />
          </Field>
          <Field id="clase-inicio" label="Inicio" error={errors.inicio}>
            <Input id="clase-inicio" name="inicio" type="datetime-local" value={draft.inicio} onChange={handleChange} invalid={Boolean(errors.inicio)} />
          </Field>
          <Field id="clase-fin" label="Fin" error={errors.fin}>
            <Input id="clase-fin" name="fin" type="datetime-local" value={draft.fin} onChange={handleChange} invalid={Boolean(errors.fin)} />
          </Field>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" loading={isSaving} disabled={isSaving}>
            Programar clase
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ClaseForm
