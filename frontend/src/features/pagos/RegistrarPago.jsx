import { useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import SocioPicker from '../../components/shared/SocioPicker.jsx'
import Card from '../../components/ui/Card.jsx'
import Field from '../../components/ui/Field.jsx'
import InfoBox from '../../components/ui/InfoBox.jsx'
import Input from '../../components/ui/Input.jsx'
import SectionHeader from '../../components/ui/SectionHeader.jsx'
import Select from '../../components/ui/Select.jsx'
import { METODOS_PAGO } from '../../config/constants.js'
import { useAsync } from '../../hooks/useAsync.js'
import { errorMessage } from '../../services/api.js'
import { listMembresiasBySocio } from '../../services/membresias.js'
import { createPago, listPagosByMembresia } from '../../services/pagos.js'
import { formatDate } from '../../utils/dates.js'
import { formatCurrency } from '../../utils/format.js'

function PaymentForm({ socio, onChangeSocio, onRegistered }) {
  const membresias = useAsync(() => listMembresiasBySocio(socio.id), [socio.id])
  const [membresiaId, setMembresiaId] = useState('')
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState(METODOS_PAGO[0].value)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const pagos = useAsync(
    () => (membresiaId ? listPagosByMembresia(membresiaId) : Promise.resolve([])),
    [membresiaId],
  )

  const selected = (membresias.data ?? []).find((item) => String(item.id) === membresiaId)
  const paid = (pagos.data ?? [])
    .filter((pago) => pago.estado === 'REGISTRADO')
    .reduce((sum, pago) => sum + pago.monto, 0)
  const balance = selected ? Math.max(0, Number(selected.precioPagado) - paid) : 0

  function handleMembresiaChange(event) {
    setMembresiaId(event.target.value)
    setMonto('')
    setError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!membresiaId) return setError('Selecciona la membresía que se está pagando.')
    const amount = Number(monto)
    if (!(amount > 0)) return setError('Ingresa un monto mayor a 0.')
    if (amount > balance + 0.00001) return setError(`El monto excede el saldo pendiente (${formatCurrency(balance)}).`)

    setIsSaving(true)
    setError('')
    try {
      const pago = await createPago({
        membresiaId: Number(membresiaId),
        monto: Number(amount.toFixed(2)),
        metodo,
      })
      setSuccess(`Pago de ${formatCurrency(pago.monto)} registrado para ${pago.socioNombre}.`)
      setMonto('')
      pagos.reload()
      onRegistered()
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2">
        <div>
          <p className="text-sm font-medium text-white">{socio.nombreCompleto}</p>
          <p className="font-mono text-xs text-slate-500">{socio.dni}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onChangeSocio}>
          Cambiar
        </Button>
      </div>

      {error && <Alert tone="error" message={error} />}
      {success && <Alert tone="success" message={success} />}

      {membresias.error && <Alert tone="error" message={membresias.error} />}
      {membresias.data?.length === 0 && (
        <InfoBox tone="warning">Este socio no tiene membresías. Asígnale una desde la sección de socios.</InfoBox>
      )}

      <Field id="pay-membresia" label="Membresía">
        <Select id="pay-membresia" value={membresiaId} onChange={handleMembresiaChange}>
          <option value="">Selecciona una membresía</option>
          {(membresias.data ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.planNombre} · {formatDate(item.fechaInicio)} → {formatDate(item.fechaFin)} · {formatCurrency(item.precioPagado)}
            </option>
          ))}
        </Select>
      </Field>

      {selected && !pagos.loading && (
        <InfoBox tone={balance > 0 ? 'info' : 'success'} label="Saldo">
          Precio {formatCurrency(selected.precioPagado)} · Pagado {formatCurrency(paid)} · Pendiente {formatCurrency(balance)}
        </InfoBox>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="pay-monto" label="Monto (S/)">
          <Input
            id="pay-monto"
            type="number"
            min="0"
            step="0.01"
            value={monto}
            onChange={(event) => setMonto(event.target.value)}
            placeholder={selected && balance > 0 ? balance.toFixed(2) : ''}
          />
        </Field>
        <Field id="pay-metodo" label="Método">
          <Select id="pay-metodo" value={metodo} onChange={(event) => setMetodo(event.target.value)}>
            {METODOS_PAGO.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Button type="submit" size="lg" fullWidth loading={isSaving} disabled={isSaving || !membresiaId || balance <= 0}>
        Registrar pago
      </Button>
    </form>
  )
}

function RegistrarPago({ onRegistered }) {
  const [socio, setSocio] = useState(null)

  return (
    <Card as="section" className="lg:col-span-2">
      <SectionHeader title="Registrar pago" description="Elige al socio y la membresía a la que corresponde el abono." descriptionClassName="mt-1 text-sm text-slate-400" />
      <div className="mt-4">
        {socio ? (
          <PaymentForm key={socio.id} socio={socio} onChangeSocio={() => setSocio(null)} onRegistered={onRegistered} />
        ) : (
          <SocioPicker id="pay-socio" onPick={setSocio} />
        )}
      </div>
    </Card>
  )
}

export default RegistrarPago
