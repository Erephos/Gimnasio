import { getPeruNow } from './ingresos.js'
import {
  MEMBER_STATUS,
  addDays,
  createInitialMembers,
  findMemberById,
  formatDate,
  getMembershipInfo,
  isValidISODate,
} from './memberships.js'

export const TRAINER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

export const DISCIPLINES = [
  { id: 'spinning', name: 'Spinning' },
  { id: 'yoga', name: 'Yoga' },
  { id: 'funcional', name: 'Funcional' },
]

const TRAINER_DNI_PATTERN = /^\d{8}$/
const TIME_PATTERN = /^\d{2}:\d{2}$/

function normalizeRoom(value) {
  return String(value ?? '').trim().toLowerCase()
}

function isValidTime(value) {
  if (!TIME_PATTERN.test(value)) return false

  const [hours, minutes] = value.split(':').map(Number)

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

export function getDiscipline(disciplineId) {
  return DISCIPLINES.find((discipline) => discipline.id === disciplineId)
}

export function findTrainerById(trainers, trainerId) {
  const normalizedId = String(trainerId ?? '')
    .trim()
    .toLowerCase()

  if (!normalizedId) return null

  return (
    trainers.find(
      (trainer) => trainer.id.toLowerCase() === normalizedId,
    ) ?? null
  )
}

export function findClassById(classes, classId) {
  return classes.find((classItem) => classItem.id === classId) ?? null
}

export function nextTrainerId(trainers) {
  const highestId = trainers.reduce((highest, trainer) => {
    const numericId = Number(trainer.id.replace(/\D/g, '')) || 0
    return Math.max(highest, numericId)
  }, 0)

  return `E${highestId + 1}`
}

export function nextClassId(classes) {
  const highestId = classes.reduce((highest, classItem) => {
    const numericId = Number(classItem.id.replace(/\D/g, '')) || 0
    return Math.max(highest, numericId)
  }, 0)

  return `C${highestId + 1}`
}

export function getClassEnrollments(enrollments, classId) {
  return enrollments.filter((enrollment) => enrollment.classId === classId)
}

export function getMemberEnrollment(enrollments, classId, memberId) {
  return (
    enrollments.find(
      (enrollment) =>
        enrollment.classId === classId &&
        enrollment.memberId === memberId,
    ) ?? null
  )
}

export function getClassOccupancy(classItem, enrollments) {
  const enrolledCount = getClassEnrollments(enrollments, classItem.id).length

  return {
    enrolledCount,
    capacity: classItem.capacity,
    spotsLeft: Math.max(classItem.capacity - enrolledCount, 0),
  }
}

export function validateTrainerInput(
  draft,
  trainers,
  ignoreTrainerId = null,
) {
  const errors = {}
  const name = String(draft.name ?? '').trim()
  const dni = String(draft.dni ?? '').trim()

  if (!name) {
    errors.name = 'El nombre del entrenador es obligatorio.'
  } else if (name.length < 3) {
    errors.name = 'El nombre debe tener al menos 3 caracteres.'
  } else if (name.length > 80) {
    errors.name = 'El nombre no puede superar los 80 caracteres.'
  }

  if (!dni) {
    errors.dni = 'El DNI del entrenador es obligatorio.'
  } else if (!TRAINER_DNI_PATTERN.test(dni)) {
    errors.dni = 'El DNI debe tener exactamente 8 dígitos numéricos.'
  } else if (
    trainers.some(
      (trainer) =>
        trainer.id !== ignoreTrainerId && trainer.dni === dni,
    )
  ) {
    errors.dni = 'Ya existe un entrenador registrado con este DNI.'
  }

  if (!getDiscipline(draft.discipline)) {
    errors.discipline =
      'Selecciona una disciplina válida: Spinning, Yoga o Funcional.'
  }

  return errors
}

export function registerTrainer({ trainers, draft }) {
  const errors = validateTrainerInput(draft, trainers)

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      code: 400,
      errors,
      message:
        'Revisa los datos del entrenador: hay campos vacíos o con formato inválido.',
    }
  }

  const discipline = getDiscipline(draft.discipline)
  const trainer = {
    id: nextTrainerId(trainers),
    name: String(draft.name).trim(),
    dni: String(draft.dni).trim(),
    discipline: discipline.id,
    status: TRAINER_STATUS.ACTIVE,
  }

  return {
    ok: true,
    code: 201,
    trainer,
    message: `Entrenador ${trainer.name} (${trainer.id}) registrado en ${discipline.name}.`,
  }
}

