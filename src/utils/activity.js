import { storage } from './storage'
import { dayKey, todayKey } from './agenda'

// Histórico diário de uso — base do resumo semanal.
// { 'YYYY-MM-DD': { focus: minutos, tasks: concluídas, visits: aberturas, sites: { [id]: n } } }
const KEEP_DAYS = 60

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export const emptyDay = () => ({ focus: 0, tasks: 0, visits: 0, sites: {} })

export const loadActivity = () => {
  const saved = storage.get('activity')
  return isPlainObject(saved) ? saved : {}
}

const daysAgo = (n, from = new Date()) => {
  const d = new Date(from)
  d.setDate(d.getDate() - n)
  return d
}

// Chaves YYYY-MM-DD ordenam lexicograficamente como datas.
const prune = (activity) => {
  const cutoff = dayKey(daysAgo(KEEP_DAYS))
  return Object.fromEntries(Object.entries(activity).filter(([key]) => key >= cutoff))
}

/** Aplica `update(dia)` ao dia de hoje e devolve o histórico novo (já podado). */
export const bumpToday = (activity, update) => {
  const key = todayKey()
  const current = { ...emptyDay(), ...(activity[key] || {}) }
  return prune({ ...activity, [key]: update(current) })
}

const sumDays = (days) =>
  days.reduce(
    (acc, day) => ({
      focus: acc.focus + day.focus,
      tasks: acc.tasks + day.tasks,
      visits: acc.visits + day.visits,
    }),
    { focus: 0, tasks: 0, visits: 0 },
  )

/** Últimos 7 dias (hoje incluso) e os 7 anteriores, para comparação. */
export const summarizeWeek = (activity, sites, now = new Date()) => {
  const pick = (offset) => {
    const date = daysAgo(offset, now)
    return { key: dayKey(date), date, ...emptyDay(), ...(activity[dayKey(date)] || {}) }
  }

  const days = [6, 5, 4, 3, 2, 1, 0].map(pick)
  const previous = [13, 12, 11, 10, 9, 8, 7].map(pick)

  const siteCounts = {}
  days.forEach((day) => {
    Object.entries(day.sites || {}).forEach(([id, count]) => {
      siteCounts[id] = (siteCounts[id] || 0) + count
    })
  })

  const topSites = Object.entries(siteCounts)
    .map(([id, count]) => ({ site: sites.find((s) => s.id === id), count }))
    .filter((entry) => entry.site)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  const activeDays = days.filter((d) => d.focus || d.tasks || d.visits).length

  return {
    days,
    totals: sumDays(days),
    previousTotals: sumDays(previous),
    topSites,
    activeDays,
  }
}

/** Segunda-feira da semana de `date` — identifica "semana nova" para o aviso do resumo. */
export const weekKey = (date = new Date()) => {
  const d = new Date(date)
  const offset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - offset)
  return dayKey(d)
}

export const formatMinutes = (minutes) => {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}min` : `${h}h`
}
