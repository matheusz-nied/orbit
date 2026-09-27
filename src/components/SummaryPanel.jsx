import { useEffect, useMemo, useState } from 'react'
import useStore from '../store/useStore'
import { summarizeWeek, formatMinutes } from '../utils/activity'
import SiteIcon from './SiteIcon'

const metrics = [
  { id: 'focus', label: 'Foco', format: (v) => formatMinutes(v) },
  { id: 'tasks', label: 'Tarefas', format: (v) => `${v} ${v === 1 ? 'concluída' : 'concluídas'}` },
  { id: 'visits', label: 'Sites', format: (v) => `${v} ${v === 1 ? 'abertura' : 'aberturas'}` },
]

const weekday = (date) =>
  date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')

// "quinta-feira, 24 de set." → "Quinta-feira, 24 de set." (o `capitalize` do
// CSS maiusculava cada palavra).
const fullDate = (date) => {
  const text = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Comparação com a semana anterior em texto — sem verde/vermelho: menos foco
// numa semana não é "erro", e cor sozinha não carrega significado.
const Delta = ({ current, previous }) => {
  if (!previous && !current) return null
  if (!previous) return <span className="text-[10px] text-muted">novo</span>
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return <span className="text-[10px] text-muted">= anterior</span>
  return (
    <span className="text-[10px] text-muted tabular-nums">
      {pct > 0 ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  )
}

export default function SummaryPanel() {
  const activity = useStore((state) => state.activity)
  const sites = useStore((state) => state.sites)
  const markSummarySeen = useStore((state) => state.markSummarySeen)
  const [metric, setMetric] = useState('focus')
  const [hovered, setHovered] = useState(null)

  useEffect(() => { markSummarySeen() }, [markSummarySeen])

  const week = useMemo(() => summarizeWeek(activity, sites), [activity, sites])
  const current = metrics.find((m) => m.id === metric)
  const max = Math.max(1, ...week.days.map((d) => d[metric]))
  const empty = week.activeDays === 0

  const tiles = [
    { id: 'focus', label: 'Foco', value: formatMinutes(week.totals.focus) },
    { id: 'tasks', label: 'Tarefas', value: week.totals.tasks },
    { id: 'visits', label: 'Sites abertos', value: week.totals.visits },
  ]

  return (
    <div className="w-72 sm:w-80">
      <div className="flex items-baseline justify-between gap-2 mb-3 pr-6">
        <h3 className="text-sm font-medium text-text">Sua semana</h3>
        <span className="text-[11px] text-muted">últimos 7 dias</span>
      </div>

      {empty ? (
        <p className="text-xs text-muted py-6 text-center">
          Ainda sem dados. Conclua tarefas, rode um Pomodoro e abra seus sites — o resumo se monta sozinho.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {tiles.map((tile) => (
              <div key={tile.id} className="px-2.5 py-2 bg-bg border border-border rounded-lg">
                <p className="text-[10px] text-muted uppercase tracking-wide">{tile.label}</p>
                <p className="text-base font-medium text-text tabular-nums leading-tight mt-0.5">{tile.value}</p>
                <Delta current={week.totals[tile.id]} previous={week.previousTotals[tile.id]} />
              </div>
            ))}
          </div>

          <div className="flex bg-bg border border-border rounded-lg p-0.5 mb-3" role="tablist" aria-label="Métrica do gráfico">
            {metrics.map(({ id, label }) => (
              <button
                key={id}
                role="tab"
                aria-selected={metric === id}
                onClick={() => setMetric(id)}
                className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                  metric === id ? 'bg-accent text-bg font-medium' : 'text-muted hover:text-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative mb-4" onMouseLeave={() => setHovered(null)}>
            {/* Tooltip do dia sob o cursor */}
            <p className="h-4 mb-1 text-[11px] text-text text-center tabular-nums" aria-live="polite">
              {hovered != null && (
                <>
                  <span className="text-muted">{fullDate(week.days[hovered].date)}</span>
                  {' · '}
                  {current.format(week.days[hovered][metric])}
                </>
              )}
            </p>

            <div className="flex items-end gap-1.5 h-20 border-b border-border" aria-hidden>
              {week.days.map((day, i) => {
                const value = day[metric]
                const pct = (value / max) * 100
                return (
                  <button
                    key={day.key}
                    type="button"
                    tabIndex={-1}
                    onMouseEnter={() => setHovered(i)}
                    onFocus={() => setHovered(i)}
                    className="flex-1 h-full flex items-end cursor-default"
                  >
                    <span
                      className="w-full rounded-t transition-opacity"
                      style={{
                        height: value ? `${Math.max(pct, 4)}%` : '2px',
                        background: value ? 'var(--accent)' : 'var(--border)',
                        opacity: hovered == null || hovered === i ? 1 : 0.45,
                      }}
                    />
                  </button>
                )
              })}
            </div>

            <div className="flex gap-1.5 mt-1" aria-hidden>
              {week.days.map((day, i) => (
                <span
                  key={day.key}
                  className={`flex-1 text-center text-[10px] capitalize ${i === 6 ? 'text-text font-medium' : 'text-muted'}`}
                >
                  {i === 6 ? 'hoje' : weekday(day.date)}
                </span>
              ))}
            </div>

            {/* Versão em tabela para leitores de tela */}
            <table className="sr-only">
              <caption>{current.label} por dia, últimos 7 dias</caption>
              <tbody>
                {week.days.map((day) => (
                  <tr key={day.key}>
                    <th scope="row">{fullDate(day.date)}</th>
                    <td>{current.format(day[metric])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {week.topSites.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-muted uppercase tracking-wide mb-1.5">Mais abertos</p>
              <ul className="space-y-1">
                {week.topSites.map(({ site, count }) => (
                  <li key={site.id} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 shrink-0 flex items-center justify-center">
                      <SiteIcon
                        name={site.name}
                        url={site.url}
                        alt=""
                        imgClassName="w-4 h-4 rounded-sm"
                        fallbackClassName="w-4 h-4 rounded-sm bg-border text-[9px] text-text"
                      />
                    </span>
                    <span className="flex-1 min-w-0 truncate text-text">{site.name}</span>
                    <span className="text-xs text-muted tabular-nums">{count}×</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-muted">
            Ativo em {week.activeDays} de 7 dias · os dados ficam só neste navegador
          </p>
        </>
      )}
    </div>
  )
}