export function toggleTrainerStatus({ trainers, trainerId }) {
  const trainer = findTrainerById(trainers, trainerId)

  if (!trainer) {
    return {
      ok: false,
      code: 404,
      message: `No se encontró ningún entrenador con el ID "${String(trainerId).trim() || '—'}".`,
    }
  }

  const status =
    trainer.status === TRAINER_STATUS.ACTIVE
      ? TRAINER_STATUS.INACTIVE
      : TRAINER_STATUS.ACTIVE

  return {
    ok: true,
    code: 200,
    trainer: { ...trainer, status },
    message:
      status === TRAINER_STATUS.ACTIVE
        ? `${trainer.name} fue reactivado y ya puede recibir clases.`
        : `${trainer.name} fue dado de baja. No se le podrán asignar nuevas clases.`,
  }
}

export function registerClass({ trainers, classes, draft }) {
  const discipline = getDiscipline(draft.discipline)
  const date = String(draft.date ?? '').trim()
  const time = String(draft.time ?? '').trim()
  const room = String(draft.room ?? '').trim()
  const capacity = Number(draft.capacity)

  if (!discipline) {
    return {
      ok: false,
      code: 400,
      message:
        'Selecciona una disciplina válida: Spinning, Yoga o Funcional.',
    }
  }

  if (!isValidISODate(date)) {
    return {
      ok: false,
      code: 400,
      message: 'Selecciona una fecha válida para la clase.',
    }
  }

  if (!isValidTime(time)) {
    return {
      ok: false,
      code: 400,
      message: 'Selecciona una hora válida en formato HH:mm.',
    }
  }

  if (!room) {
    return {
      ok: false,
      code: 400,
      message: 'Indica el aula o sala donde se dictará la clase.',
    }
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    return {
      ok: false,
      code: 400,
      message:
        'El aforo máximo debe ser un número entero mayor que cero.',
    }
  }

  const trainer = findTrainerById(trainers, draft.trainerId)

  if (!trainer) {
    return {
      ok: false,
      code: 404,
      message: `No existe ningún entrenador con el ID "${String(draft.trainerId ?? '').trim() || '—'}". Verifica el identificador e inténtalo de nuevo.`,
    }
  }

  if (trainer.status === TRAINER_STATUS.INACTIVE) {
    return {
      ok: false,
      code: 403,
      message: `${trainer.name} está inactivo (dado de baja) y no se puede asignar a una clase. Reactívalo primero.`,
    }
  }

  const roomConflict = classes.find(
    (classItem) =>
      classItem.date === date &&
      classItem.time === time &&
      normalizeRoom(classItem.room) === normalizeRoom(room),
  )

  if (roomConflict) {
    return {
      ok: false,
      code: 409,
      message: `El ${room} ya tiene la clase "${getDiscipline(roomConflict.discipline)?.name ?? ''}" programada el ${formatDate(date)} a las ${time}. Elige otra aula u horario.`,
    }
  }

  const trainerConflict = classes.find(
    (classItem) =>
      classItem.date === date &&
      classItem.time === time &&
      classItem.trainerId === trainer.id,
  )

  if (trainerConflict) {
    return {
      ok: false,
      code: 409,
      message: `${trainer.name} ya tiene una clase el ${formatDate(date)} a las ${time} (${getDiscipline(trainerConflict.discipline)?.name ?? ''}, ${trainerConflict.room}). Un entrenador no puede dictar dos clases a la misma hora.`,
    }
  }

  const classItem = {
    id: nextClassId(classes),
    discipline: discipline.id,
    date,
    time,
    room,
    trainerId: trainer.id,
    capacity,
  }

  return {
    ok: true,
    code: 201,
    classItem,
    trainer,
    message: `Clase ${discipline.name} programada el ${formatDate(date)} a las ${time} en ${room}, con ${trainer.name} y aforo de ${capacity}.`,
  }
}

