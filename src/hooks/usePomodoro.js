import { useState, useEffect, useRef, useCallback } from 'react'

export const PHASES = {
  focus: { label: 'Foco', minutes: 25 },
  break: { label: 'Pausa', minutes: 5 },
}

export const formatClock = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = String(Math.floor(total / 60)).padStart(2, '0')
  const seconds = String(total % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

// O tempo restante é sempre derivado de um timestamp de término, nunca de um
// contador decrementado a cada tick. Navegadores limitam timers em abas de
// segundo plano, então um contador atrasaria minutos numa sessão longa.
export function usePomodoro() {
  const [phase, setPhase] = useState('focus')
  const [endsAt, setEndsAt] = useState(null)
  const [remaining, setRemaining] = useState(PHASES.focus.minutes * 60 * 1000)
  const [completed, setCompleted] = useState(0)

  const running = endsAt !== null
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const notify = useCallback((finishedPhase) => {
    const message = finishedPhase === 'focus'
      ? 'Ciclo de foco concluído — hora da pausa.'
      : 'Pausa encerrada — de volta ao foco.'

    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Orbit', { body: message })
      }
    } catch {
      // Notificação é um extra: se o navegador recusar, o timer segue normal.
    }
  }, [])

  useEffect(() => {
    if (!running) return

    const tick = () => {
      const left = endsAt - Date.now()

      if (left <= 0) {
        const finished = phaseRef.current
        const next = finished === 'focus' ? 'break' : 'focus'

        setPhase(next)
        setEndsAt(null)
        setRemaining(PHASES[next].minutes * 60 * 1000)
        if (finished === 'focus') setCompleted((c) => c + 1)
        notify(finished)
        return
      }

      setRemaining(left)
    }

    tick()
    const interval = setInterval(tick, 500)
    return () => clearInterval(interval)
  }, [running, endsAt, notify])

  const start = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
    setEndsAt(Date.now() + remaining)
  }, [remaining])

  const pause = useCallback(() => {
    setRemaining(Math.max(0, endsAt - Date.now()))
    setEndsAt(null)
  }, [endsAt])

  const reset = useCallback(() => {
    setEndsAt(null)
    setRemaining(PHASES[phaseRef.current].minutes * 60 * 1000)
  }, [])

  const switchPhase = useCallback((next) => {
    setPhase(next)
    setEndsAt(null)
    setRemaining(PHASES[next].minutes * 60 * 1000)
  }, [])

  return { phase, running, remaining, completed, start, pause, reset, switchPhase }
}
