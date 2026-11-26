import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Dumbbell, SwitchCamera, Trophy } from 'lucide-react'
import { listRetoSentadillasTop, submitRetoSentadillas } from '../../services/data.js'
import { createSquatCounter, kneeAngleFromLandmarks, loadPoseLandmarker } from '../../services/pose.js'

const DURACION_SEGUNDOS = 30
const CONEXIONES = [[11, 13], [13, 15], [12, 14], [14, 16], [11, 12], [23, 24], [11, 23], [12, 24], [23, 25], [25, 27], [24, 26], [26, 28]]
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function drawPose(ctx, points, width, height) {
  ctx.clearRect(0, 0, width, height)
  if (!points) return
  ctx.strokeStyle = '#22d3ee'
  ctx.lineWidth = 3
  for (const [a, b] of CONEXIONES) {
    const pa = points[a]
    const pb = points[b]
    if (!pa || !pb || pa.visibility < 0.4 || pb.visibility < 0.4) continue
    ctx.beginPath()
    ctx.moveTo(pa.x * width, pa.y * height)
    ctx.lineTo(pb.x * width, pb.y * height)
    ctx.stroke()
  }
  ctx.fillStyle = '#60a5fa'
  for (const p of points) {
    if (p.visibility < 0.4) continue
    ctx.beginPath()
    ctx.arc(p.x * width, p.y * height, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

export default function RetoSentadillasPage() {
  const [nombre, setNombre] = useState('')
  const [phase, setPhase] = useState('form') // form | loading | countdown | running | finished
  const [attempt, setAttempt] = useState(0)
  const [countdownValue, setCountdownValue] = useState(3)
  const [remaining, setRemaining] = useState(DURACION_SEGUNDOS)
  const [reps, setReps] = useState(0)
  const [error, setError] = useState('')
  const [guardado, setGuardado] = useState(false)
  const [top, setTop] = useState([])
  const [facing, setFacing] = useState('user') // user = selfie, environment = trasera
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (attempt === 0) return
    let cancelled = false
    let stream
    let rafId
    let intervalId
    const counter = createSquatCounter()

    async function run() {
      setPhase('loading')
      setError('')
      try {
        const [landmarker, mediaStream] = await Promise.all([
          loadPoseLandmarker(),
          // Resolucion en vertical: con la camara en horizontal el cuerpo completo
          // solo entraba alejandose varios metros del stand.
          navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 480 }, height: { ideal: 854 } }, audio: false })
        ])
        if (cancelled) { mediaStream.getTracks().forEach((t) => t.stop()); return }
        stream = mediaStream
        const video = videoRef.current
        video.srcObject = stream
        await new Promise((resolve) => { video.onloadeddata = resolve })
        if (cancelled) return

        setPhase('countdown')
        for (let n = 3; n >= 1; n -= 1) {
          setCountdownValue(n)
          await sleep(800)
          if (cancelled) return
        }

        counter.reset()
        setReps(0)
        setRemaining(DURACION_SEGUNDOS)
        setPhase('running')
        let secondsLeft = DURACION_SEGUNDOS

        function detectLoop() {
          if (cancelled) return
          const video2 = videoRef.current
          const canvas = canvasRef.current
          if (video2 && canvas && video2.readyState >= 2) {
            const result = landmarker.detectForVideo(video2, performance.now())
            const points = result.landmarks?.[0] ?? null
            canvas.width = video2.videoWidth
            canvas.height = video2.videoHeight
            drawPose(canvas.getContext('2d'), points, canvas.width, canvas.height)
            setReps(counter.update(kneeAngleFromLandmarks(points)))
          }
          rafId = requestAnimationFrame(detectLoop)
        }
        rafId = requestAnimationFrame(detectLoop)

        intervalId = setInterval(() => {
          secondsLeft -= 1
          setRemaining(secondsLeft)
          if (secondsLeft <= 0) {
            clearInterval(intervalId)
            cancelAnimationFrame(rafId)
            stream.getTracks().forEach((t) => t.stop())
            if (!cancelled) setPhase('finished')
          }
        }, 1000)
      } catch (err) {
        if (!cancelled) {
          setError('No se pudo acceder a la cámara: ' + err.message)
          setPhase('form')
        }
      }
    }
    run()

    return () => {
      cancelled = true
      clearInterval(intervalId)
      cancelAnimationFrame(rafId)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [attempt, facing])

  useEffect(() => {
    if (phase !== 'finished') return
    let cancelled = false
    setGuardado(false)
    submitRetoSentadillas({ nombre, repeticiones: reps, duracionSegundos: DURACION_SEGUNDOS })
      .then(() => !cancelled && setGuardado(true))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => listRetoSentadillasTop(10).then((rows) => !cancelled && setTop(rows)).catch(() => {}))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function empezar(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    setError('')
    setAttempt((a) => a + 1)
  }

  function jugarDeNuevo() {
    setPhase('form')
    setReps(0)
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0b0f1a] p-6">
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300">‹ Volver al login</Link>
        <p className="text-[10px] uppercase tracking-wider text-slate-500">ximEdgar Gym · Stand</p>
      </div>

      <div className="w-full max-w-md">
        {phase === 'form' && (
          <>
            <h1 className="mb-1 flex items-center gap-2 text-2xl font-semibold text-white">
              <Dumbbell size={22} />
              Reto de las sentadillas
            </h1>
            <p className="mb-6 text-sm text-slate-400">Tienes {DURACION_SEGUNDOS} segundos para hacer todas las sentadillas que puedas frente a la cámara. ¡Acércate a nuestro stand!</p>
            <form onSubmit={empezar} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Tu nombre o apodo</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={60} placeholder="Ej. Juan P." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-xs text-slate-400">Cámara: {facing === 'user' ? 'selfie (frontal)' : 'trasera'}</span>
                <button
                  type="button"
                  onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10"
                >
                  <SwitchCamera size={14} />
                  Cambiar
                </button>
              </div>
              {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
              <button type="submit" className="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600">
                Empezar reto →
              </button>
            </form>
          </>
        )}

        {phase !== 'form' && (
          <div className="space-y-4">
            <div
              className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 bg-black"
              style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
            >
              <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            </div>

            {phase === 'loading' && <p className="text-center text-sm text-slate-400">Preparando cámara y detección de postura… (unos segundos)</p>}

            {phase === 'countdown' && (
              <p className="text-center text-6xl font-bold text-blue-400">{countdownValue}</p>
            )}

            {phase === 'running' && (
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Sentadillas</p>
                  <p className="text-3xl font-bold text-white">{reps}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Tiempo</p>
                  <p className="text-3xl font-bold text-blue-400">{remaining}s</p>
                </div>
              </div>
            )}

            {phase === 'finished' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-blue-300">¡Tiempo!</p>
                  <p className="text-4xl font-bold text-white">{reps} sentadillas</p>
                  <p className="mt-1 flex items-center justify-center gap-1 text-xs text-slate-400">
                    {guardado && <CheckCircle2 size={14} />}
                    {guardado ? 'Puntaje guardado' : 'Guardando puntaje…'}
                  </p>
                  {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
                </div>

                {top.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Top del stand</p>
                    <ol className="space-y-1 text-sm text-slate-300">
                      {top.map((row, i) => (
                        <li key={row.id} className={`flex justify-between ${row.nombre === nombre.trim() && row.repeticiones === reps ? 'text-blue-400' : ''}`}>
                          <span>{i + 1}. {row.nombre}</span>
                          <span className="font-semibold">{row.repeticiones}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <button type="button" onClick={jugarDeNuevo} className="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600">
                  Jugar de nuevo
                </button>
                <Link to="/reto-sentadillas/ranking" className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
                  <Trophy size={14} />
                  Ver ranking completo
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