export function enrollMember({
  members,
  classes,
  enrollments,
  classId,
  memberId,
  today = getPeruNow().dateKey,
}) {
  const classItem = findClassById(classes, classId)

  if (!classItem) {
    return {
      ok: false,
      code: 404,
      message: 'La clase seleccionada no existe.',
    }
  }

  const normalizedMemberId = String(memberId ?? '').trim()

  if (!normalizedMemberId) {
    return {
      ok: false,
      code: 400,
      message: 'Selecciona un socio antes de inscribirlo.',
    }
  }

  const member = findMemberById(members, normalizedMemberId)

  if (!member) {
    return {
      ok: false,
      code: 404,
      message: `No existe ningún socio con el ID "${normalizedMemberId}".`,
    }
  }

  if (member.status === MEMBER_STATUS.INACTIVE) {
    return {
      ok: false,
      code: 403,
      message: `${member.name} está dado de baja, por lo que no puede inscribirse a clases.`,
    }
  }

  const membership = getMembershipInfo(member, today)

  if (membership.status === 'none') {
    return {
      ok: false,
      code: 403,
      message: `${member.name} no tiene ninguna membresía registrada. Debe adquirir una antes de inscribirse.`,
    }
  }

  if (membership.status === 'expired') {
    return {
      ok: false,
      code: 403,
      message: `La membresía de ${member.name} venció el ${formatDate(membership.endDate)}. Renueva la membresía antes de inscribirse.`,
    }
  }

  const existingEnrollment = getMemberEnrollment(
    enrollments,
    classItem.id,
    member.id,
  )

  if (existingEnrollment) {
    return {
      ok: false,
      code: 409,
      message: `${member.name} ya está inscrito en esta clase. No se permiten inscripciones duplicadas.`,
    }
  }

  const { enrolledCount, capacity, spotsLeft } = getClassOccupancy(
    classItem,
    enrollments,
  )

  if (spotsLeft <= 0) {
    return {
      ok: false,
      code: 409,
      message: `La clase está llena (${enrolledCount}/${capacity} inscritos). No hay cupos disponibles; elige otra clase.`,
    }
  }

  const enrollment = {
    id: `${classItem.id}-${member.id}`,
    classId: classItem.id,
    memberId: member.id,
    memberName: member.name,
    dni: member.dni,
    attended: false,
    attendedAt: null,
  }

  return {
    ok: true,
    code: 201,
    enrollment,
    message: `${member.name} quedó inscrito en ${getDiscipline(classItem.discipline)?.name ?? 'la clase'} del ${formatDate(classItem.date)} a las ${classItem.time}. Cupos restantes: ${spotsLeft - 1}.`,
  }
}

export function cancelEnrollment({ enrollments, classId, memberId }) {
  const enrollment = getMemberEnrollment(enrollments, classId, memberId)

  if (!enrollment) {
    return {
      ok: false,
      code: 404,
      message: 'No se encontró una inscripción de este socio en la clase.',
    }
  }

  return {
    ok: true,
    code: 200,
    removed: enrollment,
    message: `Reserva de ${enrollment.memberName} cancelada. El cupo quedó libre para otro socio.`,
  }
}

export function markAttendance({ enrollments, classId, memberId }) {
  const enrollment = getMemberEnrollment(enrollments, classId, memberId)

  if (!enrollment) {
    return {
      ok: false,
      code: 403,
      message:
        'Solo se puede marcar la asistencia de socios inscritos en esta clase.',
    }
  }

  if (enrollment.attended) {
    return {
      ok: false,
      code: 409,
      message: `La asistencia de ${enrollment.memberName} ya fue marcada para esta clase. No se puede registrar dos veces.`,
    }
  }

  const attendedAt = getPeruNow().time

  return {
    ok: true,
    code: 200,
    enrollment: {
      ...enrollment,
      attended: true,
      attendedAt,
    },
    message: `Asistencia de ${enrollment.memberName} marcada a las ${attendedAt} (hora de Perú).`,
  }
}

export function createInitialTrainers() {
  return [
    {
      id: 'E1',
      name: 'Diego Salazar',
      dni: '44556677',
      discipline: 'spinning',
      status: TRAINER_STATUS.ACTIVE,
    },
    {
      id: 'E2',
      name: 'Valeria Ríos',
      dni: '55667788',
      discipline: 'yoga',
      status: TRAINER_STATUS.ACTIVE,
    },
    {
      id: 'E3',
      name: 'Bruno Acosta',
      dni: '66778899',
      discipline: 'funcional',
      status: TRAINER_STATUS.INACTIVE,
    },
  ]
}

export function createInitialClasses() {
  const today = getPeruNow().dateKey

  return [
    {
      id: 'C1',
      discipline: 'spinning',
      date: today,
      time: '07:00',
      room: 'Aula 1',
      trainerId: 'E1',
      capacity: 1,
    },
    {
      id: 'C2',
      discipline: 'yoga',
      date: today,
      time: '19:00',
      room: 'Aula 2',
      trainerId: 'E2',
      capacity: 8,
    },
    {
      id: 'C3',
      discipline: 'funcional',
      date: addDays(today, 1),
      time: '18:00',
      room: 'Aula 3',
      trainerId: 'E1',
      capacity: 1,
    },
  ]
}

export function createInitialEnrollments() {
  const members = createInitialMembers()
  const seeds = [
    { classId: 'C1', memberId: 'H3', attended: true, attendedAt: '07:05:00' },
    { classId: 'C2', memberId: 'H3', attended: false, attendedAt: null },
  ]

  return seeds.map((seed) => {
    const member = members.find((item) => item.id === seed.memberId)

    return {
      id: `${seed.classId}-${seed.memberId}`,
      classId: seed.classId,
      memberId: seed.memberId,
      memberName: member.name,
      dni: member.dni,
      attended: seed.attended,
      attendedAt: seed.attendedAt,
    }
  })
}

export const CLASS_ROOMS = ['Aula 1', 'Aula 2', 'Aula 3', 'Sala de pesas']
