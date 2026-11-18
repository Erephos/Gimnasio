import * as faceapi from 'face-api.js'

let loaded = false

export async function loadModels() {
  if (loaded) return
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  ])
  loaded = true
}

// Devuelve un array de 128 numeros (la "huella" facial) o null si no
// detecta ninguna cara en el frame actual del video.
export async function getDescriptor(videoEl) {
  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor()
  return detection ? Array.from(detection.descriptor) : null
}
