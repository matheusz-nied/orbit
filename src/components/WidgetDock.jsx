import { useState, useEffect } from 'react'
import { StickyNote, Timer, X } from 'lucide-react'
import useStore from '../store/useStore'
import NotesPanel from './NotesPanel'
import PomodoroPanel from './PomodoroPanel'
import { usePomodoro, formatClock } from '../hooks/usePomodoro'

export default function WidgetDock() {
  const widgets = useStore((state) => state.widgets)
  const notes = useStore((state) => state.notes)
  const [openPanel, setOpenPanel] = useState(null)

  // O pomodoro vive aqui, não dentro do painel: fechar o painel não pode
  // desmontar o timer e perder a contagem.
  const pomodoro = usePomodoro()

  // Espelha o tempo no título da aba para acompanhar sem voltar para o Orbit.
  useEffect(() => {
    if (!pomodoro.running) {
      document.title = 'Orbit'
      return
    }
    document.title = `${formatClock(pomodoro.remaining)} · Orbit`
    return () => { document.title = 'Orbit' }
  }, [pomodoro.running, pomodoro.remaining])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpenPanel(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const available = [
    widgets.notes && {
      id: 'notes',
      icon: StickyNote,
      label: 'Notas',
      // Um ponto discreto indica que existe conteúdo salvo sem abrir o painel.
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
      {openPanel && (
        <div className="relative bg-card border border-border rounded-2xl p-4 shadow-xl animate-slideIn">
          <button
            onClick={() => setOpenPanel(null)}
            className="absolute top-3 right-3 text-muted hover:text-text transition-colors"
            aria-label="Fechar painel"
          >
            <X size={16} />
          </button>

          {openPanel === 'notes' && <NotesPanel />}
          {openPanel === 'pomodoro' && <PomodoroPanel pomodoro={pomodoro} />}
        </div>
      )}

      <div className="flex items-center gap-2">
        {available.map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => setOpenPanel((current) => (current === id ? null : id))}
            title={label}
            aria-label={label}
            aria-pressed={openPanel === id}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border shadow-lg transition-colors ${
              openPanel === id
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
