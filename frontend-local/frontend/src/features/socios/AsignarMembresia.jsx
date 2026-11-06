import { useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import Field from '../../components/ui/Field.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { errorMessage } from '../../services/api.js'
import { assignMembresia } from '../../services/membresias.js'
import { listPlanes } from '../../services/planes.js'
import { formatCurrency } from '../../utils/format.js'
import { todayLima } from '../../utils/dates.js'

function AsignarMembresia({ socioId, onAssigned }) {
  const planes = useAsync(listPlanes, [])
  const [planId, setPlanId] = useState('')
  const [fechaInicio, setFechaInicio] = useState(todayLima())
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!planId) {
      setError('Selecciona un plan.')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await assignMembresia({ socioId, planId: Number(planId), fechaInicio })
      setPlanId('')
      onAssigned()
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="mt-4 space-y-3 rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-4"
    >
      <h4 className="text-sm font-semibold text-white">Asignar membresía</h4>
      {error && <Alert tone="error" message={error} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="assign-plan" label="Plan">
          <Select id="assign-plan" value={planId} onChange={(event) => setPlanId(event.target.value)}>
            <option value="">Selecciona un plan</option>
            {(planes.data ?? []).map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.nombre} · {plan.duracionDias} días · {formatCurrency(plan.precio)}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="assign-start" label="Fecha de inicio" hint="No puede ser anterior a hoy.">
          <Input
            id="assign-start"
            type="date"
            min={todayLima()}
            value={fechaInicio}
            onChange={(event) => setFechaInicio(event.target.value)}
          />
        </Field>
      </div>
      <Button type="submit" size="sm" loading={isSaving} disabled={isSaving || planes.loading}>
        Asignar membresía
      </Button>
    </form>
  )
}

export default AsignarMembresia
