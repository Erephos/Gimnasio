import { useEffect, useRef, useState } from 'react'
import {
  LIMA_TIME_ZONE,
  createInitialCheckIns,
  findMemberByDni,
  formatPeruDate,
  getCheckInsForDay,
  getPeruNow,
  registerCheckIn,
  validateDni,
} from '../../lib/ingresos.js'
import {
  MEMBER_STATUS,
  createInitialMembers,
  formatDate,
  getMembershipInfo,
} from '../../lib/memberships.js'
import Alert from '../../components/Alert.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeaderCell,
  DataTableHeaderRow,
  DataTableRow,
} from '../../components/DataTable.jsx'
import DemoNote from '../../components/DemoNote.jsx'
import Field from '../../components/Field.jsx'
import InfoBox from '../../components/InfoBox.jsx'
import Input from '../../components/Input.jsx'
import InputAction from '../../components/InputAction.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import StatGrid from '../../components/StatGrid.jsx'
import { ClockIcon } from '../../components/icons.jsx'

const REASON_TITLES = {
  'invalid-dni': 'DNI inválido · 400',
  'not-found': 'Socio no encontrado · 404',
  inactive: 'Socio dado de baja · 403',
  'no-membership': 'Sin membresía · 403',
  expired: 'Membresía vencida · 403',
  duplicate: 'Ingreso duplicado · 409',
}

function MemberPreview({ dni, member, info, existingCheckIn }) {
  const trimmedDni = dni.trim()

  if (!trimmedDni) {
    return (
      <InfoBox label="Validación en tiempo real">
        Escribe el DNI para consultar el estado del socio antes de registrar
        el ingreso.
      </InfoBox>
    )
  }

  if (validateDni(trimmedDni)) {
    return (
      <InfoBox tone="warning" label="Validación en tiempo real">
        El DNI debe tener 8 dígitos numéricos para poder consultar al socio.
      </InfoBox>
    )
  }

  if (!member) {
    return (
      <InfoBox tone="error" label="Sin coincidencias · 404">
        No existe un socio con el DNI “{trimmedDni}”. Si el número es correcto,
        registra primero al socio en el panel de socios.
      </InfoBox>
    )
  }

  if (member.status === MEMBER_STATUS.INACTIVE) {
    return (
      <InfoBox tone="error" label="Acceso denegado · 403">
        {member.name} está dado de baja (inactivo), por lo que no puede
        ingresar al gimnasio.
      </InfoBox>
    )
  }

  if (info.status === 'none') {
    return (
      <InfoBox tone="warning" label="Acceso denegado · 403">
        {member.name} no tiene ninguna membresía registrada. Debe adquirir una
        antes de ingresar.
      </InfoBox>
    )
  }

  if (info.status === 'expired') {
    return (
      <InfoBox tone="error" label="Acceso denegado · 403">
        La membresía de {member.name} venció el{' '}
        {formatDate(info.endDate)}. No puede ingresar hasta que la renueve.
      </InfoBox>
    )
  }

  if (existingCheckIn) {
    return (
      <InfoBox tone="warning" label="Ingreso ya registrado · 409">
        {member.name} ya ingresó hoy a las {existingCheckIn.time.slice(0, 5)}.
        Solo se permite un ingreso por socio al día.
      </InfoBox>
    )
  }

  return (
    <InfoBox tone="success" label="Puede ingresar">
      <span className="font-semibold">{member.name}</span> · Membresía{' '}
      {info.plan?.name ?? 'vigente'} hasta el {formatDate(info.endDate)}.
    </InfoBox>
  )
}

