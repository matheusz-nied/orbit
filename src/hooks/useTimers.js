import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { notify } from '../utils/audio'
import { formatDuration } from '../utils/commands'

// Relógio compartilhado dos timers avulsos. Como cada timer guarda o
// timestamp de término, um timer que venceu com a aba fechada é avisado
// assim que a página volta.
export function useTimers() {
  const timers = useStore((state) => state.timers)
  const removeTimer = useStore((state) => state.removeTimer)
  const setToast = useStore((state) => state.setToast)
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    if (timers.length === 0) return

    const tick = () => {
      const current = Date.now()
      setNow(current)

      // Lê do store, não do closure: se outro tick (ou o StrictMode) já
      // removeu o timer, ele não pode avisar duas vezes.
      useStore.getState().timers.forEach((timer) => {
        if (timer.endsAt > current) return
        const name = timer.label || `Timer de ${formatDuration(timer.duration)}`
        notify(`${name} terminou.`)
        setToast({ message: `⏱ ${name} terminou` })
        removeTimer(timer.id)
      })
    }

    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [timers, removeTimer, setToast])

  return { timers, now }
}
