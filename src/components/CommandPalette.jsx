import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Command, ListTodo, StickyNote, Hourglass, Calculator, Coins, Search, Globe, Plus,
  Headphones, Square, BarChart3, Database, Settings, Palette, Layers, Timer, CornerDownLeft,
} from 'lucide-react'
import useStore, { searchProviders } from '../store/useStore'
import { themeList } from '../themes/themes'
import { ambientSounds } from '../utils/ambient'
import { openSite, openUrl } from '../utils/navigation'
import { parseAgendaInput } from '../utils/agenda'
import { requestNotificationPermission } from '../utils/audio'
import { backupNow } from '../utils/backup'
import {
  fold, parseTimer, formatDuration, evaluateMath, formatNumber,
  parseCurrency, fetchRate, formatMoney,
} from '../utils/commands'
import { POMODORO_EVENT } from './WidgetDock'
import SiteIcon from './SiteIcon'

// Espelha as seções das Configurações — o modal é lazy e importar dele puxaria
// o chunk inteiro para o bundle principal.
const settingsSections = [
  { id: 'appearance', label: 'Tema e visual' },
  { id: 'widgets', label: 'Widgets' },
  { id: 'news', label: 'Notícias' },
  { id: 'search', label: 'Busca' },
  { id: 'ai', label: 'Chat IA' },
  { id: 'workspaces', label: 'Espaços' },
  { id: 'categories', label: 'Categorias' },
  { id: 'bulk', label: 'Adicionar em lote' },
  { id: 'data', label: 'Backup' },
]

const TASK_PREFIX = /^(?:\+|t |tarefa |todo )\s*(.+)$/i
const NOTE_PREFIX = /^(?:n |nota )\s*(.+)$/i

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

const matches = (haystack, query) => {
  const text = fold(haystack)
  return fold(query).split(/\s+/).filter(Boolean).every((token) => text.includes(token))
}

const EXAMPLES = [
  ['+ reunião 14h', 'tarefa com lembrete'],
  ['n ideia', 'nota rápida'],
  ['10m chá', 'timer'],
  ['2*37', 'calculadora'],
  ['100 usd', 'câmbio'],
]

export default function CommandPalette() {
  const open = useStore((state) => state.paletteOpen)
  const close = useStore((state) => state.closePalette)

  if (!open) return null
  return <PaletteDialog onClose={close} />
}

