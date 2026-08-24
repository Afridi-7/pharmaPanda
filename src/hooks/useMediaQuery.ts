import { useEffect, useRef, useState } from 'react'

/** Tailwind-aligned breakpoint helper. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)')
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)')
}

/** Elapsed-seconds counter used by the consultation timer. */
export function useElapsedSeconds(running: boolean) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!running) return
    const handle = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(handle)
  }, [running])
  return seconds
}

/** Counts a number up on mount — used for the results score. */
export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0)
  const frame = useRef<number>()

  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      // Ease-out cubic keeps the count from feeling mechanical.
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [target, durationMs])

  return value
}
