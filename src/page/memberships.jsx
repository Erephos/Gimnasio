import { useState } from 'react'
import { normalizeEmail } from '../lib/email.js'
import {
  MEMBER_STATUS,
  PLANS,
  addDays,
  assignMembership,
  createInitialMembers,
  findMemberById,
  formatCurrency,
  formatDate,
  getMembershipInfo,
  getPlan,
  nextMemberId,
  todayISO,
  validateMemberInput,
} from '../lib/memberships.js'
import Alert from '../components/Alert.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeaderCell,
  DataTableHeaderRow,
  DataTableRow,
} from '../components/DataTable.jsx'
import DemoNote from '../components/DemoNote.jsx'
import Field from '../components/Field.jsx'
import InfoBox from '../components/InfoBox.jsx'
import Input from '../components/Input.jsx'
import PageHeader from '../components/PageHeader.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import Select from '../components/Select.jsx'
import StatGrid from '../components/StatGrid.jsx'

function membershipBadgeTone(status) {
  if (status === 'active') return 'emerald'
  if (status === 'expired') return 'red'
  return 'neutral'
}

function AssignContext({ memberId, member }) {
  const trimmedId = memberId.trim()

  if (!trimmedId) {
    return (
      <InfoBox>
        Escribe o elige un ID para ver el estado del socio antes de asignar.
      </InfoBox>
    )
  }

  if (!member) {
    return (
      <InfoBox tone="error">
        No existe ningún socio con el ID “{trimmedId}”. Al asignar, el sistema
        responderá con el error 404.
      </InfoBox>
    )
  }

  if (member.status === MEMBER_STATUS.INACTIVE) {
    return (
      <InfoBox tone="error">
        <span className="font-semibold">{member.name}</span> está dado de baja
        (H2). No puede recibir membresías; el sistema responderá con el error
        403.
      </InfoBox>
    )
  }

  const info = getMembershipInfo(member)

  if (info.status === 'active') {
    return (
      <InfoBox tone="warning">
        <span className="font-semibold">{member.name}</span> tiene una
        membresía {info.plan?.name ?? ''} activa hasta el{' '}
        {formatDate(info.endDate)}. No puede adquirir otra mientras siga
        vigente (error 409).
      </InfoBox>
    )
  }

  if (info.status === 'expired') {
    return (
      <InfoBox tone="success">
        La membresía de <span className="font-semibold">{member.name}</span>{' '}
        venció el {formatDate(info.endDate)}. Puede adquirir una nueva; al
        asignarla se reemplazará la anterior.
      </InfoBox>
    )
  }

  return (
    <InfoBox tone="info">
      <span className="font-semibold">{member.name}</span> no tiene una
      membresía registrada. Puede recibir una nueva.
    </InfoBox>
  )
}

