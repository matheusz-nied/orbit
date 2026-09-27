import { useState } from 'react'
import { X } from 'lucide-react'
import useStore from '../store/useStore'
import { formatCountdown, formatDuration, parseTimer } from '../utils/commands'
import { requestNotificationPermission } from '../utils/audio'

const PRESETS = [1, 5, 10, 15, 30]

export default function TimersPanel({ timers, now }) {
  const addTimer = useStore((state) => state.addTimer)
  const removeTimer = useStore((state) => state.removeTimer)
  const [draft, setDraft] = useState('')

  const parsed = draft.trim() ? parseTimer(/^\d+$/.test(draft.trim()) ? `${draft.trim()}m` : draft) : null

  const start = (ms, label = '') => {
    requestNotificationPermission()
    addTimer(ms, label)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!parsed) return
    start(parsed.ms, parsed.label)
    setDraft('')
  }

  const sorted = [...timers].sort((a, b) => a.endsAt - b.endsAt)

  return (
    <div className="w-64">
      <h3 className="text-sm font-medium text-text mb-3 pr-6">Timers</h3>

      {sorted.length > 0 && (
        <ul className="space-y-2 mb-3">
          {sorted.map((timer) => {
            const left = timer.endsAt - now
            const progress = Math.min(1, Math.max(0, 1 - left / timer.duration))
            return (
              <li key={timer.id} className="px-3 py-2 bg-bg border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-light text-text tabular-nums">{formatCountdown(left)}</span>
                  <span className="flex-1 min-w-0 truncate text-xs text-muted">
                    {timer.label || formatDuration(timer.duration)}
                  </span>
                  <button
                    onClick={() => removeTimer(timer.id)}
                    className="p-1 text-muted hover:text-red-400 transition-colors"
                    aria-label="Cancelar timer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="h-1 mt-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full origin-left"
                    style={{ transform: `scaleX(${progress})` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex gap-1.5 mb-2">
        {PRESETS.map((min) => (
          <button
            key={min}
            onClick={() => start(min * 60000)}
            className="flex-1 py-1.5 bg-bg border border-border rounded-lg text-xs text-muted hover:text-text hover:border-accent transition-colors"
          >
            {min}m
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ex.: 12m chá, 1h30"
          maxLength={60}
          className="flex-1 min-w-0 px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text placeholder-muted focus:border-accent transition-colors"
        />
        <button
          type="submit"
          disabled={!parsed}
          className="px-3 py-2 bg-accent rounded-lg text-bg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          +
        </button>
      </form>

      <p className="text-[10px] text-muted mt-2">
        Sobrevivem a recarregar a página · também dá para criar com <kbd className="px-1 bg-border rounded">Ctrl K</kbd>
      </p>
    </div>
  )
}
