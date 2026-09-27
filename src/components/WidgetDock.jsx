import { useEffect } from 'react'
import { StickyNote, Timer, ListTodo, X, Headphones, BarChart3, Hourglass } from 'lucide-react'
import useStore from '../store/useStore'
import NotesPanel from './NotesPanel'
import PomodoroPanel from './PomodoroPanel'
import AgendaPanel from './AgendaPanel'
import AmbientPanel from './AmbientPanel'
import TimersPanel from './TimersPanel'
import SummaryPanel from './SummaryPanel'
import { usePomodoro, formatClock } from '../hooks/usePomodoro'
import { useTimers } from '../hooks/useTimers'
import { useAgendaReminders } from '../hooks/useAgendaReminders'
import { useTabStatus } from '../hooks/useTabStatus'
import { formatCountdown } from '../utils/commands'
import { weekKey } from '../utils/activity'

// Evento para a paleta de comandos controlar o Pomodoro, cujo estado vive
// aqui (e não no store) para o timer sobreviver ao fechamento do painel.
export const POMODORO_EVENT = 'orbit:pomodoro'

export default function WidgetDock() {
  const widgets = useStore((state) => state.widgets)
  const notes = useStore((state) => state.notes)
  const agenda = useStore((state) => state.agenda)
  const dockPanel = useStore((state) => state.dockPanel)
  const setDockPanel = useStore((state) => state.setDockPanel)
  const ensureAgendaDay = useStore((state) => state.ensureAgendaDay)
  const ambientPlaying = useStore((state) => state.ambientPlaying)
  const summarySeenWeek = useStore((state) => state.summarySeenWeek)
  const hasActivity = useStore((state) => Object.keys(state.activity).length > 0)

  const pomodoro = usePomodoro()
  const { timers, now } = useTimers()
  useAgendaReminders()
  useTabStatus({ pomodoro, timers, now })

  useEffect(() => {
    const onPomodoro = (e) => {
      if (e.detail === 'start' && !pomodoro.running) pomodoro.start()
      if (e.detail === 'pause' && pomodoro.running) pomodoro.pause()
    }
    window.addEventListener(POMODORO_EVENT, onPomodoro)
    return () => window.removeEventListener(POMODORO_EVENT, onPomodoro)
  }, [pomodoro])

  useEffect(() => {
    ensureAgendaDay()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') ensureAgendaDay()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [ensureAgendaDay])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setDockPanel(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setDockPanel])

  // O último timer terminou com o painel aberto — não deixa um painel vazio.
  useEffect(() => {
    if (dockPanel === 'timers' && timers.length === 0 && !widgets.pomodoro) setDockPanel(null)
  }, [dockPanel, timers.length, widgets.pomodoro, setDockPanel])

  const agendaPending = agenda.items.filter((item) => !item.done).length
  const nextTimer = timers.length > 0 ? Math.min(...timers.map((t) => t.endsAt)) : null
  // Ponto no Resumo quando começa uma semana nova e ainda não foi visto.
  const summaryIsNew = hasActivity && summarySeenWeek !== weekKey()

  const available = [
    widgets.agenda && {
      id: 'agenda',
      icon: ListTodo,
      label: 'Agenda',
      badge: agendaPending > 0 ? String(agendaPending) : null,
    },
    widgets.notes && {
      id: 'notes',
      icon: StickyNote,
      label: 'Notas',
      badge: notes.trim() ? '•' : null,
    },
    widgets.pomodoro && {
      id: 'pomodoro',
      icon: Timer,
      label: 'Pomodoro',
      badge: pomodoro.running ? formatClock(pomodoro.remaining) : null,
    },
    // Timers aparecem com o widget de foco ligado ou sempre que houver um rodando.
    (widgets.pomodoro || timers.length > 0) && {
      id: 'timers',
      icon: Hourglass,
      label: 'Timers',
      badge: nextTimer ? formatCountdown(nextTimer - now) : null,
    },
    widgets.ambient && {
      id: 'ambient',
      icon: Headphones,
      label: 'Som ambiente',
      badge: ambientPlaying ? '♪' : null,
    },
    widgets.summary && {
      id: 'summary',
      icon: BarChart3,
      label: 'Resumo da semana',
      badge: summaryIsNew ? '•' : null,
    },
  ].filter(Boolean)

  if (available.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 print:hidden max-w-[calc(100vw-2rem)]">
      {dockPanel && (
        <div className="relative bg-card border border-border rounded-2xl p-4 shadow-xl animate-slideIn">
          <button
            onClick={() => setDockPanel(null)}
            className="absolute top-3 right-3 text-muted hover:text-text transition-colors"
            aria-label="Fechar painel"
          >
            <X size={16} />
          </button>

          {dockPanel === 'notes' && <NotesPanel />}
          {dockPanel === 'pomodoro' && <PomodoroPanel pomodoro={pomodoro} />}
          {dockPanel === 'agenda' && <AgendaPanel />}
          {dockPanel === 'timers' && <TimersPanel timers={timers} now={now} />}
          {dockPanel === 'ambient' && <AmbientPanel />}
          {dockPanel === 'summary' && <SummaryPanel />}
        </div>
      )}

      <div className="flex flex-wrap justify-end items-center gap-2">
        {available.map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => setDockPanel(dockPanel === id ? null : id)}
            title={label}
            aria-label={label}
            aria-pressed={dockPanel === id}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border shadow-lg transition-colors ${
              dockPanel === id
                ? 'bg-accent text-bg border-accent'
                : 'bg-card text-muted border-border hover:text-accent hover:border-accent'
            }`}
          >
            <Icon size={18} />
            {badge && (
              <span className="text-xs font-medium tabular-nums">{badge}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
