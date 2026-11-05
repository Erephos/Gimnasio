import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '../services/api.js'

// Carga datos al montar (o cuando cambian las dependencias) y permite recargar.
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  const requestId = useRef(0)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  const run = useCallback(async () => {
    const current = ++requestId.current
    setState((previous) => ({ ...previous, loading: true, error: '' }))
    try {
      const data = await loaderRef.current()
      if (current === requestId.current) setState({ data, error: '', loading: false })
    } catch (error) {
      if (current === requestId.current) {
        setState((previous) => ({ ...previous, error: errorMessage(error), loading: false }))
      }
    }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run() }, [run, ...deps])

  return { ...state, reload: run }
}
