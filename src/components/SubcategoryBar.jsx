import { useState, useRef, useEffect, useMemo } from 'react'
import { CornerDownRight, Plus, X } from 'lucide-react'
import useStore from '../store/useStore'

const EMPTY = []

function Count({ value }) {
  return value ? <span className="tabular-nums opacity-60">{value}</span> : null
}

export default function SubcategoryBar({ category }) {
  const subcategories = useStore((state) => state.subcategories[category] || EMPTY)
  const activeSubcategory = useStore((state) => state.activeSubcategory)
  const setActiveSubcategory = useStore((state) => state.setActiveSubcategory)
  const addSubcategory = useStore((state) => state.addSubcategory)
  const sites = useStore((state) => state.sites)
  const activeWorkspace = useStore((state) => state.activeWorkspace)

  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  // Contagem por subcategoria no espaço atual — ajuda a achar o projeto certo.
  const counts = useMemo(() => {
    const result = {}
    for (const site of sites) {
      if (site.workspace !== activeWorkspace || site.category !== category) continue
      result.__all = (result.__all || 0) + 1
      if (site.subcategory) result[site.subcategory] = (result[site.subcategory] || 0) + 1
    }
    return result
  }, [sites, activeWorkspace, category])

  const commit = () => {
    const created = addSubcategory(category, draft)
    if (created) setActiveSubcategory(created)
    setDraft('')
    setAdding(false)
  }

  const cancel = () => {
    setDraft('')
    setAdding(false)
  }

  // O estado ativo (tinta translúcida do accent) fica em index.css:
  // `.orbit-subcategory-chip[data-active="true"]`.
  const chipClass = (active) =>
    `orbit-subcategory-chip flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border border-transparent transition-colors ${
      active ? 'text-accent' : 'text-muted hover:text-text hover:bg-card'
    }`

  return (
    <div className="orbit-subcategory-bar flex items-center gap-1 overflow-x-auto scrollbar-hide pl-3 pb-1 animate-fadeIn">
      <CornerDownRight size={14} className="text-muted opacity-60 shrink-0 mr-1" aria-hidden />

      {subcategories.length > 0 && (
        <button
          onClick={() => setActiveSubcategory(null)}
          className={chipClass(!activeSubcategory)}
          data-active={!activeSubcategory}
        >
          Tudo
          <Count value={counts.__all} />
        </button>
      )}

      {subcategories.map(sub => (
        <button
          key={sub}
          onClick={() => setActiveSubcategory(activeSubcategory === sub ? null : sub)}
          className={chipClass(activeSubcategory === sub)}
          data-active={activeSubcategory === sub}
        >
          {sub}
          <Count value={counts[sub]} />
        </button>
      ))}

      {adding ? (
        <div className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full border border-accent bg-card shrink-0">
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') cancel()
            }}
            onBlur={() => (draft.trim() ? commit() : cancel())}
            maxLength={32}
            placeholder="Nome do projeto…"
            className="w-36 bg-transparent text-xs text-text placeholder-muted outline-none"
          />
          <button
            onMouseDown={e => e.preventDefault()}
            onClick={cancel}
            className="p-0.5 text-muted hover:text-text"
            aria-label="Cancelar"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-muted border border-dashed border-border hover:text-text hover:border-accent transition-colors whitespace-nowrap shrink-0"
          title="Criar subcategoria"
        >
          <Plus size={12} />
          {subcategories.length === 0 && 'Subcategoria'}
        </button>
      )}
    </div>
  )
}
