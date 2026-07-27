import { useEffect } from 'react'
import { StickyNote, Timer, ListTodo, X } from 'lucide-react'
import useStore from '../store/useStore'
import NotesPanel from './NotesPanel'
import PomodoroPanel from './PomodoroPanel'
import AgendaPanel from './AgendaPanel'
import { usePomodoro, formatClock } from '../hooks/usePomodoro'

export default function WidgetDock() {
  const widgets = useStore((state) => state.widgets)
  const notes = useStore((state) => state.notes)
  const agenda = useStore((state) => state.agenda)
  const dockPanel = useStore((state) => state.dockPanel)
  const setDockPanel = useStore((state) => state.setDockPanel)
  const ensureAgendaDay = useStore((state) => state.ensureAgendaDay)

  const pomodoro = usePomodoro()

  useEffect(() => {
    if (!pomodoro.running) {
      document.title = 'Orbit'
      return
    }
    document.title = `${formatClock(pomodoro.remaining)} · Orbit`
    return () => { document.title = 'Orbit' }
  }, [pomodoro.running, pomodoro.remaining])

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

  const agendaPending = agenda.items.filter((item) => !item.done).length

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
  ].filter(Boolean)

  if (available.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 print:hidden">
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
        </div>
      )}

      <div className="flex items-center gap-2">
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
