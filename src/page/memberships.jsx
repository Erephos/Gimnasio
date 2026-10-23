import { useState } from 'react'
import { normalizeEmail } from '../lib/email.js'
import {
  MEMBER_STATUS,
  PLANS,
  addDays,
  assignMembership,
  createInitialMembers,
  formatCurrency,
  formatDate,
  getMembershipInfo,
  getPlan,
  nextMemberId,
  todayISO,
  validateMemberInput,
} from '../lib/memberships.js'

const inputClasses =
  'w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30'

const errorInputClasses =
  'w-full rounded-lg border border-red-500/60 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-red-500/30'

function membershipBadgeClasses(status) {
  if (status === 'active') {
    return 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
  }

  if (status === 'expired') {
    return 'bg-red-500/10 text-red-300 ring-red-500/30'
  }

  return 'bg-slate-500/10 text-slate-400 ring-slate-500/30'
}

function Alert({ tone = 'success', code, message }) {
  const isError = tone === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${
        isError
          ? 'border-red-500/30 bg-red-500/10 text-red-200'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
          isError
            ? 'bg-red-500/20 text-red-200'
            : 'bg-emerald-500/20 text-emerald-200'
        }`}
        aria-hidden="true"
      >
        {code ?? (isError ? '!' : '✓')}
      </span>
      <p className="leading-relaxed">{message}</p>
    </div>
  )
}

function Memberships() {
  const [members, setMembers] = useState(createInitialMembers)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState({
    name: '',
    email: '',
    status: MEMBER_STATUS.ACTIVE,
  })
  const [draftErrors, setDraftErrors] = useState({})
  const [memberFeedback, setMemberFeedback] = useState(null)
  const [membersFeedback, setMembersFeedback] = useState(null)
  const [showNewMember, setShowNewMember] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', email: '' })
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
    setNewMember({ name: '', email: '' })
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

    const member = members.find(
      (candidate) =>
        candidate.id.toLowerCase() === consultId.trim().toLowerCase(),
    )

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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
              <svg
                className="h-5 w-5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 6.75h10.5M6.75 17.25h10.5M4.5 9v6M19.5 9v6M9 9v6M15 9v6"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">
                ximEdgar Gym
              </p>
              <p className="text-xs text-slate-400">
                Panel de administración y recepción
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300 ring-1 ring-sky-500/30 sm:inline">
              Recepción
            </span>
            <a
              href="#/login"
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
            >
              Volver al login
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section aria-labelledby="resumen-title">
          <h1
            id="resumen-title"
            className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
          >
            Gestión de socios y membresías
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Registra socios, actualiza sus datos y controla la vigencia de sus
            membresías desde un solo lugar.
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Socios registrados', value: members.length },
              { label: 'Membresías activas', value: activeMemberships },
              { label: 'Membresías vencidas', value: expiredMemberships },
              { label: 'Socios activos', value: activeMembers },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3"
              >
                <dt className="text-xs text-slate-400">{stat.label}</dt>
                <dd className="mt-1 text-2xl font-bold text-white">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="planes-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="planes-title" className="text-lg font-semibold text-white">
                Planes de membresía
              </h2>
              <p className="text-sm text-slate-400">
                Cada plan define su precio y duración en días.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.id}
                className="rounded-xl border border-white/10 bg-slate-900/60 p-4"
              >
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
                <p className="mt-3 inline-flex rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10">
                  {plan.durationDays} días
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          <section
            aria-labelledby="socios-title"
            className="rounded-2xl border border-white/10 bg-slate-900/60 lg:col-span-3"
          >
            <div className="border-b border-white/10 p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2
                    id="socios-title"
                    className="text-lg font-semibold text-white"
                  >
                    Socios
                  </h2>
                  <p className="text-sm text-slate-400">
                    Consulta, actualiza o da de baja a los socios.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewMember((visible) => !visible)
                    setNewMemberErrors({})
                  }}
                  className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  {showNewMember ? 'Cancelar registro' : '+ Nuevo socio'}
                </button>
              </div>

              <label htmlFor="member-search" className="sr-only">
                Buscar socio
              </label>
              <input
                id="member-search"
                type="search"
                placeholder="Buscar por ID, nombre o correo…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${inputClasses} mt-4`}
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="new-name"
                        className="mb-1.5 block text-xs font-medium text-slate-300"
                      >
                        Nombre completo
                      </label>
                      <input
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
                        aria-invalid={Boolean(newMemberErrors.name)}
                        className={
                          newMemberErrors.name ? errorInputClasses : inputClasses
                        }
                        placeholder="Ej. Lucía Fernández"
                      />
                      {newMemberErrors.name && (
                        <p className="mt-1.5 text-xs text-red-400" role="alert">
                          {newMemberErrors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="new-email"
                        className="mb-1.5 block text-xs font-medium text-slate-300"
                      >
                        Correo electrónico
                      </label>
                      <input
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
                        aria-invalid={Boolean(newMemberErrors.email)}
                        className={
                          newMemberErrors.email
                            ? errorInputClasses
                            : inputClasses
                        }
                        placeholder="nombre@dominio.com"
                      />
                      {newMemberErrors.email && (
                        <p className="mt-1.5 text-xs text-red-400" role="alert">
                          {newMemberErrors.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Guardar socio
                  </button>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-2 py-3 font-medium">Socio</th>
                      <th className="px-2 py-3 font-medium">Estado</th>
                      <th className="px-2 py-3 font-medium">Membresía</th>
                      <th className="px-2 py-3 font-medium">Vence</th>
                      <th className="px-2 py-3 text-right font-medium">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredMembers.map((member) => {
                      const info = getMembershipInfo(member)

                      return (
                        <tr
                          key={member.id}
                          className={
                            member.id === selectedId
                              ? 'bg-white/5'
                              : 'transition hover:bg-white/5'
                          }
                        >
                          <td className="px-2 py-3">
                            <p className="font-medium text-white">
                              <span className="mr-2 text-xs font-mono text-slate-500">
                                {member.id}
                              </span>
                              {member.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {member.email}
                            </p>
                          </td>
                          <td className="px-2 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                                member.status === MEMBER_STATUS.INACTIVE
                                  ? 'bg-red-500/10 text-red-300 ring-red-500/30'
                                  : 'bg-sky-500/10 text-sky-300 ring-sky-500/30'
                              }`}
                            >
                              {member.status === MEMBER_STATUS.INACTIVE
                                ? 'H2 · Baja'
                                : 'Activo'}
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${membershipBadgeClasses(info.status)}`}
                            >
                              {info.label}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-xs text-slate-400">
                            {info.endDate ? formatDate(info.endDate) : '—'}
                          </td>
                          <td className="px-2 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleSelectMember(member)}
                              className="rounded-md px-2 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10"
                            >
                              Gestionar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {filteredMembers.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No se encontraron socios que coincidan con “{search}”.
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="space-y-6 lg:col-span-2">
            <section
              aria-labelledby="asignar-title"
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-6"
            >
              <h2
                id="asignar-title"
                className="text-lg font-semibold text-white"
              >
                Asignar membresía
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                El vencimiento se calcula sumando la duración del plan a la
                fecha de inicio.
              </p>

              <form onSubmit={handleAssignMembership} noValidate className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="assign-member"
                    className="mb-1.5 block text-xs font-medium text-slate-300"
                  >
                    ID del socio
                  </label>
                  <input
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
                    className={inputClasses}
                    placeholder="Ej. H1"
                  />
                  <datalist id="member-ids">
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </datalist>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Prueba con un ID inexistente (por ejemplo, H99) para ver el
                    error 404.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="assign-plan"
                    className="mb-1.5 block text-xs font-medium text-slate-300"
                  >
                    Plan
                  </label>
                  <select
                    id="assign-plan"
                    value={assignForm.planId}
                    onChange={(event) => {
                      setAssignForm((previous) => ({
                        ...previous,
                        planId: event.target.value,
                      }))
                      setAssignFeedback(null)
                    }}
                    className={inputClasses}
                  >
                    {PLANS.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} · {formatCurrency(plan.price)} ·{' '}
                        {plan.durationDays} días
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="assign-start"
                    className="mb-1.5 block text-xs font-medium text-slate-300"
                  >
                    Fecha de inicio
                  </label>
                  <input
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
                    className={inputClasses}
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Vencimiento calculado:{' '}
                    <span className="font-medium text-slate-300">
                      {previewEndDate ? formatDate(previewEndDate) : '—'}
                    </span>
                    {selectedPlan
                      ? ` (${selectedPlan.durationDays} días)`
                      : ''}
                  </p>
                </div>

                {assignFeedback && (
                  <Alert
                    tone={assignFeedback.tone}
                    code={assignFeedback.code}
                    message={assignFeedback.message}
                  />
                )}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  Asignar y activar membresía
                </button>
              </form>
            </section>

            <section
              aria-labelledby="consultar-title"
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-6"
            >
              <h2
                id="consultar-title"
                className="text-lg font-semibold text-white"
              >
                Consultar membresía
              </h2>

              <form
                onSubmit={handleConsultMembership}
                noValidate
                className="mt-4 flex gap-2"
              >
                <div className="flex-1">
                  <label htmlFor="consult-member" className="sr-only">
                    ID del socio a consultar
                  </label>
                  <input
                    id="consult-member"
                    value={consultId}
                    onChange={(event) => {
                      setConsultId(event.target.value)
                      setConsultFeedback(null)
                    }}
                    className={inputClasses}
                    placeholder="ID del socio (ej. H3)"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:text-white"
                >
                  Consultar
                </button>
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
                      <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300 ring-1 ring-red-500/30">
                        H2 · Baja
                      </span>
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
            </section>

            {selectedMember && (
              <section
                aria-labelledby="editar-title"
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2
                      id="editar-title"
                      className="text-lg font-semibold text-white"
                    >
                      Editar socio
                    </h2>
                    <p className="text-xs text-slate-500">
                      {selectedMember.id} · alta el{' '}
                      {formatDate(selectedMember.joinedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(null)
                      setDraftErrors({})
                      setMemberFeedback(null)
                    }}
                    className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:text-white"
                  >
                    Cerrar
                  </button>
                </div>

                <form
                  onSubmit={handleUpdateMember}
                  noValidate
                  className="mt-4 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="edit-name"
                      className="mb-1.5 block text-xs font-medium text-slate-300"
                    >
                      Nombre completo
                    </label>
                    <input
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
                      aria-invalid={Boolean(draftErrors.name)}
                      className={
                        draftErrors.name ? errorInputClasses : inputClasses
                      }
                    />
                    {draftErrors.name && (
                      <p className="mt-1.5 text-xs text-red-400" role="alert">
                        {draftErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="edit-email"
                      className="mb-1.5 block text-xs font-medium text-slate-300"
                    >
                      Correo electrónico
                    </label>
                    <input
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
                      aria-invalid={Boolean(draftErrors.email)}
                      className={
                        draftErrors.email ? errorInputClasses : inputClasses
                      }
                    />
                    {draftErrors.email && (
                      <p className="mt-1.5 text-xs text-red-400" role="alert">
                        {draftErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="edit-status"
                      className="mb-1.5 block text-xs font-medium text-slate-300"
                    >
                      Estado del socio
                    </label>
                    <select
                      id="edit-status"
                      value={draft.status}
                      onChange={(event) => {
                        setDraft((previous) => ({
                          ...previous,
                          status: event.target.value,
                        }))
                        setMemberFeedback(null)
                      }}
                      className={inputClasses}
                    >
                      <option value={MEMBER_STATUS.ACTIVE}>Activo</option>
                      <option value={MEMBER_STATUS.INACTIVE}>
                        Inactivo (baja · H2)
                      </option>
                    </select>
                    <p className="mt-1.5 text-xs text-slate-500">
                      Un socio inactivo (H2) no puede recibir membresías.
                    </p>
                  </div>

                  {memberFeedback && (
                    <Alert
                      tone={memberFeedback.tone}
                      message={memberFeedback.message}
                    />
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-sky-500 px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  >
                    Guardar cambios
                  </button>
                </form>
              </section>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600">
          Los datos de esta demo viven solo en memoria y se reinician al
          recargar la página.
        </p>
      </main>
    </div>
  )
}

export default Memberships
