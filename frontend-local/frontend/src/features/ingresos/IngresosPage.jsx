import { useEffect, useRef, useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeaderCell,
  DataTableHeaderRow,
  DataTableRow,
} from '../../components/ui/DataTable.jsx'
import DataState from '../../components/ui/DataState.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Field from '../../components/ui/Field.jsx'
import InputAction from '../../components/ui/InputAction.jsx'
import Input from '../../components/ui/Input.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Pagination from '../../components/ui/Pagination.jsx'
import SectionHeader from '../../components/ui/SectionHeader.jsx'
import StatGrid from '../../components/ui/StatGrid.jsx'
import { LIMA_TIME_ZONE } from '../../config/constants.js'
import { useAsync } from '../../hooks/useAsync.js'
import { ApiError, errorMessage } from '../../services/api.js'
import { listAsistencias, registerAsistencia } from '../../services/asistencias.js'
import { getResumen } from '../../services/reportes.js'
import { formatDateLong, formatTime, todayLima } from '../../utils/dates.js'
import { validateDni } from '../../utils/validators.js'
import DniPreview from './DniPreview.jsx'

function useLimaClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return now
}

function IngresosPage() {
  const now = useLimaClock()
  const today = todayLima(now)
  const inputRef = useRef(null)
  const [dni, setDni] = useState('')
  const [dniError, setDniError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [page, setPage] = useState(0)

  const lista = useAsync(() => listAsistencias({ fecha: today, page, size: 10 }), [today, page])
  const resumen = useAsync(() => getResumen({ desde: today, hasta: today }), [today])

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validateDni(dni)
    setDniError(validation)
    setFeedback(null)
    if (validation) return

    setIsSaving(true)
    try {
      const asistencia = await registerAsistencia(dni.trim())
      setFeedback({
        tone: 'success',
        code: 201,
        title: 'Ingreso registrado',
        message: `${asistencia.socioNombre} ingresó a las ${formatTime(asistencia.horaEntrada)}. Membresía vigente hasta el ${formatDateLong(asistencia.membresiaVigenteHasta)}.`,
      })
      setDni('')
      setPage(0)
      lista.reload()
      resumen.reload()
      inputRef.current?.focus()
    } catch (error) {
      setFeedback({
        tone: 'error',
        code: error instanceof ApiError ? error.status : undefined,
        title: 'No se pudo registrar el ingreso',
        message: errorMessage(error),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const ingresos = lista.data?.content ?? []
  const stats = resumen.data

  return (
    <>
      <PageHeader
        layout="split"
        title="Control de ingresos"
        description="Registra el ingreso diario de los socios con su DNI. El sistema valida que la cuenta esté activa y que la membresía esté vigente."
        actions={
          <Card radius="xl" padding="tight">
            <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">Hora de Perú · {LIMA_TIME_ZONE}</p>
            <p className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-emerald-300">{formatTime(now, true)}</p>
            <p className="text-xs text-slate-400">{formatDateLong(today)}</p>
          </Card>
        }
      />

      <StatGrid
        items={[
          { label: 'Ingresos hoy', value: stats?.asistencias ?? '—' },
          { label: 'Membresías vigentes', value: stats?.membresiasVigentes ?? '—' },
          { label: 'Membresías vencidas', value: stats?.membresiasVencidas ?? '—' },
          { label: 'Socios nuevos hoy', value: stats?.sociosNuevos ?? '—' },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card as="section" className="lg:col-span-2">
          <SectionHeader
            title="Registrar ingreso"
            description="Ingresa el DNI de 8 dígitos del socio."
            descriptionClassName="mt-1 text-sm text-slate-400"
          />

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
            <Field id="dni" label="DNI del socio" error={dniError} errorId="dni-error" hint="Solo números, sin espacios ni guiones.">
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="dni"
                  name="dni"
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  maxLength={8}
                  size="md"
                  className="pr-24"
                  placeholder="Ej. 45678901"
                  value={dni}
                  onChange={(event) => {
                    setDni(event.target.value.replace(/\D/g, ''))
                    setDniError('')
                    setFeedback(null)
                  }}
                  invalid={Boolean(dniError)}
                />
                {dni && <InputAction onClick={() => { setDni(''); inputRef.current?.focus() }}>Limpiar</InputAction>}
              </div>
            </Field>

            {feedback ? (
              <Alert tone={feedback.tone} code={feedback.code} title={feedback.title} message={feedback.message} />
            ) : (
              <DniPreview dni={dni} />
            )}

            <Button type="submit" size="lg" fullWidth loading={isSaving} disabled={isSaving}>
              Registrar ingreso
            </Button>
          </form>
        </Card>

        <Card as="section" padding="none" className="flex flex-col lg:col-span-3">
          <SectionHeader
            divided
            title="Asistencias de hoy"
            description={formatDateLong(today)}
            action={
              <Badge tone="emerald" size="md" className="w-fit">
                {lista.data?.totalElements ?? 0} {lista.data?.totalElements === 1 ? 'ingreso' : 'ingresos'}
              </Badge>
            }
          />

          <DataState loading={lista.loading} error={lista.error} hasData={Boolean(lista.data)} onRetry={lista.reload}>
            {ingresos.length === 0 ? (
              <EmptyState title="Aún no hay ingresos registrados hoy" description="La lista se reinicia al cambiar el día en Perú." />
            ) : (
              <div className="overflow-x-auto">
                <DataTable>
                  <thead>
                    <DataTableHeaderRow>
                      <DataTableHeaderCell className="sm:px-6">Hora</DataTableHeaderCell>
                      <DataTableHeaderCell>Socio</DataTableHeaderCell>
                      <DataTableHeaderCell>DNI</DataTableHeaderCell>
                    </DataTableHeaderRow>
                  </thead>
                  <DataTableBody>
                    {ingresos.map((entry) => (
                      <DataTableRow key={entry.id}>
                        <DataTableCell className="sm:px-6">
                          <span className="font-mono text-xs font-semibold text-emerald-300">{formatTime(entry.horaEntrada)}</span>
                        </DataTableCell>
                        <DataTableCell className="font-medium text-white">{entry.socioNombre}</DataTableCell>
                        <DataTableCell className="font-mono text-xs text-slate-400">{entry.dni}</DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              </div>
            )}
          </DataState>

          {lista.data && (
            <div className="mt-auto border-t border-white/10 px-4 py-3 sm:px-6">
              <Pagination page={lista.data.number} totalPages={lista.data.totalPages} totalElements={lista.data.totalElements} onChange={setPage} />
            </div>
          )}
        </Card>
      </div>
    </>
  )
}

export default IngresosPage
