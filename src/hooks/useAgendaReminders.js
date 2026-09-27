import { useEffect } from 'react'
import useStore from '../store/useStore'
import { notify } from '../utils/audio'
import { minutesNow, timeToMinutes } from '../utils/agenda'

// Dispara lembretes dos itens da agenda com horário. `notified` fica gravado
// no item, então recarregar a página não repete um aviso já dado.
export function useAgendaReminders() {
  const agenda = useStore((state) => state.agenda)
  const enabled = useStore((state) => state.widgets.agenda)
  const markAgendaNotified = useStore((state) => state.markAgendaNotified)
  const setToast = useStore((state) => state.setToast)

  useEffect(() => {
    if (!enabled) return

    const check = () => {
      const now = minutesNow()
      // Lê do store, não do closure — um aviso já marcado não pode repetir.
      const due = useStore.getState().agenda.items.filter(
        (item) => item.time && !item.done && !item.notified && timeToMinutes(item.time) <= now,
      )
      if (due.length === 0) return

      due.forEach((item) => notify(`${item.time} · ${item.text}`))
      setToast({
        message: due.length === 1
          ? `⏰ ${due[0].time} · ${due[0].text}`
          : `⏰ ${due.length} lembretes da agenda`,
      })
      markAgendaNotified(due.map((item) => item.id))
    }

    check()
    // Resolução de minuto é suficiente; 15s mantém o atraso máximo pequeno.
    const id = setInterval(check, 15000)
    return () => clearInterval(id)
  }, [agenda, enabled, markAgendaNotified, setToast])
}
