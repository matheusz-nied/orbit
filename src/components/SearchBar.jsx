import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import useStore, { searchProviders } from '../store/useStore'
import { openUrl } from '../utils/navigation'

export default function SearchBar() {
  const { searchProvider, searchQuery, setSearchQuery, cycleSearchProvider, openChat, setInitialChatMessage, openInNewTab, sites, activeCategory } = useStore()
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

  const normalizedQuery = localQuery.trim().toLowerCase()
  const filteredCount = normalizedQuery
    ? sites.filter(site => {
      if (activeCategory !== 'all' && site.category !== activeCategory) {
        return false
      }

      return site.name.toLowerCase().includes(normalizedQuery) || site.url.toLowerCase().includes(normalizedQuery)
    }).length
    : (activeCategory === 'all'
      ? sites.length
      : sites.filter(site => site.category === activeCategory).length)

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
        setTheme('hacking')
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
    <div className="w-full max-w-2xl mx-auto px-4 mb-8 animate-fadeIn">
      <div className="flex items-center justify-center gap-2 mb-3 mr-7">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer hover:scale-105 transition-transform"
          style={{ backgroundColor: provider.color + '20', color: provider.color }}
          onClick={cycleSearchProvider}
          title="Clique ou pressione Tab para trocar"
        >
          <span className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold"
            style={{ backgroundColor: provider.color, color: '#fff' }}>
            {provider.icon}
          </span>
          <span>{provider.name}</span>
        </div>
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Digite para filtrar sites ou pesquise na web com Enter"
          className="w-full pl-4 pr-24 py-[0.625rem] bg-card border border-border rounded-xl text-text placeholder-muted text-lg focus:border-accent transition-colors"
        />

        {localQuery && (
          <button
            className="absolute right-14 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-text transition-colors"
            onClick={clearQuery}
            aria-label="Limpar pesquisa"
          >
            <X size={16} />
          </button>
        )}

        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-accent transition-colors"
          onClick={handleSubmit}
          aria-label={provider.type === 'ai' ? 'Abrir chat IA' : 'Pesquisar na web'}
        >
          <Search size={20} />
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-1 text-center">
        <p className="text-sm text-muted">
          {normalizedQuery
            ? `${filteredCount} ${filteredCount === 1 ? 'site encontrado' : 'sites encontrados'} na grade`
            : `${activeCategory === 'all' ? sites.length : filteredCount} ${filteredCount === 1 ? 'site visível' : 'sites visíveis'} agora`}
        </p>
        <p className="text-center text-muted text-sm">
          <kbd className="px-1.5 py-0.5 bg-border rounded text-xs">Tab</kbd> ou clique no provedor para trocar ·
          <kbd className="px-1.5 py-0.5 bg-border rounded text-xs ml-1">Enter</kbd> {provider.type === 'ai' ? 'para abrir o chat' : `para pesquisar com ${provider.name}`}
        </p>
      </div>
    </div>
  )
}
