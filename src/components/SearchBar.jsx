import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, ChevronRight } from 'lucide-react'
import useStore, { searchProviders } from '../store/useStore'
import { openUrl } from '../utils/navigation'
import { FREQUENT_CATEGORY, FREQUENT_LIMIT, rankByUsage } from '../utils/frequent'
import { FOCUS_SEARCH_EVENT } from '../hooks/useKeyboardShortcuts'

export default function SearchBar() {
  const searchProvider = useStore((state) => state.searchProvider)
  const searchQuery = useStore((state) => state.searchQuery)
  const setSearchQuery = useStore((state) => state.setSearchQuery)
  const cycleSearchProvider = useStore((state) => state.cycleSearchProvider)
  const openChat = useStore((state) => state.openChat)
  const setInitialChatMessage = useStore((state) => state.setInitialChatMessage)
  const openInNewTab = useStore((state) => state.openInNewTab)
  const setTheme = useStore((state) => state.setTheme)
  const sites = useStore((state) => state.sites)
  const activeCategory = useStore((state) => state.activeCategory)
  const activeWorkspace = useStore((state) => state.activeWorkspace)
  const siteStats = useStore((state) => state.siteStats)
  const searchHintDismissed = useStore((state) => state.searchHintDismissed)
  const dismissSearchHint = useStore((state) => state.dismissSearchHint)

  const [localQuery, setLocalQuery] = useState('')
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const provider = searchProviders[searchProvider]

  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const onFocusSearch = () => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    window.addEventListener(FOCUS_SEARCH_EVENT, onFocusSearch)
    return () => window.removeEventListener(FOCUS_SEARCH_EVENT, onFocusSearch)
  }, [])

  const normalizedQuery = localQuery.trim().toLowerCase()

  const filteredCount = useMemo(() => {
    const inScope = sites.filter(site => site.workspace === activeWorkspace)

    // "Frequentes" é uma visão derivada do uso, não uma categoria real.
    const inCategory = activeCategory === FREQUENT_CATEGORY
      ? rankByUsage(inScope, siteStats).slice(0, FREQUENT_LIMIT)
      : activeCategory === 'all'
        ? inScope
        : inScope.filter(site => site.category === activeCategory)

    if (!normalizedQuery) return inCategory.length

    return inCategory.filter(site =>
      site.name.toLowerCase().includes(normalizedQuery) ||
      site.url.toLowerCase().includes(normalizedQuery)
    ).length
  }, [normalizedQuery, sites, activeCategory, activeWorkspace, siteStats])

  const handleChange = (e) => {
    const value = e.target.value
    setLocalQuery(value)

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value)
    }, 150)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      cycleSearchProvider()
    } else if (e.key === 'Enter' && localQuery.trim()) {
      const q = localQuery.trim().toLowerCase()

      // Easter Eggs
      if (q === 'do a barrel roll') {
        document.body.classList.add('animate-barrel-roll')
        setTimeout(() => document.body.classList.remove('animate-barrel-roll'), 2000)
        setLocalQuery('')
        setSearchQuery('')
        return
      }

      if (q === 'sudo rm -rf /') {
        setTheme('crt')
        document.body.classList.add('animate-shake')
        setTimeout(() => document.body.classList.remove('animate-shake'), 1000)
        setLocalQuery('')
        setSearchQuery('')
        return
      }

      // Normal Search Behavior
      if (provider.type === 'ai') {
        setInitialChatMessage(localQuery.trim())
        setLocalQuery('')
        setSearchQuery('')
        openChat()
      } else {
        openUrl(provider.url + encodeURIComponent(localQuery.trim()), openInNewTab)
      }
    }
  }

  const handleSubmit = () => {
    if (!localQuery.trim()) {
      inputRef.current?.focus()
      return
    }

    if (provider.type === 'ai') {
      setInitialChatMessage(localQuery.trim())
      setLocalQuery('')
      setSearchQuery('')
      openChat()
      return
    }

    openUrl(provider.url + encodeURIComponent(localQuery.trim()), openInNewTab)
  }

  const clearQuery = () => {
    setLocalQuery('')
    setSearchQuery('')
    inputRef.current?.focus()
  }

  return (
    <div className="orbit-search-section w-full max-w-2xl mx-auto px-4 mb-10 animate-fadeIn">
      <div className="orbit-search relative">
        {/* Brilho na cor do provedor atrás do ícone — estático, sem animação. */}
        <div
          className="absolute inset-y-0 left-0 w-44 rounded-l-xl pointer-events-none"
          style={{ background: `radial-gradient(ellipse 80% 110% at 12% 50%, ${provider.color}80, ${provider.color}33 25%, ${provider.color}0a 55%, transparent 80%)` }}
          aria-hidden
        />

        <button
          type="button"
          className="orbit-search-provider absolute z-10 left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform"
          onClick={cycleSearchProvider}
          title={`Buscando com ${provider.name} — clique ou pressione Tab para trocar de provedor`}
          aria-label={`Provedor de busca: ${provider.name}. Clique para trocar`}
        >
          <span
            className="w-6 h-6 flex items-center justify-center rounded-md text-[11px] font-bold"
            style={{ backgroundColor: provider.color, color: '#fff' }}
          >
            {provider.icon}
          </span>
          <ChevronRight size={12} className="text-muted" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={provider.type === 'ai' ? 'Pergunte à IA ou filtre sites' : `Pesquisar com ${provider.name} ou filtrar sites`}
          className="w-full pl-14 pr-24 py-[0.625rem] bg-card border border-border rounded-xl text-text placeholder-muted text-lg focus:border-accent transition-colors"
        />

        {localQuery && (
          <button
            className="absolute z-10 right-14 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-text transition-colors"
            onClick={clearQuery}
            aria-label="Limpar pesquisa"
          >
            <X size={16} />
          </button>
        )}

        <button
          className="absolute z-10 right-4 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-accent transition-colors"
          onClick={handleSubmit}
          aria-label={provider.type === 'ai' ? 'Abrir chat IA' : 'Pesquisar na web'}
        >
          <Search size={20} />
        </button>
      </div>

      {/* Sempre visível para quem ainda não conhece os atalhos, mas discreta
          até o usuário começar a digitar. Pode ser dispensada de vez — fica
          salvo no navegador para não voltar a aparecer. */}
      {!searchHintDismissed && (
        <p className={`mt-2 flex items-center justify-center gap-1.5 text-center text-muted text-xs transition-opacity ${localQuery ? 'opacity-100' : 'opacity-60'}`}>
          <span>
            <kbd className="px-1.5 py-0.5 bg-border rounded text-[10px]">Tab</kbd> ou clique no provedor para trocar ·
            <kbd className="px-1.5 py-0.5 bg-border rounded text-[10px] ml-1">Enter</kbd> {provider.type === 'ai' ? 'para abrir o chat' : `para pesquisar com ${provider.name}`}
          </span>
          <button
            onClick={dismissSearchHint}
            className="p-0.5 text-muted hover:text-text transition-colors shrink-0"
            aria-label="Não mostrar mais esta dica"
            title="Não mostrar mais esta dica"
          >
            <X size={12} />
          </button>
        </p>
      )}
    </div>
  )
}
