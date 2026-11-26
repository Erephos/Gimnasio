import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

// Indices del modelo de 33 puntos de MediaPipe Pose.
const HIP = { left: 23, right: 24 }
const KNEE = { left: 25, right: 26 }
const ANKLE = { left: 27, right: 28 }
const MIN_VISIBILITY = 0.5

let landmarker = null

export async function loadPoseLandmarker() {
  if (landmarker) return landmarker
  // El WASM y el modelo se bajan de CDN; no se versionan localmente por su
  // tamano (a diferencia de los modelos de face-api.js en public/models).
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm'
  )
  landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO',
    numPoses: 1
  })
  return landmarker
}

function angleAt(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y }
  const cb = { x: c.x - b.x, y: c.y - b.y }
  const magAb = Math.hypot(ab.x, ab.y)
  const magCb = Math.hypot(cb.x, cb.y)
  if (magAb === 0 || magCb === 0) return null
  const cos = (ab.x * cb.x + ab.y * cb.y) / (magAb * magCb)
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI
}

function sideVisibility(points, side) {
  return (points[HIP[side]]?.visibility ?? 0) + (points[KNEE[side]]?.visibility ?? 0) + (points[ANKLE[side]]?.visibility ?? 0)
}

// Devuelve el angulo de rodilla (cadera-rodilla-tobillo) del lado mas visible,
// o null si la camara no esta viendo las piernas con suficiente confianza.
export function kneeAngleFromLandmarks(points) {
  if (!points?.length) return null
  const side = sideVisibility(points, 'left') >= sideVisibility(points, 'right') ? 'left' : 'right'
  const hip = points[HIP[side]]
  const knee = points[KNEE[side]]
  const ankle = points[ANKLE[side]]
  if ((hip?.visibility ?? 0) < MIN_VISIBILITY || (knee?.visibility ?? 0) < MIN_VISIBILITY || (ankle?.visibility ?? 0) < MIN_VISIBILITY) return null
  return angleAt(hip, knee, ankle)
}

// Maquina de 2 estados para contar sentadillas a partir del angulo de rodilla:
// de pie (angulo alto) -> agachado (angulo bajo) -> de pie vuelve a contar 1 rep.
// Evita doble conteo por ruido frame a frame.
export function createSquatCounter({ downThreshold = 110, upThreshold = 155 } = {}) {
  let standing = true
  let reps = 0
  return {
    get reps() { return reps },
    update(angle) {
      if (angle == null) return reps
      if (standing && angle < downThreshold) {
        standing = false
      } else if (!standing && angle > upThreshold) {
        standing = true
        reps += 1
      }
      return reps
    },
    reset() { standing = true; reps = 0 }
  }
}
