import { useEffect, useMemo, useRef, useState } from 'react'
import useStore from '../store/useStore'
import { formatClock, PHASES } from './usePomodoro'
import { formatCountdown } from '../utils/commands'
import { minutesNow, timeToMinutes } from '../utils/agenda'

const BASE_TITLE = 'Orbit'
const DEFAULT_ICON = '/favicon.svg'
const REMINDER_WINDOW_MIN = 60

const getIconLink = () => {
  let link = document.querySelector('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  return link
}

const readAccent = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6366f1'

// Favicon com anel de progresso — numa aba fixada é a única coisa visível,
// então o anel mostra quanto falta sem precisar abrir a aba.
const drawProgressIcon = (progress, accent) => {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const center = size / 2

  ctx.lineWidth = 8
  ctx.strokeStyle = 'rgba(128, 128, 128, 0.35)'
  ctx.beginPath()
  ctx.arc(center, center, 26, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = accent
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(center, center, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress)
  ctx.stroke()

  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.arc(center, center, 12, 0, Math.PI * 2)
  ctx.fill()

  return canvas.toDataURL('image/png')
}

/**
 * Título e favicon refletem o que está acontecendo, em ordem de prioridade:
 * pomodoro → timer → lembrete próximo → tarefas pendentes → "Orbit".
 */
export function useTabStatus({ pomodoro, timers, now }) {
  const enabled = useStore((state) => state.widgets.tabStatus)
  const agenda = useStore((state) => state.agenda)
  const agendaEnabled = useStore((state) => state.widgets.agenda)
  const theme = useStore((state) => state.theme)
  const lastIcon = useRef(null)

  // Sem timers rodando, `now` fica parado — este relógio lento mantém a
  // janela de "lembrete próximo" atualizada.
  const [minuteTick, setMinuteTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setMinuteTick((n) => n + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const status = useMemo(() => {
    if (!enabled) return { title: BASE_TITLE, progress: null }

    if (pomodoro.running) {
      const total = PHASES[pomodoro.phase].minutes * 60 * 1000
      const emoji = pomodoro.phase === 'focus' ? '🍅' : '☕'
      return {
        title: `${emoji} ${formatClock(pomodoro.remaining)} · ${BASE_TITLE}`,
        progress: 1 - pomodoro.remaining / total,
      }
    }

    const nextTimer = [...timers].sort((a, b) => a.endsAt - b.endsAt)[0]
    if (nextTimer) {
      const left = nextTimer.endsAt - now
      const label = nextTimer.label ? ` ${nextTimer.label}` : ''
      return {
        title: `⏱ ${formatCountdown(left)}${label} · ${BASE_TITLE}`,
        progress: 1 - left / nextTimer.duration,
      }
    }

    if (agendaEnabled) {
      const current = minutesNow()
      const upcoming = agenda.items
        .filter((item) => item.time && !item.done && !item.notified)
        .map((item) => ({ item, minutes: timeToMinutes(item.time) }))
        .filter(({ minutes }) => minutes >= current && minutes - current <= REMINDER_WINDOW_MIN)
        .sort((a, b) => a.minutes - b.minutes)[0]

      if (upcoming) {
        return { title: `⏰ ${upcoming.item.time} ${upcoming.item.text} · ${BASE_TITLE}`, progress: null }
      }

      const pending = agenda.items.filter((item) => !item.done).length
      if (pending > 0) return { title: `(${pending}) ${BASE_TITLE}`, progress: null }
    }

    return { title: BASE_TITLE, progress: null }
    // `now` e `minuteTick` só servem para recalcular — o valor vem do relógio.
  }, [enabled, pomodoro.running, pomodoro.phase, pomodoro.remaining, timers, now, minuteTick, agenda, agendaEnabled])

  useEffect(() => {
    document.title = status.title
  }, [status.title])

  // Arredonda o progresso para não regerar o PNG a cada meio segundo.
  const step = status.progress == null ? null : Math.round(Math.min(1, Math.max(0, status.progress)) * 60)

  useEffect(() => {
    const key = step == null ? DEFAULT_ICON : `${step}:${theme}`
    if (lastIcon.current === key) return
    lastIcon.current = key

    const link = getIconLink()
    if (step == null) {
      link.type = 'image/svg+xml'
      link.href = DEFAULT_ICON
      return
    }
    link.type = 'image/png'
    link.href = drawProgressIcon(step / 60, readAccent())
  }, [step, theme])

  useEffect(() => () => {
    document.title = BASE_TITLE
    const link = getIconLink()
    link.type = 'image/svg+xml'
    link.href = DEFAULT_ICON
  }, [])
}
