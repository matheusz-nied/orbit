import { storage } from './storage'

/** Chave do dia local (YYYY-MM-DD) para rollover da agenda. */
export const todayKey = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const emptyAgenda = () => ({
  date: todayKey(),
  items: [],
})

/** Itens concluídos somem; pendentes carregam para o dia atual. */
export const rolloverAgenda = (agenda) => {
  const today = todayKey()
  if (!agenda || typeof agenda !== 'object') return emptyAgenda()
  if (agenda.date === today) return agenda

  const items = Array.isArray(agenda.items)
    ? agenda.items.filter((item) => item && !item.done)
    : []

  return { date: today, items }
}

export const loadAgenda = () => rolloverAgenda(storage.get('agenda'))
