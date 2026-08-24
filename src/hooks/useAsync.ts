import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/services/api'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  /** Safe, user-facing message. Raw errors never reach the UI. */
  error: string | null
}

/**
 * Loads data from a service, with cancellation on unmount and a `reload()` for
 * retry buttons on error states.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })
  const loaderRef = useRef(loader)
  loaderRef.current = loader
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let active = true
    setState((prev) => ({ ...prev, loading: true, error: null }))
    loaderRef
      .current()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (!active) return
        const message =
          error instanceof ApiError ? error.userMessage : 'We couldn’t load this just now. Please try again.'
        setState({ data: null, loading: false, error: message })
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  const setData = useCallback((data: T) => setState({ data, loading: false, error: null }), [])

  return { ...state, reload, setData }
}
