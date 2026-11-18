import { useEffect, useRef, useState } from 'react'
import { getDescriptor, loadModels } from '../../services/face.js'

export default function FaceCapture({ onCapture, label = 'Capturar rostro' }) {
  const videoRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let stream
    let cancelled = false
    loadModels()
      .then(() => navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } }))
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return }
        stream = s
        const video = videoRef.current
        if (!video) return
        video.srcObject = s
        // getUserMedia resuelve antes de que el <video> pinte el primer
        // frame real; si se captura antes de "loadeddata" el frame suele
        // venir negro y face-api no detecta nada.
        video.onloadeddata = () => { if (!cancelled) setReady(true) }
      })
      .catch((err) => setError('No se pudo acceder a la cámara: ' + err.message))
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  async function capturar() {
    setBusy(true)
    setError('')
    try {
      const descriptor = await getDescriptor(videoRef.current)
      if (!descriptor) {
        setError('No se detectó ningún rostro. Acércate a la cámara y vuelve a intentar.')
        return
      }
      await onCapture(descriptor)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-xl border border-white/10 bg-black" />
      {!ready && !error && <p className="text-xs text-slate-500">Cargando cámara…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="button" onClick={capturar} disabled={!ready || busy} className="w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-60">
        {busy ? 'Procesando…' : label}
      </button>
    </div>
  )
}
