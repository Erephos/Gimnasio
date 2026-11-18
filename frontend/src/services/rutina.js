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
