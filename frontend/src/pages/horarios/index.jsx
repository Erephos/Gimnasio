import { useState } from 'react'
import {
  CLASS_ROOMS,
  DISCIPLINES,
  TRAINER_STATUS,
  cancelEnrollment,
  createInitialClasses,
  createInitialEnrollments,
  createInitialTrainers,
  enrollMember,
  findTrainerById,
  getClassEnrollments,
  getClassOccupancy,
  getDiscipline,
  markAttendance,
  registerClass,
  registerTrainer,
  toggleTrainerStatus,
} from '../../lib/horarios.js'
import { getPeruNow } from '../../lib/ingresos.js'
import {
  MEMBER_STATUS,
  createInitialMembers,
  formatDate,
  getMembershipInfo,
} from '../../lib/memberships.js'

const inputClasses =
  'w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30'

const errorInputClasses =
  'w-full rounded-lg border border-red-500/60 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-red-500/30'

const DISCIPLINE_BADGES = {
  spinning: 'bg-sky-500/10 text-sky-300 ring-sky-500/30',
  yoga: 'bg-violet-500/10 text-violet-300 ring-violet-500/30',
  funcional: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
}

function Alert({ feedback }) {
  const isError = feedback.tone === 'error'

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
        {feedback.code}
      </span>
      <div>
        <p className="font-semibold">{feedback.title}</p>
        <p className="mt-0.5 leading-relaxed">{feedback.message}</p>
      </div>
    </div>
  )
}

function memberStatusLabel(member, today) {
  if (member.status === MEMBER_STATUS.INACTIVE) return 'socio dado de baja'

  const info = getMembershipInfo(member, today)

  if (info.status === 'active') return 'membresía activa'
  if (info.status === 'expired') return 'membresía vencida'

  return 'sin membresía'
}

function TrainerPreview({ trainerId, trainer }) {
  const trimmedId = String(trainerId ?? '').trim()

  if (!trimmedId) {
    return (
      <p className="text-xs text-slate-500">
        Escribe el ID del entrenador (por ejemplo E1) o elígelo de la lista.
      </p>
    )
  }

  if (!trainer) {
    return (
      <p className="text-xs leading-relaxed text-red-300">
        No existe un entrenador con el ID “{trimmedId}”. Al programar, el
        sistema responderá con el error 404.
      </p>
    )
  }

  if (trainer.status === TRAINER_STATUS.INACTIVE) {
    return (
      <p className="text-xs leading-relaxed text-red-300">
        {trainer.name} está inactivo (dado de baja). No se puede asignar a una
        clase; el sistema responderá con el error 403.
      </p>
    )
  }

  return (
    <p className="text-xs leading-relaxed text-emerald-300">
      {trainer.name} · {getDiscipline(trainer.discipline)?.name} · activo y
      disponible para clases.
    </p>
  )
}