function Memberships() {
  const [members, setMembers] = useState(createInitialMembers)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState({
    name: '',
    dni: '',
    email: '',
    status: MEMBER_STATUS.ACTIVE,
  })
  const [draftErrors, setDraftErrors] = useState({})
  const [memberFeedback, setMemberFeedback] = useState(null)
  const [membersFeedback, setMembersFeedback] = useState(null)
  const [showNewMember, setShowNewMember] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', dni: '', email: '' })
  const [newMemberErrors, setNewMemberErrors] = useState({})
  const [assignForm, setAssignForm] = useState({
    memberId: '',
    planId: PLANS[0].id,
    startDate: todayISO(),
  })
  const [assignFeedback, setAssignFeedback] = useState(null)
  const [consultId, setConsultId] = useState('')
  const [consultFeedback, setConsultFeedback] = useState(null)

  const normalizedSearch = search.trim().toLowerCase()
  const filteredMembers = members.filter((member) => {
    if (!normalizedSearch) return true

    return (
      member.id.toLowerCase().includes(normalizedSearch) ||
      member.name.toLowerCase().includes(normalizedSearch) ||
      member.email.toLowerCase().includes(normalizedSearch)
    )
  })

  const activeMemberships = members.filter(
    (member) => getMembershipInfo(member).status === 'active',
  ).length
  const expiredMemberships = members.filter(
    (member) => getMembershipInfo(member).status === 'expired',
  ).length
  const activeMembers = members.filter(
    (member) => member.status === MEMBER_STATUS.ACTIVE,
  ).length

  const selectedMember =
    members.find((member) => member.id === selectedId) ?? null
  const assignMember = findMemberById(members, assignForm.memberId)
  const selectedPlan = getPlan(assignForm.planId)
  const previewEndDate =
    selectedPlan && assignForm.startDate
      ? addDays(assignForm.startDate, selectedPlan.durationDays)
      : ''
  const consultedMember = consultFeedback?.memberId
    ? (members.find((member) => member.id === consultFeedback.memberId) ?? null)
    : null
  const consultedInfo = consultedMember
    ? getMembershipInfo(consultedMember)
    : null

  function handleSelectMember(member) {
    setSelectedId(member.id)
    setDraft({
      name: member.name,
      dni: member.dni,
      email: member.email,
      status: member.status,
    })
    setDraftErrors({})
    setMemberFeedback(null)
    setAssignForm((previous) => ({ ...previous, memberId: member.id }))
    setConsultId(member.id)
    setConsultFeedback(null)
  }

  function handleCreateMember(event) {
    event.preventDefault()

    const errors = validateMemberInput(newMember, members)
    setNewMemberErrors(errors)

    if (Object.keys(errors).length > 0) return

    const member = {
      id: nextMemberId(members),
      name: newMember.name.trim(),
      dni: newMember.dni.trim(),
      email: normalizeEmail(newMember.email),
      status: MEMBER_STATUS.ACTIVE,
      joinedAt: todayISO(),
      membership: null,
    }

    setMembers((previous) => [...previous, member])
    setMembersFeedback({
      tone: 'success',
      message: `Socio ${member.id} registrado correctamente (${member.name}).`,
    })
    setNewMember({ name: '', dni: '', email: '' })
    setNewMemberErrors({})
    setShowNewMember(false)
    handleSelectMember(member)
  }

  function handleUpdateMember(event) {
    event.preventDefault()

    if (!selectedMember) return

    const errors = validateMemberInput(draft, members, selectedMember.id)
    setDraftErrors(errors)

    if (Object.keys(errors).length > 0) return

    setMembers((previous) =>
      previous.map((member) =>
        member.id === selectedMember.id
          ? {
              ...member,
              name: draft.name.trim(),
              dni: draft.dni.trim(),
              email: normalizeEmail(draft.email),
              status: draft.status,
            }
          : member,
      ),
    )
    setMemberFeedback({
      tone: 'success',
      message: `Datos del socio ${selectedMember.id} actualizados correctamente.`,
    })
  }

  function handleAssignMembership(event) {
    event.preventDefault()

    const result = assignMembership({
      members,
      memberId: assignForm.memberId,
      planId: assignForm.planId,
      startDate: assignForm.startDate,
    })

    if (!result.ok) {
      setAssignFeedback({ tone: 'error', code: result.code, message: result.message })
      return
    }

    setMembers((previous) =>
      previous.map((member) =>
        member.id === result.member.id
          ? { ...member, membership: result.membership }
          : member,
      ),
    )
    setAssignFeedback({
      tone: 'success',
      code: result.code,
      message: result.message,
    })
  }

  function handleConsultMembership(event) {
    event.preventDefault()

    const member = findMemberById(members, consultId)

    if (!member) {
      setConsultFeedback({
        tone: 'error',
        code: 404,
        message: `No se encontró ningún socio con el ID "${consultId.trim() || '—'}". Verifica el identificador e inténtalo de nuevo.`,
      })
      return
    }

    setConsultFeedback({ tone: 'success', memberId: member.id })
  }

  return (
    <div className="text-slate-100">
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section aria-labelledby="resumen-title">
          <PageHeader
            titleId="resumen-title"
            title="Gestión de socios y membresías"
            description="Registra socios, actualiza sus datos y controla la vigencia de sus membresías desde un solo lugar."
          />

          <StatGrid
            className="mt-6"
            items={[
              { label: 'Socios registrados', value: members.length },
              { label: 'Membresías activas', value: activeMemberships },
              { label: 'Membresías vencidas', value: expiredMemberships },
              { label: 'Socios activos', value: activeMembers },
            ]}
          />
        </section>

        <section aria-labelledby="planes-title">
          <SectionHeader
            titleId="planes-title"
            title="Planes de membresía"
            description="Cada plan define su precio y duración en días."
            className="flex items-end justify-between gap-4"
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <Card key={plan.id} as="article" radius="xl" padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">
                    {plan.name}
                  </h3>
                  <p className="text-lg font-bold text-emerald-400">
                    {formatCurrency(plan.price)}
                  </p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {plan.description}
                </p>
                <Badge tone="muted" size="md" className="mt-3">
                  {plan.durationDays} días
                </Badge>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card
            as="section"
            aria-labelledby="socios-title"
            padding="none"
            className="lg:col-span-3"
          >
            <div className="border-b border-white/10 p-4 sm:p-6">
              <SectionHeader
                titleId="socios-title"
                title="Socios"
                description="Consulta, actualiza o da de baja a los socios."
                className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                action={
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setShowNewMember((visible) => !visible)
                      setNewMemberErrors({})
                    }}
                  >
                    {showNewMember ? 'Cancelar registro' : '+ Nuevo socio'}
                  </Button>
                }
              />

              <label htmlFor="member-search" className="sr-only">
                Buscar socio
              </label>
              <Input
                id="member-search"
                type="search"
                placeholder="Buscar por ID, nombre o correo…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-4"
              />
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              {membersFeedback && (
                <Alert
                  tone={membersFeedback.tone}
                  message={membersFeedback.message}
                />
              )}

              {showNewMember && (
                <form
                  onSubmit={handleCreateMember}
                  noValidate
                  className="space-y-4 rounded-xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <h3 className="text-sm font-semibold text-white">
                    Registrar nuevo socio
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field
                      id="new-name"
                      label="Nombre completo"
                      error={newMemberErrors.name}
                    >
                      <Input
                        id="new-name"
                        value={newMember.name}
                        onChange={(event) => {
                          setNewMember((previous) => ({
                            ...previous,
                            name: event.target.value,
                          }))
                          setNewMemberErrors((previous) => ({
                            ...previous,
                            name: undefined,
                          }))
                        }}
                        invalid={Boolean(newMemberErrors.name)}
                        placeholder="Ej. Lucía Fernández"
                      />
                    </Field>
                    <Field id="new-dni" label="DNI" error={newMemberErrors.dni}>
                      <Input
                        id="new-dni"
                        inputMode="numeric"
                        value={newMember.dni}
                        onChange={(event) => {
                          setNewMember((previous) => ({
                            ...previous,
                            dni: event.target.value,
                          }))
                          setNewMemberErrors((previous) => ({
                            ...previous,
                            dni: undefined,
                          }))
                        }}
                        invalid={Boolean(newMemberErrors.dni)}
                        placeholder="8 dígitos"
                      />
                    </Field>
                    <Field
                      id="new-email"
                      label="Correo electrónico"
                      error={newMemberErrors.email}
                    >
                      <Input
                        id="new-email"
                        type="email"
                        value={newMember.email}
                        onChange={(event) => {
                          setNewMember((previous) => ({
                            ...previous,
                            email: event.target.value,
                          }))
                          setNewMemberErrors((previous) => ({
                            ...previous,
                            email: undefined,
                          }))
                        }}
                        invalid={Boolean(newMemberErrors.email)}
                        placeholder="nombre@dominio.com"
                      />
                    </Field>
                  </div>
                  <Button type="submit" size="sm" focusRing={false}>
                    Guardar socio
                  </Button>
                </form>
              )}

              <div className="overflow-x-auto">
                <DataTable>
                  <thead>
                    <DataTableHeaderRow>
                      <DataTableHeaderCell padding="compact">
                        Socio
                      </DataTableHeaderCell>
                      <DataTableHeaderCell padding="compact">
                        Estado
                      </DataTableHeaderCell>
                      <DataTableHeaderCell padding="compact">
                        Membresía
                      </DataTableHeaderCell>
                      <DataTableHeaderCell padding="compact">
                        Vence
                      </DataTableHeaderCell>
                      <DataTableHeaderCell
                        padding="compact"
                        className="text-right"
                      >
                        Acciones
                      </DataTableHeaderCell>
                    </DataTableHeaderRow>
                  </thead>
                  <DataTableBody>
                    {filteredMembers.map((member) => {
                      const info = getMembershipInfo(member)

                      return (
                        <DataTableRow
                          key={member.id}
                          selected={member.id === selectedId}
                        >
                          <DataTableCell padding="compact">
                            <p className="font-medium text-white">
                              <span className="mr-2 text-xs font-mono text-slate-500">
                                {member.id}
                              </span>
                              {member.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              DNI {member.dni} · {member.email}
                            </p>
                          </DataTableCell>
                          <DataTableCell padding="compact">
                            <Badge
                              tone={
                                member.status === MEMBER_STATUS.INACTIVE
                                  ? 'red'
                                  : 'sky'
                              }
                            >
                              {member.status === MEMBER_STATUS.INACTIVE
                                ? 'H2 · Baja'
                                : 'Activo'}
                            </Badge>
                          </DataTableCell>
                          <DataTableCell padding="compact">
                            <Badge tone={membershipBadgeTone(info.status)}>
                              {info.label}
                            </Badge>
                          </DataTableCell>
                          <DataTableCell
                            padding="compact"
                            className="text-xs text-slate-400"
                          >
                            {info.endDate ? formatDate(info.endDate) : '—'}
                          </DataTableCell>
                          <DataTableCell
                            padding="compact"
                            className="text-right"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              onClick={() => handleSelectMember(member)}
                            >
                              Gestionar
                            </Button>
                          </DataTableCell>
                        </DataTableRow>
                      )
                    })}
                  </DataTableBody>
                </DataTable>

                {filteredMembers.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No se encontraron socios que coincidan con “{search}”.
                  </p>
                )}
              </div>
            </div>
          </Card>

          <div className="space-y-6 lg:col-span-2">
            <Card as="section" aria-labelledby="asignar-title" padding="normal">
              <SectionHeader
                titleId="asignar-title"
                title="Asignar membresía"
                description="El vencimiento se calcula sumando la duración del plan a la fecha de inicio."
                descriptionClassName="mt-1 text-sm text-slate-400"
              />

              <form onSubmit={handleAssignMembership} noValidate className="mt-4 space-y-4">
                <Field
                  id="assign-member"
                  label="ID del socio"
                  hint="Prueba con un ID inexistente (por ejemplo, H99) para ver el error 404."
                  hintId="assign-member-help"
                >
                  <Input
                    id="assign-member"
                    list="member-ids"
                    value={assignForm.memberId}
                    onChange={(event) => {
                      setAssignForm((previous) => ({
                        ...previous,
                        memberId: event.target.value,
                      }))
                      setAssignFeedback(null)
                    }}
                    placeholder="Ej. H1"
                  />
                  <datalist id="member-ids">
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </datalist>
                </Field>

                <Field id="assign-plan" label="Plan">
                  <Select
                    id="assign-plan"
                    value={assignForm.planId}
                    onChange={(event) => {
                      setAssignForm((previous) => ({
                        ...previous,
                        planId: event.target.value,
                      }))
                      setAssignFeedback(null)
                    }}
                  >
                    {PLANS.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} · {formatCurrency(plan.price)} ·{' '}
                        {plan.durationDays} días
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  id="assign-start"
                  label="Fecha de inicio"
                  hintId="assign-start-help"
                  hint={
                    <>
                      Vencimiento calculado:{' '}
                      <span className="font-medium text-slate-300">
                        {previewEndDate ? formatDate(previewEndDate) : '—'}
                      </span>
                      {selectedPlan
                        ? ` (${selectedPlan.durationDays} días)`
                        : ''}
                    </>
                  }
                >
                  <Input
                    id="assign-start"
                    type="date"
                    max={todayISO()}
                    value={assignForm.startDate}
                    onChange={(event) => {
                      setAssignForm((previous) => ({
                        ...previous,
                        startDate: event.target.value,
                      }))
                      setAssignFeedback(null)
                    }}
                  />
                </Field>

                {assignFeedback && (
                  <Alert
                    tone={assignFeedback.tone}
                    code={assignFeedback.code}
                    message={assignFeedback.message}
                  />
                )}

                <AssignContext
                  memberId={assignForm.memberId}
                  member={assignMember}
                />

                <Button type="submit" size="md" fullWidth>
                  Asignar y activar membresía
                </Button>
              </form>
            </Card>

            <Card
              as="section"
              aria-labelledby="consultar-title"
              padding="normal"
            >
              <SectionHeader
                titleId="consultar-title"
                title="Consultar membresía"
              />

              <form
                onSubmit={handleConsultMembership}
                noValidate
                className="mt-4 flex gap-2"
              >
                <div className="flex-1">
                  <label htmlFor="consult-member" className="sr-only">
                    ID del socio a consultar
                  </label>
                  <Input
                    id="consult-member"
                    value={consultId}
                    onChange={(event) => {
                      setConsultId(event.target.value)
                      setConsultFeedback(null)
                    }}
                    placeholder="ID del socio (ej. H3)"
                  />
                </div>
                <Button type="submit" variant="outlineStrong" size="md">
                  Consultar
                </Button>
              </form>

              {consultFeedback && consultFeedback.tone === 'error' && (
                <div className="mt-4">
                  <Alert
                    tone="error"
                    code={consultFeedback.code}
                    message={consultFeedback.message}
                  />
                </div>
              )}

              {consultedMember && consultedInfo && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {consultedMember.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {consultedMember.id} · {consultedMember.email}
                      </p>
                    </div>
                    {consultedMember.status === MEMBER_STATUS.INACTIVE && (
                      <Badge tone="red">H2 · Baja</Badge>
                    )}
                  </div>

                  <div
                    className={`rounded-xl border px-4 py-3 ${
                      consultedInfo.status === 'active'
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : consultedInfo.status === 'expired'
                          ? 'border-red-500/30 bg-red-500/10'
                          : 'border-white/10 bg-slate-950/40'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Estado de la membresía
                    </p>
                    <p
                      className={`mt-1 text-2xl font-bold ${
                        consultedInfo.status === 'active'
                          ? 'text-emerald-300'
                          : consultedInfo.status === 'expired'
                            ? 'text-red-300'
                            : 'text-slate-300'
                      }`}
                    >
                      {consultedInfo.label}
                    </p>

                    {consultedInfo.status === 'none' ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Este socio todavía no tiene una membresía asignada.
                      </p>
                    ) : (
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <dt className="text-slate-500">Plan</dt>
                          <dd className="font-medium text-slate-200">
                            {consultedInfo.plan?.name ?? 'Plan desconocido'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Inicio</dt>
                          <dd className="font-medium text-slate-200">
                            {formatDate(consultedInfo.startDate)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Vencimiento</dt>
                          <dd className="font-medium text-slate-200">
                            {formatDate(consultedInfo.endDate)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">
                            {consultedInfo.status === 'active'
                              ? 'Días restantes'
                              : 'Días vencida'}
                          </dt>
                          <dd className="font-medium text-slate-200">
                            {Math.abs(consultedInfo.daysRemaining)}
                          </dd>
                        </div>
                      </dl>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {selectedMember && (
              <Card
                as="section"
                aria-labelledby="editar-title"
                padding="normal"
              >
                <SectionHeader
                  titleId="editar-title"
                  title="Editar socio"
                  description={`${selectedMember.id} · alta el ${formatDate(selectedMember.joinedAt)}`}
                  descriptionClassName="text-xs text-slate-500"
                  className="flex items-start justify-between gap-3"
                  action={
                    <Button
                      type="button"
                      variant="ghostMuted"
                      size="xs"
                      onClick={() => {
                        setSelectedId(null)
                        setDraftErrors({})
                        setMemberFeedback(null)
                      }}
                    >
                      Cerrar
                    </Button>
                  }
                />

                <form
                  onSubmit={handleUpdateMember}
                  noValidate
                  className="mt-4 space-y-4"
                >
                  <Field
                    id="edit-name"
                    label="Nombre completo"
                    error={draftErrors.name}
                  >
                    <Input
                      id="edit-name"
                      value={draft.name}
                      onChange={(event) => {
                        setDraft((previous) => ({
                          ...previous,
                          name: event.target.value,
                        }))
                        setDraftErrors((previous) => ({
                          ...previous,
                          name: undefined,
                        }))
                        setMemberFeedback(null)
                      }}
                      invalid={Boolean(draftErrors.name)}
                    />
                  </Field>

                  <Field id="edit-dni" label="DNI" error={draftErrors.dni}>
                    <Input
                      id="edit-dni"
                      inputMode="numeric"
                      value={draft.dni}
                      onChange={(event) => {
                        setDraft((previous) => ({
                          ...previous,
                          dni: event.target.value,
                        }))
                        setDraftErrors((previous) => ({
                          ...previous,
                          dni: undefined,
                        }))
                        setMemberFeedback(null)
                      }}
                      invalid={Boolean(draftErrors.dni)}
                    />
                  </Field>

                  <Field
                    id="edit-email"
                    label="Correo electrónico"
                    error={draftErrors.email}
                  >
                    <Input
                      id="edit-email"
                      type="email"
                      value={draft.email}
                      onChange={(event) => {
                        setDraft((previous) => ({
                          ...previous,
                          email: event.target.value,
                        }))
                        setDraftErrors((previous) => ({
                          ...previous,
                          email: undefined,
                        }))
                        setMemberFeedback(null)
                      }}
                      invalid={Boolean(draftErrors.email)}
                    />
                  </Field>

                  <Field
                    id="edit-status"
                    label="Estado del socio"
                    hint="Un socio inactivo (H2) no puede recibir membresías."
                    hintId="edit-status-help"
                  >
                    <Select
                      id="edit-status"
                      value={draft.status}
                      onChange={(event) => {
                        setDraft((previous) => ({
                          ...previous,
                          status: event.target.value,
                        }))
                        setMemberFeedback(null)
                      }}
                    >
                      <option value={MEMBER_STATUS.ACTIVE}>Activo</option>
                      <option value={MEMBER_STATUS.INACTIVE}>
                        Inactivo (baja · H2)
                      </option>
                    </Select>
                  </Field>

                  {memberFeedback && (
                    <Alert
                      tone={memberFeedback.tone}
                      message={memberFeedback.message}
                    />
                  )}

                  <Button type="submit" variant="primarySky" size="md" fullWidth>
                    Guardar cambios
                  </Button>
                </form>
              </Card>
            )}
          </div>
        </div>

        <DemoNote>
          Los datos de esta demo viven solo en memoria y se reinician al
          recargar la página.
        </DemoNote>
      </main>
    </div>
  )
}

export default Memberships
