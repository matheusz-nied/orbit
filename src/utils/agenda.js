import { storage } from './storage'

/** Chave do dia local (YYYY-MM-DD) — base do rollover e do histórico. */
export const dayKey = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const todayKey = () => dayKey(new Date())

export const emptyAgenda = () => ({
  date: todayKey(),
  items: [],
})

/** Itens concluídos somem; pendentes carregam para o dia atual. */
export const rolloverAgenda = (agenda) => {
  const today = todayKey()
  if (!agenda || typeof agenda !== 'object') return emptyAgenda()
  if (agenda.date === today) return agenda

  // O horário era um lembrete daquele dia — carregado para hoje, viraria um
  // alarme fora de hora.
  const items = Array.isArray(agenda.items)
    ? agenda.items
      .filter((item) => item && !item.done)
      .map(({ time: _time, notified: _notified, ...item }) => item)
    : []

  return { date: today, items }
}

export const loadAgenda = () => rolloverAgenda(storage.get('agenda'))

const toTime = (h, m = '0') => {
  const hours = Number(h)
  const minutes = Number(m || 0)
  if (hours > 23 || minutes > 59) return null
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

// Aceita "14:30 reunião", "9h café", "reunião às 14h30", "ligar 16:00".
// Exige `h` ou `:` para não confundir com números comuns ("comprar 2 pães").
const LEADING_TIME = /^(\d{1,2})(?::(\d{2})|h(\d{2})?)\s+(.+)$/i
const TRAILING_TIME = /^(.+?)\s+((?:às|as|a)\s+)?(\d{1,2})(?::(\d{2})|h(\d{2})?)$/i

export const parseAgendaInput = (input) => {
  const text = input.trim()

  const leading = text.match(LEADING_TIME)
  if (leading) {
    const time = toTime(leading[1], leading[2] || leading[3])
    if (time) return { text: leading[4].trim(), time }
  }

  const trailing = text.match(TRAILING_TIME)
  if (trailing) {
    const [, rest, at, hours, colonMinutes, hMinutes] = trailing
    // "estudar 3h" é duração, não horário: sem "às" nem ":", só aceita horas
    // de um dia comum (6h–23h).
    const bareHour = !at && !colonMinutes && !hMinutes && Number(hours) < 6
    const time = bareHour ? null : toTime(hours, colonMinutes || hMinutes)
    if (time) return { text: rest.trim(), time }
  }

  return { text, time: null }
}

/** Minutos desde a meia-noite — comparável com `timeToMinutes(item.time)`. */
export const minutesNow = (date = new Date()) => date.getHours() * 60 + date.getMinutes()

export const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
