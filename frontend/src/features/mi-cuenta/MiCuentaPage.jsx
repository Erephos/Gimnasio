import { useEffect, useState } from 'react'
import { ROLE_LABELS, ROLES } from '../../config/roles.js'
import { getMiMembresiaVigente, getMiPerfil } from '../../services/data.js'
import { useAuth } from '../auth/useAuth.js'

export default function MiCuentaPage() {
  const { user } = useAuth()
  const [socio, setSocio] = useState(null)
  const [membresia, setMembresia] = useState(null)
  const [loading, setLoading] = useState(user.rol === ROLES.SOCIO)

  useEffect(() => {
    if (user.rol !== ROLES.SOCIO) return
    let cancelled = false
    Promise.all([getMiPerfil(), getMiMembresiaVigente()]).then(([s, m]) => {
      if (cancelled) return
      setSocio(s)
      setMembresia(m)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [user.rol])

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Mi cuenta</h1>
        <p className="text-sm text-slate-400">Perfil y membresía.</p>
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
        {user.rol !== ROLES.SOCIO ? (
          <p className="border-t border-white/5 pt-4 text-sm text-slate-500">Cuenta de staff sin ficha de socio.</p>
        ) : loading ? (
          <p className="border-t border-white/5 pt-4 text-sm text-slate-500">Cargando…</p>
        ) : (
          <div className="space-y-2 border-t border-white/5 pt-4 text-sm">
            <p className="text-slate-400">DNI: <span className="text-white">{socio.dni}</span></p>
            <p className="text-slate-400">Plan: <span className="text-white">{membresia?.planNombre || 'Sin membresía asignada'}</span></p>
            <p className="text-slate-400">
              Estado: <span className={membresia?.vigente ? 'text-emerald-400' : 'text-amber-400'}>
                {membresia ? (membresia.vigente ? `Vigente hasta ${membresia.fechaFin}` : `Vencida (${membresia.fechaFin})`) : 'Sin membresía'}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
