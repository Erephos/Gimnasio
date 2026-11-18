// Cliente de Azure AI Face API (deteccion + identificacion 1:N contra un
// PersonGroup). Sin probar contra un recurso real todavia: la funcion de
// identificacion esta en "Limited Access" y Edgar recien solicito el
// acceso. Revisar contra la documentacion vigente del recurso en cuanto
// llegue la aprobacion, antes de confiar en esto para la feria.
import { fail } from './http.js'

const API_VERSION = 'v1.0'
const PERSON_GROUP_ID = process.env.AZURE_FACE_PERSON_GROUP_ID ?? 'gimnasio-socios'

function assertConfigured() {
  if (!process.env.AZURE_FACE_ENDPOINT || !process.env.AZURE_FACE_KEY) {
    throw fail.bad('El reconocimiento facial no esta configurado (faltan AZURE_FACE_ENDPOINT / AZURE_FACE_KEY en .env)')
  }
}

async function call(path, { method = 'GET', json, imageBuffer } = {}) {
  assertConfigured()
  const res = await fetch(`${process.env.AZURE_FACE_ENDPOINT}/face/${API_VERSION}${path}`, {
    method,
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.AZURE_FACE_KEY,
      'Content-Type': imageBuffer ? 'application/octet-stream' : 'application/json'
    },
    body: imageBuffer ?? (json ? JSON.stringify(json) : undefined)
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw fail.bad(`Azure Face API: ${data?.error?.message ?? res.statusText}`)
  return data
}

async function ensurePersonGroup() {
  const res = await fetch(`${process.env.AZURE_FACE_ENDPOINT}/face/${API_VERSION}/persongroups/${PERSON_GROUP_ID}`, {
    headers: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_FACE_KEY }
  })
  if (res.status === 200) return
  await call(`/persongroups/${PERSON_GROUP_ID}`, { method: 'PUT', json: { name: PERSON_GROUP_ID, recognitionModel: 'recognition_04' } })
}

async function detectSingleFace(imageBuffer) {
  const faces = await call('/detect?returnFaceId=true&detectionModel=detection_03&recognitionModel=recognition_04', { imageBuffer })
  if (faces.length === 0) throw fail.bad('No se detecto ningun rostro en la imagen')
  if (faces.length > 1) throw fail.bad('Se detecto mas de un rostro; la foto debe tener una sola persona')
  return faces[0].faceId
}

// Entrenar es asincrono en la API; esperamos un poco antes de dar la
// inscripcion por terminada (grupo pequeno, deberia bastar para la feria).
async function trainAndWait(attempts = 10, delayMs = 500) {
  await call(`/persongroups/${PERSON_GROUP_ID}/train`, { method: 'POST' })
  for (let i = 0; i < attempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    const status = await call(`/persongroups/${PERSON_GROUP_ID}/training`)
    if (status.status === 'succeeded') return
    if (status.status === 'failed') throw fail.bad(`Entrenamiento del reconocimiento facial fallo: ${status.message}`)
  }
}

export async function enrollFace(socioId, nombreCompleto, imageBuffer) {
  await ensurePersonGroup()
  const person = await call(`/persongroups/${PERSON_GROUP_ID}/persons`, { method: 'POST', json: { name: nombreCompleto, userData: String(socioId) } })
  await call(`/persongroups/${PERSON_GROUP_ID}/persons/${person.personId}/persistedFaces`, { method: 'POST', imageBuffer })
  await trainAndWait()
  return person.personId
}

export async function identifyFace(imageBuffer) {
  const faceId = await detectSingleFace(imageBuffer)
  const [result] = await call('/identify', { method: 'POST', json: { faceIds: [faceId], personGroupId: PERSON_GROUP_ID, maxNumOfCandidatesReturned: 1, confidenceThreshold: 0.7 } })
  const [candidate] = result?.candidates ?? []
  return candidate ? { personId: candidate.personId, confianza: candidate.confidence } : null
}
