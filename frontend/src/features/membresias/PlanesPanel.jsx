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
import { ROLES } from '../../config/roles.js'
import { useAsync } from '../../hooks/useAsync.js'
import { errorMessage } from '../../services/api.js'
import { createPlan, listAllPlanes, listPlanes, setPlanActivo, updatePlan } from '../../services/planes.js'
import { formatCurrency } from '../../utils/format.js'
import { useAuth } from '../auth/useAuth.js'

function PlanForm({ plan, onClose, onSaved }) {
  const [draft, setDraft] = useState({
    nombre: plan?.nombre ?? '',
    precio: plan?.precio ?? '',
    duracionDias: plan?.duracionDias ?? '',
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
    const nextErrors = {}
    if (!draft.nombre.trim()) nextErrors.nombre = 'El nombre es obligatorio.'
    else if (draft.nombre.trim().length > 30) nextErrors.nombre = 'Máximo 30 caracteres.'
    if (!(Number(draft.precio) > 0)) nextErrors.precio = 'Ingresa un precio mayor a 0.'
    if (!Number.isInteger(Number(draft.duracionDias)) || Number(draft.duracionDias) <= 0) {
      nextErrors.duracionDias = 'Ingresa una duración entera en días.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const body = {
      nombre: draft.nombre.trim(),
      precio: Number(Number(draft.precio).toFixed(2)),
      duracionDias: Number(draft.duracionDias),
    }

    setIsSaving(true)
    setFormError('')
    try {
      if (plan) await updatePlan(plan.id, body)
      else await createPlan(body)
      onSaved()
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal title={plan ? 'Editar plan' : 'Nuevo plan'} onClose={onClose}>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        {formError && <Alert tone="error" message={formError} />}
        <Field id="plan-nombre" label="Nombre" error={errors.nombre}>
          <Input id="plan-nombre" name="nombre" value={draft.nombre} onChange={handleChange} invalid={Boolean(errors.nombre)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="plan-precio" label="Precio (S/)" error={errors.precio}>
            <Input id="plan-precio" name="precio" type="number" min="0" step="0.01" value={draft.precio} onChange={handleChange} invalid={Boolean(errors.precio)} />
          </Field>
          <Field id="plan-duracion" label="Duración (días)" error={errors.duracionDias}>
            <Input id="plan-duracion" name="duracionDias" type="number" min="1" step="1" value={draft.duracionDias} onChange={handleChange} invalid={Boolean(errors.duracionDias)} />
          </Field>
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" loading={isSaving} disabled={isSaving}>
            Guardar plan
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function PlanesPanel() {
  const { user } = useAuth()
  const isAdmin = user.rol === ROLES.ADMIN
  const { data, error, loading, reload } = useAsync(isAdmin ? listAllPlanes : listPlanes, [isAdmin])
  const [editing, setEditing] = useState(undefined) // undefined: cerrado, null: nuevo, objeto: edición
  const [actionError, setActionError] = useState('')

  async function toggle(plan) {
    setActionError('')
    try {
      await setPlanActivo(plan.id, !plan.activo)
      reload()
    } catch (requestError) {
      setActionError(errorMessage(requestError))
    }
  }

  const planes = data ?? []

  return (
    <Card as="section" padding="none">
      <SectionHeader
        divided
        title="Planes de membresía"
        description="El precio de cada membresía se congela al momento de asignarla."
        action={isAdmin && <Button size="sm" onClick={() => setEditing(null)}>Nuevo plan</Button>}
      />

      {actionError && (
        <div className="p-4 sm:px-6">
          <Alert tone="error" message={actionError} />
        </div>
      )}

      <DataState loading={loading} error={error} hasData={Boolean(data)} onRetry={reload}>
        {planes.length === 0 ? (
          <EmptyState title="Aún no hay planes" description={isAdmin ? 'Crea el primer plan para poder asignar membresías.' : 'Pide a un administrador que cree los planes.'} />
        ) : (
          <ul className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            {planes.map((plan) => (
              <li key={plan.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-white">{plan.nombre}</h3>
                  <Badge tone={plan.activo ? 'emerald' : 'neutral'}>{plan.activo ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                <p className="mt-2 text-2xl font-bold text-emerald-300">{formatCurrency(plan.precio)}</p>
                <p className="text-xs text-slate-400">{plan.duracionDias} días de acceso</p>
                {isAdmin && (
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(plan)}>
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggle(plan)}>
                      {plan.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </DataState>

      {editing !== undefined && (
        <PlanForm
          plan={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined)
            reload()
          }}
        />
      )}
    </Card>
  )
}

export default PlanesPanel
