import { Play, Pause, RotateCcw } from 'lucide-react'
import { PHASES, formatClock } from '../hooks/usePomodoro'

export default function PomodoroPanel({ pomodoro }) {
  const { phase, running, remaining, completed, start, pause, reset, switchPhase } = pomodoro

  return (
    <div className="w-56">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text">Pomodoro</h3>
        {completed > 0 && (
          <span className="text-[11px] text-muted">{completed} ciclo{completed > 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="flex bg-bg border border-border rounded-lg p-0.5 mb-3">
        {Object.entries(PHASES).map(([id, { label }]) => (
          <button
            key={id}
            onClick={() => switchPhase(id)}
            className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
              phase === id ? 'bg-accent text-bg font-medium' : 'text-muted hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-4xl font-light text-text text-center tabular-nums mb-3">
        {formatClock(remaining)}
      </p>

      <div className="flex gap-2">
        <button
          onClick={running ? pause : start}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent rounded-lg text-bg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? 'Pausar' : 'Iniciar'}
        </button>
        <button
          onClick={reset}
          className="px-3 py-2 bg-bg border border-border rounded-lg text-muted hover:text-text transition-colors"
          aria-label="Reiniciar"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  )
}
