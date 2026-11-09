import { useMemo } from 'react'
import { ROLE_LABELS } from '../../config/roles.js'
import { listPlanes, listSocios } from '../../services/data.js'
import { useAuth } from '../auth/useAuth.js'

export default function MiCuentaPage() {
  const { user } = useAuth()
  const socios = useMemo(() => listSocios(), [])
  const planes = useMemo(() => listPlanes(true), [])
  const socio = socios.find((s) => s.correo === user.correo)
  const plan = socio ? planes.find((p) => p.id === socio.planId) : null

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Mi cuenta</h1>
        <p className="text-sm text-slate-400">Perfil y membresía (datos locales).</p>
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-400">
            {user.nombre?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white">{user.nombre}</p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[user.rol]} · {user.correo}</p>
          </div>
        </div>
        {socio ? (
          <div className="space-y-2 border-t border-white/5 pt-4 text-sm">
            <p className="text-slate-400">Código: <span className="text-white">{socio.codigo}</span></p>
            <p className="text-slate-400">DNI: <span className="text-white">{socio.dni}</span></p>
            <p className="text-slate-400">Plan: <span className="text-white">{plan?.nombre || '—'}</span></p>
            <p className="text-slate-400">Estado: <span className="text-white">{socio.estado}</span></p>
            <p className="text-slate-400">Última asistencia: <span className="text-white">{socio.ultimaAsistencia}</span></p>
          </div>
        ) : (
          <p className="border-t border-white/5 pt-4 text-sm text-slate-500">Cuenta de staff sin ficha de socio.</p>
        )}
      </div>
    </div>
  )
}
