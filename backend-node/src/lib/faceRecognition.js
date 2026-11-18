// Matching de rostros 100% local: face-api.js (en el navegador) ya entrega
// un descriptor de 128 numeros por cara. Aqui solo comparamos distancia
// euclidiana contra los descriptores enrolados -- sin llamadas externas.
const MATCH_THRESHOLD = 0.6 // valor estandar recomendado por face-api.js para face_recognition_model

function euclideanDistance(a, b) {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2
  return Math.sqrt(sum)
}

export function matchDescriptor(descriptor, candidatos) {
  let best = null
  for (const c of candidatos) {
    const distancia = euclideanDistance(descriptor, c.descriptor)
    if (distancia < MATCH_THRESHOLD && (!best || distancia < best.distancia)) best = { id: c.id, distancia }
  }
  return best
}