function PaletteDialog({ onClose }) {
  const sites = useStore((state) => state.sites)
  const siteStats = useStore((state) => state.siteStats)
  const workspaces = useStore((state) => state.workspaces)
  const activeWorkspace = useStore((state) => state.activeWorkspace)
  const widgets = useStore((state) => state.widgets)
  const openInNewTab = useStore((state) => state.openInNewTab)
  const searchProvider = useStore((state) => state.searchProvider)
  const ambientPlaying = useStore((state) => state.ambientPlaying)

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [rate, setRate] = useState({ key: null, status: 'idle', value: null })
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const q = query.trim()
  const currency = useMemo(() => (q ? parseCurrency(q) : null), [q])
  const currencyKey = currency ? `${currency.from}-${currency.to}` : null

  useEffect(() => {
    if (!currencyKey) return
    let cancelled = false
    setRate({ key: currencyKey, status: 'loading', value: null })
    const [from, to] = currencyKey.split('-')
    // Debounce curto: digitar "100 usd em eur" não dispara uma requisição por tecla.
    const timeout = setTimeout(() => {
      fetchRate(from, to)
        .then((value) => { if (!cancelled) setRate({ key: currencyKey, status: 'ok', value }) })
        .catch(() => { if (!cancelled) setRate({ key: currencyKey, status: 'error', value: null }) })
    }, 250)
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [currencyKey])

  const results = useMemo(() => {
    const store = useStore.getState()
    const toast = (message) => store.setToast({ message })
    const items = []

    // — Ações fixas (também servem de sugestões com a busca vazia) —
    const actions = [
      { id: 'add-site', icon: Plus, title: 'Adicionar site', keywords: 'novo site', run: () => store.openAddSite() },
      widgets.agenda && { id: 'agenda', icon: ListTodo, title: 'Abrir agenda', keywords: 'tarefas todo', run: () => store.setDockPanel('agenda') },
      widgets.notes && { id: 'notes', icon: StickyNote, title: 'Abrir notas', keywords: 'anotações', run: () => store.setDockPanel('notes') },
      widgets.pomodoro && {
        id: 'pomodoro', icon: Timer, title: 'Iniciar foco (Pomodoro)', keywords: 'pomodoro foco concentrar',
        run: () => { window.dispatchEvent(new CustomEvent(POMODORO_EVENT, { detail: 'start' })); store.setDockPanel('pomodoro') },
      },
      { id: 'timers', icon: Hourglass, title: 'Abrir timers', keywords: 'cronômetro temporizador', run: () => store.setDockPanel('timers') },
      widgets.summary && { id: 'summary', icon: BarChart3, title: 'Resumo da semana', keywords: 'estatísticas semana', run: () => store.setDockPanel('summary') },
      ambientPlaying && { id: 'ambient-stop', icon: Square, title: 'Parar som ambiente', keywords: 'som parar silêncio', run: () => store.stopAmbient() },
      ...ambientSounds.map((s) => ({
        id: `ambient-${s.id}`, icon: Headphones, title: `Tocar ${s.label.toLowerCase()}`, keywords: 'som ambiente música foco',
        run: () => { store.playAmbient(s.id); store.setDockPanel('ambient') },
      })),
      {
        id: 'backup', icon: Database, title: 'Fazer backup agora', keywords: 'exportar salvar dados',
        run: async () => {
          const result = await backupNow()
          store.markBackup()
          toast(result === 'file' ? 'Backup salvo no arquivo' : 'Backup baixado')
        },
      },
      ...settingsSections.map((s) => ({
        id: `settings-${s.id}`, icon: Settings, title: `Configurações: ${s.label}`, keywords: 'configurações preferências ajustes',
        run: () => store.openSettings(s.id),
      })),
      ...themeList.map((t) => ({
        id: `theme-${t.id}`, icon: Palette, title: `Tema: ${t.name}`, keywords: 'tema visual aparência',
        run: () => { store.setTheme(t.id); toast(`Tema ${t.name}`) },
      })),
      ...(workspaces.length > 1 ? workspaces : []).map((w) => ({
        id: `ws-${w.id}`, icon: Layers, title: `Espaço: ${w.name}`, keywords: 'espaço workspace trocar',
        run: () => store.setActiveWorkspace(w.id),
      })),
    ].filter(Boolean)

    if (!q) {
      const frequent = sites
        .filter((s) => s.workspace === activeWorkspace && siteStats[s.id])
        .sort((a, b) => siteStats[b.id].count - siteStats[a.id].count)
        .slice(0, 4)
      frequent.forEach((site) => items.push(siteItem(site)))
      actions
        .filter((a) => ['add-site', 'agenda', 'pomodoro', 'summary', 'ambient-stop', 'ambient-rain', 'backup'].includes(a.id))
        .forEach((a) => items.push(a))
      return items
    }

    // — Comandos reconhecidos pelo formato do texto —
    const task = q.match(TASK_PREFIX)
    if (task) {
      const { text, time } = parseAgendaInput(task[1])
      items.push({
        id: 'cmd-task', icon: ListTodo, title: `Adicionar à agenda: ${text}`,
        hint: time ? `lembrete ${time}` : 'tarefa',
        run: () => {
          if (time) requestNotificationPermission()
          store.addAgendaItem(task[1])
          toast(time ? `Tarefa adicionada · lembrete às ${time}` : 'Tarefa adicionada à agenda')
        },
      })
    }

    const note = q.match(NOTE_PREFIX)
    if (note) {
      items.push({
        id: 'cmd-note', icon: StickyNote, title: `Adicionar às notas: ${note[1]}`, hint: 'nota',
        run: () => {
          const current = useStore.getState().notes.replace(/\s+$/, '')
          store.setNotes(current ? `${current}\n${note[1]}` : note[1])
          toast('Anotado')
        },
      })
    }

    const timer = parseTimer(q)
    if (timer) {
      const name = timer.label ? `${formatDuration(timer.ms)} · ${timer.label}` : formatDuration(timer.ms)
      items.push({
        id: 'cmd-timer', icon: Hourglass, title: `Iniciar timer de ${name}`, hint: 'timer',
        run: () => {
          requestNotificationPermission()
          store.addTimer(timer.ms, timer.label)
          toast(`Timer de ${formatDuration(timer.ms)} iniciado`)
        },
      })
    }

    const math = evaluateMath(q)
    if (math !== null) {
      const value = formatNumber(math)
      items.push({
        id: 'cmd-math', icon: Calculator, title: `= ${value}`, hint: 'Enter copia',
        run: async () => toast((await copy(String(math))) ? `${value} copiado` : value),
      })
    }

    if (currency) {
      const ready = rate.key === currencyKey && rate.status === 'ok'
      const converted = ready ? formatMoney(currency.amount * rate.value, currency.to) : null
      items.push({
        id: 'cmd-currency', icon: Coins,
        title: ready
          ? `${formatMoney(currency.amount, currency.from)} = ${converted}`
          : rate.status === 'error' && rate.key === currencyKey
            ? 'Cotação indisponível agora'
            : `Buscando cotação ${currency.from} → ${currency.to}…`,
        hint: ready ? 'Enter copia' : 'câmbio',
        run: ready ? async () => toast((await copy(converted)) ? `${converted} copiado` : converted) : null,
      })
    }

    // — Sites —
    const foldedQ = fold(q)
    sites
      .map((site) => {
        const name = fold(site.name)
        const score = name.startsWith(foldedQ) ? 3 : name.includes(foldedQ) ? 2 : fold(site.url).includes(foldedQ) ? 1 : 0
        return { site, score }
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) =>
        b.score - a.score ||
        (b.site.workspace === activeWorkspace) - (a.site.workspace === activeWorkspace) ||
        (siteStats[b.site.id]?.count || 0) - (siteStats[a.site.id]?.count || 0))
      .slice(0, 6)
      .forEach(({ site }) => items.push(siteItem(site)))

    // — Ações —
    actions.filter((a) => matches(`${a.title} ${a.keywords || ''}`, q)).slice(0, 6).forEach((a) => items.push(a))

    // — Sempre por último: pesquisar na web / perguntar à IA —
    const provider = searchProviders[searchProvider]
    items.push(provider.type === 'ai'
      ? {
        id: 'web', icon: Search, title: `Perguntar à IA: ${q}`, hint: 'AI Chat',
        run: () => { store.setInitialChatMessage(q); store.openChat() },
      }
      : {
        id: 'web', icon: Search, title: `Pesquisar “${q}”`, hint: provider.name,
        run: () => openUrl(provider.url + encodeURIComponent(q), openInNewTab),
      })

    return items

    function siteItem(site) {
      const ws = site.workspace !== activeWorkspace ? workspaces.find((w) => w.id === site.workspace)?.name : null
      return {
        id: `site-${site.id}`, site, title: site.name,
        hint: ws ? `${ws}${site.shortcut ? ` · ${site.shortcut}` : ''}` : site.shortcut ? `tecla ${site.shortcut}` : 'site',
        run: () => openSite(site, openInNewTab),
      }
    }
  }, [q, sites, siteStats, workspaces, activeWorkspace, widgets, openInNewTab, searchProvider, ambientPlaying, currency, currencyKey, rate])

  useEffect(() => { setSelected(0) }, [q])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const run = (item) => {
    if (!item?.run) return
    onClose()
    item.run()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(results[selected])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-start justify-center pt-[12vh] px-4 modal-backdrop" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-slideIn"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Paleta de comandos"
      >
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Command size={18} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Busque um site, crie uma tarefa, calcule…"
            aria-label="Comando"
            aria-activedescendant={results[selected] ? `cmd-${results[selected].id}` : undefined}
            className="flex-1 min-w-0 py-4 bg-transparent text-text placeholder-muted text-base focus:outline-none"
          />
          <kbd className="hidden sm:block px-1.5 py-0.5 bg-border rounded text-[10px] text-muted">Esc</kbd>
        </div>

        <ul ref={listRef} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {results.map((item, i) => {
            const Icon = item.icon || Globe
            const active = i === selected
            return (
              <li
                key={item.id}
                id={`cmd-${item.id}`}
                role="option"
                aria-selected={active}
                data-active={active}
                onMouseMove={() => setSelected(i)}
                onClick={() => run(item)}
                className={`palette-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${
                  item.run ? '' : 'opacity-60 cursor-default'
                }`}
              >
                <span className="w-5 h-5 shrink-0 flex items-center justify-center text-muted">
                  {item.site ? (
                    <SiteIcon
                      name={item.site.name}
                      url={item.site.url}
                      alt=""
                      imgClassName="w-4 h-4 rounded-sm"
                      fallbackClassName="w-4 h-4 rounded-sm bg-border text-[9px] text-text"
                    />
                  ) : (
                    <Icon size={16} className={active ? 'text-accent' : ''} />
                  )}
                </span>
                <span className="flex-1 min-w-0 truncate text-sm text-text">{item.title}</span>
                {item.hint && <span className="shrink-0 text-[11px] text-muted">{item.hint}</span>}
                {active && item.run && <CornerDownLeft size={12} className="shrink-0 text-muted" />}
              </li>
            )
          })}
        </ul>

        {!q && (
          <div className="px-4 py-3 border-t border-border flex flex-wrap gap-x-4 gap-y-1.5">
            {EXAMPLES.map(([example, label]) => (
              <button
                key={example}
                onClick={() => { setQuery(example); inputRef.current?.focus() }}
                className="text-[11px] text-muted hover:text-text transition-colors"
              >
                <code className="px-1 py-0.5 bg-border rounded text-text">{example}</code> {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
