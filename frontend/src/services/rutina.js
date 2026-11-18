// Rutina sugerida por dia de la semana. Deliberadamente una regla fija
// (no depende de ningun servicio externo) para que el saludo de check-in
// nunca falle ni se demore en la feria, sin importar la cuota de Azure.
const RUTINAS = {
  0: 'descanso activo y estiramiento',
  1: 'piernas',
  2: 'pecho y brazos',
  3: 'espalda y hombros',
  4: 'cardio',
  5: 'full body',
  6: 'core y funcional',
}

export function rutinaDelDia(fecha = new Date()) {
  return RUTINAS[fecha.getDay()]
}

const TIPS = [
  'Tip: hidrátate antes de empezar, el cuerpo rinde mejor.',
  'Dato curioso: estirar unos minutos antes reduce el riesgo de lesiones.',
  'El músculo se repara mientras duermes, no mientras entrenas. No te saltes el descanso.',
  'Tip: exhala en el momento de mayor esfuerzo, te da más fuerza.',
  'Dato curioso: el corazón de un atleta entrenado puede latir menos de 40 veces por minuto en reposo.',
]

function tipAleatorio(probabilidad = 0.4) {
  if (Math.random() > probabilidad) return null
  return TIPS[Math.floor(Math.random() * TIPS.length)]
}

// Arma el saludo con datos reales del socio cuando existen (reserva de
// clase de hoy -> salon + coach), y cae a la rutina sugerida por dia
// cuando no tiene ninguna clase reservada. A veces suma un tip curioso.
export function construirSaludo({ nombre, proximaClase }) {
  let mensaje = proximaClase
    ? `Hola ${nombre}, bienvenido o bienvenida a ximEdgar Gym. Por favor acércate al salón ${proximaClase.aula} con el coach ${proximaClase.entrenadorNombre.split(' ')[0]}, que te indicará tu rutina de ${proximaClase.disciplina}.`
    : `Hola ${nombre}, bienvenido o bienvenida a ximEdgar Gym. Hoy te toca rutina de ${rutinaDelDia()}.`
  const tip = tipAleatorio()
  if (tip) mensaje += ` ${tip}`
  return mensaje
}