function Ingresos() {
  const [members] = useState(createInitialMembers)
  const [checkIns, setCheckIns] = useState(createInitialCheckIns)
  const [dni, setDni] = useState('')
  const [dniError, setDniError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [clock, setClock] = useState(() => getPeruNow())
  const inputRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(getPeruNow())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const todayCheckIns = getCheckInsForDay(checkIns, clock.dateKey)
  const previousCheckIns = checkIns.length - todayCheckIns.length
  const activeMemberships = members.filter(
    (member) => getMembershipInfo(member, clock.dateKey).status === 'active',
  ).length
  const inactiveMembers = members.filter(
    (member) => member.status === MEMBER_STATUS.INACTIVE,
  ).length

  const trimmedDni = dni.trim()
  const previewMember =
    trimmedDni && !validateDni(trimmedDni)
      ? findMemberByDni(members, trimmedDni)
      : null
  const previewInfo = previewMember
    ? getMembershipInfo(previewMember, clock.dateKey)
    : null
  const previewCheckIn = previewMember
    ? (todayCheckIns.find(
        (entry) => entry.memberId === previewMember.id,
      ) ?? null)
    : null

  const demoCases = [
    { memberId: 'H3', hint: 'Membresía activa' },
    { memberId: 'H4', hint: 'Membresía vencida' },
    { memberId: 'H1', hint: 'Sin membresía' },
    { memberId: 'H2', hint: 'Socio dado de baja' },
  ]
    .map((demoCase) => ({
      ...demoCase,
      member: members.find((member) => member.id === demoCase.memberId),
    }))
    .filter((demoCase) => demoCase.member)

  function handleDniChange(event) {
    setDni(event.target.value)
    setDniError('')
    setFeedback(null)
  }

  function handleUseDemoDni(value) {
    setDni(value)
    setDniError('')
    setFeedback(null)
    inputRef.current?.focus()
  }

  function handleSubmit(event) {
    event.preventDefault()

    const now = new Date()
    const result = registerCheckIn({ members, checkIns, dni, now })

    setClock(getPeruNow(now))

    if (!result.ok) {
      setFeedback(
        result.reason === 'invalid-dni'
          ? null
          : {
              tone: 'error',
              code: result.code,
              title: REASON_TITLES[result.reason] ?? 'No se pudo registrar',
              message: result.message,
            },
      )
      setDniError(result.reason === 'invalid-dni' ? result.message : '')
      return
    }

    setCheckIns((previous) => [...previous, result.record])
    setFeedback({
      tone: 'success',
      code: result.code,
      title: 'Ingreso registrado',
      message: result.message,
    })
    setDni('')
    setDniError('')
    inputRef.current?.focus()
  }

  return (
    <div className="text-slate-100">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          layout="split"
          title="Control de ingresos"
          description="Registra el ingreso diario de los socios con su DNI y valida en tiempo real si su membresía está vigente. Cada ingreso se guarda con la fecha y hora exactas de Perú."
          actions={
            <Card radius="xl" padding="tight">
              <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                Hora de Perú · {LIMA_TIME_ZONE}
              </p>
              <p className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-emerald-300">
                {clock.time}
              </p>
              <p className="text-xs text-slate-400">
                {formatPeruDate(clock.dateKey)}
              </p>
            </Card>
          }
        />

        <StatGrid
          items={[
            { label: 'Ingresos hoy', value: todayCheckIns.length },
            { label: 'Membresías vigentes', value: activeMemberships },
            { label: 'Socios dados de baja', value: inactiveMembers },
            { label: 'Altas registradas', value: members.length },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-5">
          <Card
            as="section"
            aria-labelledby="registrar-title"
            padding="normal"
            className="lg:col-span-2"
          >
            <SectionHeader
              titleId="registrar-title"
              title="Registrar ingreso"
              description="Ingresa el DNI de 8 dígitos. El estado de la membresía se valida antes y después de registrar."
              descriptionClassName="mt-1 text-sm text-slate-400"
            />

            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
              <Field
                id="dni"
                label="DNI del socio"
                error={dniError}
                errorId="dni-error"
                hint="Solo números, sin espacios ni guiones."
                hintId="dni-help"
              >
                <div className="relative">
                  <Input
                    ref={inputRef}
                    id="dni"
                    name="dni"
                    inputMode="numeric"
                    autoComplete="off"
                    autoFocus
                    size="md"
                    className="pr-24"
                    placeholder="Ej. 45678901"
                    value={dni}
                    onChange={handleDniChange}
                    invalid={Boolean(dniError)}
                    aria-describedby={
                      dniError ? 'dni-error' : 'dni-help'
                    }
                  />
                  {dni && (
                    <InputAction onClick={() => handleUseDemoDni('')}>
                      Limpiar
                    </InputAction>
                  )}
                </div>
              </Field>

              {feedback ? (
                <Alert
                  tone={feedback.tone}
                  code={feedback.code}
                  title={feedback.title}
                  message={feedback.message}
                />
              ) : (
                <MemberPreview
                  dni={dni}
                  member={previewMember}
                  info={previewInfo}
                  existingCheckIn={previewCheckIn}
                />
              )}

              <Button type="submit" size="lg" fullWidth>
                Registrar ingreso
              </Button>
            </form>

            <div className="mt-6 rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
                DNIs de prueba
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Haz clic en un DNI para cargarlo en el formulario.
              </p>
              <ul className="mt-3 space-y-2">
                {demoCases.map(({ member, hint }) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => handleUseDemoDni(member.dni)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-left transition hover:border-emerald-400/40 hover:bg-emerald-500/5"
                    >
                      <span>
                        <span className="block font-mono text-xs text-slate-200">
                          {member.dni}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {member.name}
                        </span>
                      </span>
                      <span className="text-right text-[11px] text-slate-400">
                        {hint}
                      </span>
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => handleUseDemoDni('00000000')}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-left transition hover:border-red-400/40 hover:bg-red-500/5"
                  >
                    <span>
                      <span className="block font-mono text-xs text-slate-200">
                        00000000
                      </span>
                      <span className="block text-xs text-slate-500">
                        DNI inexistente
                      </span>
                    </span>
                    <span className="text-right text-[11px] text-slate-400">
                      Error 404
                    </span>
                  </button>
                </li>
              </ul>
            </div>
          </Card>

          <Card
            as="section"
            aria-labelledby="asistencias-title"
            padding="none"
            className="flex flex-col lg:col-span-3"
          >
            <SectionHeader
              divided
              titleId="asistencias-title"
              title="Asistencias de hoy"
              description={formatPeruDate(clock.dateKey)}
              action={
                <Badge tone="emerald" size="md" className="w-fit">
                  {todayCheckIns.length}{' '}
                  {todayCheckIns.length === 1 ? 'ingreso' : 'ingresos'}
                </Badge>
              }
            />

            {todayCheckIns.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <ClockIcon className="h-6 w-6 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-300">
                  Aún no hay ingresos registrados hoy
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Los ingresos de días anteriores no se muestran en esta lista.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <DataTable>
                  <thead>
                    <DataTableHeaderRow>
                      <DataTableHeaderCell className="sm:px-6">
                        Hora
                      </DataTableHeaderCell>
                      <DataTableHeaderCell>Socio</DataTableHeaderCell>
                      <DataTableHeaderCell>DNI</DataTableHeaderCell>
                      <DataTableHeaderCell>Membresía</DataTableHeaderCell>
                    </DataTableHeaderRow>
                  </thead>
                  <DataTableBody>
                    {todayCheckIns.map((entry) => (
                      <DataTableRow key={entry.id}>
                        <DataTableCell className="sm:px-6">
                          <span className="font-mono text-xs font-semibold text-emerald-300">
                            {entry.time}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <p className="font-medium text-white">
                            {entry.memberName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {entry.memberId}
                          </p>
                        </DataTableCell>
                        <DataTableCell className="font-mono text-xs text-slate-400">
                          {entry.dni}
                        </DataTableCell>
                        <DataTableCell>
                          <Badge tone="sky">
                            {entry.planName ?? 'Sin plan'}
                          </Badge>
                        </DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              </div>
            )}

            <div className="mt-auto border-t border-white/10 px-4 py-3 text-xs text-slate-500 sm:px-6">
              {previousCheckIns > 0
                ? `Se conservan ${previousCheckIns} ingreso(s) de días anteriores, excluidos de la lista de hoy.`
                : 'La lista se reinicia automáticamente al cambiar el día en Perú.'}
            </div>
          </Card>
        </div>

        <DemoNote>
          Demo con datos en memoria: los ingresos se reinician al recargar la
          página. La fecha y la hora se calculan con la zona horaria de Perú
          ({LIMA_TIME_ZONE}, UTC-5).
        </DemoNote>
      </main>
    </div>
  )
}

export default Ingresos
