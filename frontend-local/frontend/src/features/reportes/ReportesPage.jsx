import { useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import DataState from '../../components/ui/DataState.jsx'
import Field from '../../components/ui/Field.jsx'
import Input from '../../components/ui/Input.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import StatGrid from '../../components/ui/StatGrid.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { getResumen } from '../../services/reportes.js'
import { formatDate, todayLima } from '../../utils/dates.js'
import { formatCurrency } from '../../utils/format.js'

function ReportesPage() {
  const today = todayLima()
  const [range, setRange] = useState({ desde: `${today.slice(0, 7)}-01`, hasta: today })
  const [draft, setDraft] = useState(range)
  const { data, error, loading, reload } = useAsync(() => getResumen(range), [range.desde, range.hasta])

  const invalid = !draft.desde || !draft.hasta || draft.desde > draft.hasta || draft.hasta > today

  return (
    <>
      <PageHeader
        title="Reportes"
        description="Resumen de ingresos, pagos, asistencias, membresías y altas en el periodo que elijas."
      />

      <Card as="section">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (!invalid) setRange(draft)
          }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <Field id="rep-desde" label="Desde">
            <Input id="rep-desde" type="date" max={today} value={draft.desde} onChange={(event) => setDraft((previous) => ({ ...previous, desde: event.target.value }))} />
          </Field>
          <Field id="rep-hasta" label="Hasta" error={invalid && draft.desde && draft.hasta ? 'Revisa el rango: "desde" no puede ser posterior a "hasta" ni a hoy.' : undefined}>
            <Input id="rep-hasta" type="date" max={today} value={draft.hasta} onChange={(event) => setDraft((previous) => ({ ...previous, hasta: event.target.value }))} />
          </Field>
          <Button type="submit" disabled={invalid}>
            Actualizar
          </Button>
        </form>
      </Card>

      <DataState loading={loading} error={error} hasData={Boolean(data)} onRetry={reload}>
        {data && (
          <section className="space-y-3" aria-label="Resumen del periodo">
            <p className="text-sm text-slate-400">
              Del {formatDate(data.desde)} al {formatDate(data.hasta)}
            </p>
            <StatGrid
              items={[
                { label: 'Ingresos registrados', value: formatCurrency(data.ingresosRegistrados) },
                { label: 'Pagos registrados', value: data.pagosRegistrados },
                { label: 'Asistencias', value: data.asistencias },
                { label: 'Socios nuevos', value: data.sociosNuevos },
                { label: 'Membresías vigentes', value: data.membresiasVigentes },
                { label: 'Membresías vencidas', value: data.membresiasVencidas },
              ]}
            />
          </section>
        )}
      </DataState>
    </>
  )
}

export default ReportesPage
