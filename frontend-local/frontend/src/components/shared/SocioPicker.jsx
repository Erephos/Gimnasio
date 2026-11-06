import { useState } from 'react'
import Field from '../ui/Field.jsx'
import Input from '../ui/Input.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { listSocios } from '../../services/socios.js'

// Buscador de socios activos (por nombre, DNI o correo) reutilizable.
function SocioPicker({ id = 'socio-picker', label = 'Buscar socio', onPick }) {
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query).trim()
  const { data, loading } = useAsync(
    () => (debounced.length >= 2 ? listSocios({ q: debounced, activo: true, size: 5 }) : Promise.resolve(null)),
    [debounced],
  )
  const results = data?.content ?? []

  return (
    <Field id={id} label={label} hint="Escribe al menos 2 letras del nombre, el DNI o el correo.">
      <Input id={id} value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" />
      {debounced.length >= 2 && !loading && (
        <ul className="mt-2 divide-y divide-white/5 rounded-lg border border-white/10">
          {results.length === 0 && <li className="px-3 py-2 text-xs text-slate-500">Sin resultados.</li>}
          {results.map((socio) => (
            <li key={socio.id}>
              <button
                type="button"
                onClick={() => onPick(socio)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-white/5"
              >
                <span className="text-slate-200">{socio.nombreCompleto}</span>
                <span className="font-mono text-xs text-slate-500">{socio.dni}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  )
}

export default SocioPicker
