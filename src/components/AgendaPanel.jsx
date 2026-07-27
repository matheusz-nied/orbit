import { useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { todayKey } from '../utils/agenda'

const formatAgendaDate = (dateKey) => {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function AgendaPanel() {
  const agenda = useStore((state) => state.agenda)
  const addAgendaItem = useStore((state) => state.addAgendaItem)
  const toggleAgendaItem = useStore((state) => state.toggleAgendaItem)
  const removeAgendaItem = useStore((state) => state.removeAgendaItem)

  const [draft, setDraft] = useState('')

  const pendingCount = agenda.items.filter((item) => !item.done).length
  const dateLabel = formatAgendaDate(agenda.date || todayKey())

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!draft.trim()) return
    addAgendaItem(draft)
    setDraft('')
  }

  return (
    <div className="w-72 sm:w-80">
      <div className="flex items-start justify-between gap-2 mb-1 pr-6">
        <div>
          <h3 className="text-sm font-medium text-text">Agenda do dia</h3>
          <p className="text-[11px] text-muted capitalize mt-0.5">{dateLabel}</p>
        </div>
        <span className="text-[11px] text-muted tabular-nums shrink-0">
          {pendingCount} {pendingCount === 1 ? 'pendente' : 'pendentes'}
        </span>
      </div>

      <ul className="space-y-1.5 mb-3 max-h-48 overflow-y-auto">
        {agenda.items.length === 0 ? (
          <li className="text-xs text-muted py-3 text-center">
            Nada para hoje — adicione abaixo
          </li>
        ) : (
          agenda.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 group/item px-1 py-1 rounded-lg hover:bg-bg/60 transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleAgendaItem(item.id)}
                aria-label={item.done ? 'Marcar como pendente' : 'Marcar como concluída'}
                className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  item.done
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'border-border text-transparent hover:border-accent'
                }`}
              >
                {item.done && <Check size={12} strokeWidth={3} />}
              </button>
              <span
                className={`flex-1 text-sm min-w-0 break-words ${
                  item.done ? 'line-through text-muted' : 'text-text'
                }`}
              >
                {item.text}
              </span>
              <button
                type="button"
                onClick={() => removeAgendaItem(item.id)}
                aria-label="Remover item"
                className="shrink-0 p-1 text-muted opacity-0 group-hover/item:opacity-100 hover:text-red-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))
        )}
      </ul>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Adicionar tarefa…"
          maxLength={120}
          className="flex-1 min-w-0 px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text placeholder-muted focus:border-accent transition-colors"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="px-3 py-2 bg-accent rounded-lg text-bg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          +
        </button>
      </form>

      <p className="text-[10px] text-muted mt-2">
        Concluídas somem à meia-noite · pendentes vão para amanhã
      </p>
    </div>
  )
}