function ClassCard({
  classItem,
  trainer,
  members,
  enrollments,
  today,
  feedback,
  selectedMemberId,
  onSelectMember,
  onEnroll,
  onCancel,
  onMarkAttendance,
}) {
  const discipline = getDiscipline(classItem.discipline)
  const { enrolledCount, capacity, spotsLeft } = getClassOccupancy(
    classItem,
    enrollments,
  )
  const classEnrollments = getClassEnrollments(enrollments, classItem.id)

  return (
    <article className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/60">
      <div className="border-b border-white/10 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${DISCIPLINE_BADGES[classItem.discipline] ?? 'bg-slate-500/10 text-slate-300 ring-slate-500/30'}`}
              >
                {discipline?.name ?? classItem.discipline}
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {classItem.id}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-white">
              {formatDate(classItem.date)} · {classItem.time}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {classItem.room} ·{' '}
              {trainer
                ? `${trainer.name} (${trainer.id})`
                : 'Entrenador no disponible'}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
              spotsLeft === 0
                ? 'bg-red-500/10 text-red-300 ring-red-500/30'
                : 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
            }`}
          >
            {spotsLeft === 0
              ? 'Clase llena'
              : `${spotsLeft} cupo${spotsLeft === 1 ? '' : 's'}`}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {enrolledCount} de {capacity} inscritos
            </span>
            <span>{spotsLeft} disponibles</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-950/60">
            <div
              className={`h-full rounded-full ${spotsLeft === 0 ? 'bg-red-400' : 'bg-emerald-400'}`}
              style={{
                width: `${capacity > 0 ? Math.min((enrolledCount / capacity) * 100, 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col space-y-3 p-4 sm:p-5">
        {classEnrollments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-slate-500">
            Aún no hay socios inscritos en esta clase.
          </p>
        ) : (
          <ul className="space-y-2">
            {classEnrollments.map((enrollment) => (
              <li
                key={enrollment.id}
                className="flex flex-col gap-2 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white">
                    {enrollment.memberName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    DNI {enrollment.dni}
                    {enrollment.attended && enrollment.attendedAt
                      ? ` · asistió ${enrollment.attendedAt}`
                      : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onMarkAttendance(classItem.id, enrollment.memberId)
                    }
                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                      enrollment.attended
                        ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {enrollment.attended ? 'Asistió ✓' : 'Marcar asistencia'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancel(classItem.id, enrollment.memberId)}
                    className="rounded-md px-2 py-1 text-[11px] font-medium text-red-300 transition hover:bg-red-500/10"
                  >
                    Cancelar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <label htmlFor={`member-${classItem.id}`} className="sr-only">
            Socio a inscribir en {discipline?.name ?? classItem.id}
          </label>
          <select
            id={`member-${classItem.id}`}
            value={selectedMemberId}
            onChange={(event) =>
              onSelectMember(classItem.id, event.target.value)
            }
            className={`${inputClasses} flex-1`}
          >
            <option value="">Selecciona un socio…</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.id} · {member.name} · {memberStatusLabel(member, today)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onEnroll(classItem.id)}
            className="rounded-lg bg-emerald-500 px-3 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            Inscribir
          </button>
        </div>

        {feedback && <Alert feedback={feedback} />}
      </div>
    </article>
  )
}

function Horarios() {
  const today = getPeruNow().dateKey
  const [trainers, setTrainers] = useState(createInitialTrainers)
  const [classes, setClasses] = useState(createInitialClasses)
  const [enrollments, setEnrollments] = useState(createInitialEnrollments)
  const [members] = useState(createInitialMembers)

  const [showTrainerForm, setShowTrainerForm] = useState(false)
  const [trainerDraft, setTrainerDraft] = useState({
    name: '',
    dni: '',
    discipline: DISCIPLINES[0].id,
  })
  const [trainerErrors, setTrainerErrors] = useState({})
  const [trainerFeedback, setTrainerFeedback] = useState(null)

  const [classDraft, setClassDraft] = useState({
    discipline: DISCIPLINES[0].id,
    date: today,
    time: '',
    room: '',
    trainerId: '',
    capacity: '',
  })
  const [classFormFeedback, setClassFormFeedback] = useState(null)
  const [classFeedback, setClassFeedback] = useState({})
  const [enrollSelection, setEnrollSelection] = useState({})

  const classTrainer = findTrainerById(trainers, classDraft.trainerId)
  const sortedClasses = [...classes].sort(
    (a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) ||
      a.id.localeCompare(b.id),
  )

  const activeTrainers = trainers.filter(
    (trainer) => trainer.status === TRAINER_STATUS.ACTIVE,
  ).length
  const totalSpots = classes.reduce(
    (total, classItem) =>
      total + getClassOccupancy(classItem, enrollments).spotsLeft,
    0,
  )

  function handleRegisterTrainer(event) {
    event.preventDefault()

    const result = registerTrainer({ trainers, draft: trainerDraft })

    if (!result.ok) {
      setTrainerErrors(result.errors ?? {})
      setTrainerFeedback({
        tone: 'error',
        code: result.code,
        title: 'No se pudo registrar',
        message: result.message,
      })
      return
    }

    setTrainers((previous) => [...previous, result.trainer])
    setTrainerErrors({})
    setTrainerFeedback({
      tone: 'success',
      code: result.code,
      title: 'Entrenador registrado',
      message: result.message,
    })
    setTrainerDraft({
      name: '',
      dni: '',
      discipline: trainerDraft.discipline,
    })
    setShowTrainerForm(false)
  }

  function handleToggleTrainer(trainerId) {
    const result = toggleTrainerStatus({ trainers, trainerId })

    if (!result.ok) {
      setTrainerFeedback({
        tone: 'error',
        code: result.code,
        title: 'No se pudo actualizar',
        message: result.message,
      })
      return
    }

    setTrainers((previous) =>
      previous.map((trainer) =>
        trainer.id === trainerId ? result.trainer : trainer,
      ),
    )
    setTrainerFeedback({
      tone: 'success',
      code: result.code,
      title: 'Estado del entrenador actualizado',
      message: result.message,
    })
  }

  function handleCreateClass(event) {
    event.preventDefault()

    const result = registerClass({ trainers, classes, draft: classDraft })

    if (!result.ok) {
      setClassFormFeedback({
        tone: 'error',
        code: result.code,
        title: 'No se pudo programar la clase',
        message: result.message,
      })
      return
    }

    setClasses((previous) => [...previous, result.classItem])
    setClassFormFeedback({
      tone: 'success',
      code: result.code,
      title: 'Clase programada',
      message: result.message,
    })
    setClassDraft((previous) => ({
      ...previous,
      room: '',
      trainerId: '',
      capacity: '',
    }))
  }

  function handleSelectMember(classId, memberId) {
    setEnrollSelection((previous) => ({ ...previous, [classId]: memberId }))
  }

  function setFeedbackForClass(classId, feedback) {
    setClassFeedback((previous) => ({ ...previous, [classId]: feedback }))
  }

  function handleEnroll(classId) {
    const result = enrollMember({
      members,
      classes,
      enrollments,
      classId,
      memberId: enrollSelection[classId] ?? '',
    })

    if (!result.ok) {
      setFeedbackForClass(classId, {
        tone: 'error',
        code: result.code,
        title: 'No se pudo inscribir',
        message: result.message,
      })
      return
    }

    setEnrollments((previous) => [...previous, result.enrollment])
    setEnrollSelection((previous) => ({ ...previous, [classId]: '' }))
    setFeedbackForClass(classId, {
      tone: 'success',
      code: result.code,
      title: 'Inscripción registrada',
      message: result.message,
    })
  }

  function handleCancel(classId, memberId) {
    const result = cancelEnrollment({ enrollments, classId, memberId })

    if (!result.ok) {
      setFeedbackForClass(classId, {
        tone: 'error',
        code: result.code,
        title: 'No se pudo cancelar',
        message: result.message,
      })
      return
    }

    setEnrollments((previous) =>
      previous.filter((enrollment) => enrollment.id !== result.removed.id),
    )
    setFeedbackForClass(classId, {
      tone: 'success',
      code: result.code,
      title: 'Reserva cancelada',
      message: result.message,
    })
  }

  function handleMarkAttendance(classId, memberId) {
    const result = markAttendance({ enrollments, classId, memberId })

    if (!result.ok) {
      setFeedbackForClass(classId, {
        tone: 'error',
        code: result.code,
        title: 'No se pudo marcar la asistencia',
        message: result.message,
      })
      return
    }

    setEnrollments((previous) =>
      previous.map((enrollment) =>
        enrollment.id === result.enrollment.id
          ? result.enrollment
          : enrollment,
      ),
    )
    setFeedbackForClass(classId, {
      tone: 'success',
      code: result.code,
      title: 'Asistencia registrada',
      message: result.message,
    })
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Horarios y clases grupales
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Registra entrenadores, programa clases con disciplina, fecha, hora,
          aula, entrenador y aforo, y gestiona las inscripciones y la
          asistencia de los socios.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Entrenadores activos', value: activeTrainers },
            { label: 'Clases programadas', value: classes.length },
            { label: 'Inscripciones', value: enrollments.length },
            { label: 'Cupos disponibles', value: totalSpots },
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

      <div className="grid gap-6 lg:grid-cols-5">
        <section
          aria-labelledby="entrenadores-title"
          className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-6 lg:col-span-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="entrenadores-title"
                className="text-lg font-semibold text-white"
              >
                Entrenadores
              </h2>
              <p className="text-sm text-slate-400">
                Solo los activos pueden recibir clases.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowTrainerForm((visible) => !visible)
                setTrainerErrors({})
              }}
              className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              {showTrainerForm ? 'Cancelar' : '+ Nuevo entrenador'}
            </button>
          </div>

          {trainerFeedback && (
            <div className="mt-4">
              <Alert feedback={trainerFeedback} />
            </div>
          )}

          {showTrainerForm && (
            <form
              onSubmit={handleRegisterTrainer}
              noValidate
              className="mt-4 space-y-4 rounded-xl border border-white/10 bg-slate-950/40 p-4"
            >
              <div>
                <label
                  htmlFor="trainer-name"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  Nombre completo
                </label>
                <input
                  id="trainer-name"
                  value={trainerDraft.name}
                  onChange={(event) => {
                    setTrainerDraft((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                    setTrainerErrors((previous) => ({
                      ...previous,
                      name: undefined,
                    }))
                    setTrainerFeedback(null)
                  }}
                  aria-invalid={Boolean(trainerErrors.name)}
                  className={
                    trainerErrors.name ? errorInputClasses : inputClasses
                  }
                  placeholder="Ej. Lucía Fernández"
                />
                {trainerErrors.name && (
                  <p className="mt-1.5 text-xs text-red-400" role="alert">
                    {trainerErrors.name}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="trainer-dni"
                    className="mb-1.5 block text-xs font-medium text-slate-300"
                  >
                    DNI
                  </label>
                  <input
                    id="trainer-dni"
                    inputMode="numeric"
                    value={trainerDraft.dni}
                    onChange={(event) => {
                      setTrainerDraft((previous) => ({
                        ...previous,
                        dni: event.target.value,
                      }))
                      setTrainerErrors((previous) => ({
                        ...previous,
                        dni: undefined,
                      }))
                      setTrainerFeedback(null)
                    }}
                    aria-invalid={Boolean(trainerErrors.dni)}
                    className={
                      trainerErrors.dni ? errorInputClasses : inputClasses
                    }
                    placeholder="8 dígitos"
                  />
                  {trainerErrors.dni && (
                    <p className="mt-1.5 text-xs text-red-400" role="alert">
                      {trainerErrors.dni}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="trainer-discipline"
                    className="mb-1.5 block text-xs font-medium text-slate-300"
                  >
                    Disciplina
                  </label>
                  <select
                    id="trainer-discipline"
                    value={trainerDraft.discipline}
                    onChange={(event) => {
                      setTrainerDraft((previous) => ({
                        ...previous,
                        discipline: event.target.value,
                      }))
                      setTrainerErrors((previous) => ({
                        ...previous,
                        discipline: undefined,
                      }))
                      setTrainerFeedback(null)
                    }}
                    className={inputClasses}
                  >
                    {DISCIPLINES.map((discipline) => (
                      <option key={discipline.id} value={discipline.id}>
                        {discipline.name}
                      </option>
                    ))}
                  </select>
                  {trainerErrors.discipline && (
                    <p className="mt-1.5 text-xs text-red-400" role="alert">
                      {trainerErrors.discipline}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                Guardar entrenador
              </button>
            </form>
          )}

          <ul className="mt-4 space-y-2">
            {trainers.map((trainer) => (
              <li
                key={trainer.id}
                className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    <span className="mr-2 font-mono text-xs text-slate-500">
                      {trainer.id}
                    </span>
                    {trainer.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    DNI {trainer.dni} ·{' '}
                    {getDiscipline(trainer.discipline)?.name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                      trainer.status === TRAINER_STATUS.ACTIVE
                        ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
                        : 'bg-red-500/10 text-red-300 ring-red-500/30'
                    }`}
                  >
                    {trainer.status === TRAINER_STATUS.ACTIVE
                      ? 'Activo'
                      : 'Inactivo'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleTrainer(trainer.id)}
                    className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    {trainer.status === TRAINER_STATUS.ACTIVE
                      ? 'Dar de baja'
                      : 'Reactivar'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="nueva-clase-title"
          className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-6 lg:col-span-3"
        >
          <h2
            id="nueva-clase-title"
            className="text-lg font-semibold text-white"
          >
            Programar clase
          </h2>
          <p className="text-sm text-slate-400">
            El aforo debe ser mayor que cero y no puede repetirse aula ni
            entrenador en el mismo horario.
          </p>

          <form
            onSubmit={handleCreateClass}
            noValidate
            className="mt-4 space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="class-discipline"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  Disciplina
                </label>
                <select
                  id="class-discipline"
                  value={classDraft.discipline}
                  onChange={(event) => {
                    setClassDraft((previous) => ({
                      ...previous,
                      discipline: event.target.value,
                    }))
                    setClassFormFeedback(null)
                  }}
                  className={inputClasses}
                >
                  {DISCIPLINES.map((discipline) => (
                    <option key={discipline.id} value={discipline.id}>
                      {discipline.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="class-date"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  Fecha
                </label>
                <input
                  id="class-date"
                  type="date"
                  value={classDraft.date}
                  onChange={(event) => {
                    setClassDraft((previous) => ({
                      ...previous,
                      date: event.target.value,
                    }))
                    setClassFormFeedback(null)
                  }}
                  className={inputClasses}
                />
              </div>

              <div>
                <label
                  htmlFor="class-time"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  Hora
                </label>
                <input
                  id="class-time"
                  type="time"
                  value={classDraft.time}
                  onChange={(event) => {
                    setClassDraft((previous) => ({
                      ...previous,
                      time: event.target.value,
                    }))
                    setClassFormFeedback(null)
                  }}
                  className={inputClasses}
                />
              </div>

              <div>
                <label
                  htmlFor="class-room"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  Aula o sala
                </label>
                <input
                  id="class-room"
                  list="class-rooms"
                  value={classDraft.room}
                  onChange={(event) => {
                    setClassDraft((previous) => ({
                      ...previous,
                      room: event.target.value,
                    }))
                    setClassFormFeedback(null)
                  }}
                  className={inputClasses}
                  placeholder="Ej. Aula 1"
                />
                <datalist id="class-rooms">
                  {CLASS_ROOMS.map((room) => (
                    <option key={room} value={room} />
                  ))}
                </datalist>
              </div>

              <div>
                <label
                  htmlFor="class-trainer"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  Entrenador
                </label>
                <input
                  id="class-trainer"
                  list="trainer-ids"
                  value={classDraft.trainerId}
                  onChange={(event) => {
                    setClassDraft((previous) => ({
                      ...previous,
                      trainerId: event.target.value,
                    }))
                    setClassFormFeedback(null)
                  }}
                  className={inputClasses}
                  placeholder="Ej. E1"
                />
                <datalist id="trainer-ids">
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name}
                    </option>
                  ))}
                </datalist>
                <div className="mt-1.5">
                  <TrainerPreview
                    trainerId={classDraft.trainerId}
                    trainer={classTrainer}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="class-capacity"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  Aforo máximo
                </label>
                <input
                  id="class-capacity"
                  type="number"
                  min="1"
                  step="1"
                  value={classDraft.capacity}
                  onChange={(event) => {
                    setClassDraft((previous) => ({
                      ...previous,
                      capacity: event.target.value,
                    }))
                    setClassFormFeedback(null)
                  }}
                  className={inputClasses}
                  placeholder="Ej. 12"
                />
              </div>
            </div>

            {classFormFeedback && <Alert feedback={classFormFeedback} />}

            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Programar clase
            </button>
          </form>
        </section>
      </div>

      <section aria-labelledby="clases-title">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="clases-title" className="text-lg font-semibold text-white">
              Clases programadas
            </h2>
            <p className="text-sm text-slate-400">
              Inscribe socios con membresía vigente y marca su asistencia el
              día de la clase.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10">
            {sortedClasses.length}{' '}
            {sortedClasses.length === 1 ? 'clase' : 'clases'}
          </span>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {sortedClasses.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              trainer={findTrainerById(trainers, classItem.trainerId)}
              members={members}
              enrollments={enrollments}
              today={today}
              feedback={classFeedback[classItem.id] ?? null}
              selectedMemberId={enrollSelection[classItem.id] ?? ''}
              onSelectMember={handleSelectMember}
              onEnroll={handleEnroll}
              onCancel={handleCancel}
              onMarkAttendance={handleMarkAttendance}
            />
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-slate-600">
        Demo con datos en memoria: entrenadores, clases e inscripciones se
        reinician al recargar la página. La fecha y la hora se manejan en la
        zona horaria de Perú.
      </p>
    </main>
  )
}

export default Horarios
